// Parked Car Location Memory Service
// Automatically save parking location and share with trusted contacts

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as SMS from 'expo-sms';

const PARKING_STORAGE_KEY = '@parked_car_location';
const PARKING_HISTORY_KEY = '@parking_history';

class ParkedCarService {
    constructor() {
        this.currentParking = null;
        this.parkingHistory = [];
        this.autoSaveEnabled = false;
        this.sharingEnabled = true;
        this.trustedContacts = [];
        this.walkHomeReminderEnabled = true;
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        await this.loadParkingData();
        await this.loadTrustedContacts();
        await this.setupNotifications();
    }

    async setupNotifications() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status !== 'granted') {
                return { success: false, message: 'Notification permission denied' };
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('parking', {
                    name: 'Parking Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== PARKING DATA MANAGEMENT ====================

    async loadParkingData() {
        try {
            // Load current parking
            const currentStored = await AsyncStorage.getItem(PARKING_STORAGE_KEY);
            if (currentStored) {
                this.currentParking = JSON.parse(currentStored);
            }

            // Load history
            const historyStored = await AsyncStorage.getItem(PARKING_HISTORY_KEY);
            if (historyStored) {
                this.parkingHistory = JSON.parse(historyStored);
            }
        } catch (error) {
            console.error('Error loading parking data:', error);
        }

        return {
            current: this.currentParking,
            history: this.parkingHistory,
        };
    }

    async saveCurrentParking() {
        try {
            if (this.currentParking) {
                await AsyncStorage.setItem(
                    PARKING_STORAGE_KEY,
                    JSON.stringify(this.currentParking)
                );
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async saveToHistory(parking) {
        try {
            this.parkingHistory.unshift({
                ...parking,
                savedAt: Date.now(),
            });

            // Keep last 50 entries
            if (this.parkingHistory.length > 50) {
                this.parkingHistory = this.parkingHistory.slice(0, 50);
            }

            await AsyncStorage.setItem(
                PARKING_HISTORY_KEY,
                JSON.stringify(this.parkingHistory)
            );

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== PARKING LOCATION ====================

    async saveParkingLocation(options = {}) {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return { success: false, message: 'Location permission denied' };
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Get address from coordinates
            const addressData = await this.getAddressFromCoordinates(
                location.coords.latitude,
                location.coords.longitude
            );

            const parking = {
                id: Date.now().toString(),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                address: addressData.formatted || 'Unknown location',
                floor: options.floor || null,
                section: options.section || null,
                notes: options.notes || '',
                photo: options.photo || null,
                savedAt: Date.now(),
                retrievedAt: null,
                sharedWith: [],
            };

            // Save as current parking
            this.currentParking = parking;
            await this.saveCurrentParking();

            // Send confirmation notification
            await this.sendParkingSavedNotification(parking);

            return {
                success: true,
                parking,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async autoSaveParkingLocation() {
        if (!this.autoSaveEnabled) {
            return { success: false, message: 'Auto-save is disabled' };
        }

        // Check if already parked
        if (this.currentParking) {
            const age = Date.now() - this.currentParking.savedAt;
            if (age < 5 * 60 * 1000) { // Less than 5 minutes old
                return { success: false, message: 'Already have recent parking location' };
            }
        }

        return await this.saveParkingLocation();
    }

    async retrieveParkingLocation() {
        if (!this.currentParking) {
            return { success: false, message: 'No parking location saved' };
        }

        return {
            success: true,
            parking: this.currentParking,
        };
    }

    async clearParkingLocation() {
        if (this.currentParking) {
            // Add to history before clearing
            await this.saveToHistory(this.currentParking);
            
            this.currentParking = null;
            await AsyncStorage.removeItem(PARKING_STORAGE_KEY);
        }

        return { success: true };
    }

    getCurrentParking() {
        return this.currentParking;
    }

    getParkingHistory(limit = 10) {
        return this.parkingHistory.slice(0, limit);
    }

    // ==================== ADDRESS GEOCODING ====================

    async getAddressFromCoordinates(latitude, longitude) {
        try {
            // Using expo-location reverse geocoding
            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (results.length > 0) {
                const address = results[0];
                return {
                    street: address.street,
                    city: address.city,
                    region: address.region,
                    country: address.country,
                    postalCode: address.postalCode,
                    name: address.name,
                    formatted: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
                };
            }
            return { formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
        } catch (error) {
            console.error('Get address error:', error);
            return { formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
        }
    }

    // ==================== SHARING ====================

    async loadTrustedContacts() {
        try {
            const stored = await AsyncStorage.getItem('@trusted_contacts');
            if (stored) {
                this.trustedContacts = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading trusted contacts:', error);
        }
        return this.trustedContacts;
    }

    async addTrustedContact(contact) {
        const newContact = {
            id: Date.now().toString(),
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship || 'friend',
        };

        this.trustedContacts.push(newContact);
        
        try {
            await AsyncStorage.setItem('@trusted_contacts', JSON.stringify(this.trustedContacts));
        } catch (error) {
            console.error('Error saving trusted contact:', error);
        }

        return { success: true, contact: newContact };
    }

    async removeTrustedContact(contactId) {
        this.trustedContacts = this.trustedContacts.filter(c => c.id !== contactId);
        
        try {
            await AsyncStorage.setItem('@trusted_contacts', JSON.stringify(this.trustedContacts));
        } catch (error) {
            console.error('Error removing trusted contact:', error);
        }

        return { success: true };
    }

    async shareParkingLocation(contactIds = []) {
        if (!this.currentParking) {
            return { success: false, message: 'No parking location to share' };
        }

        const contacts = contactIds.length > 0
            ? this.trustedContacts.filter(c => contactIds.includes(c.id))
            : this.trustedContacts;

        if (contacts.length === 0) {
            return { success: false, message: 'No trusted contacts available' };
        }

        const shareResults = [];

        for (const contact of contacts) {
            try {
                const message = this.buildShareMessage(contact.name);
                
                // Send SMS
                const isAvailable = await SMS.isAvailableAsync();
                
                if (isAvailable) {
                    const { result } = await SMS.sendSMSAsync(
                        contact.phone,
                        message
                    );
                    
                    shareResults.push({
                        contactId: contact.id,
                        contactName: contact.name,
                        success: result === 'sent',
                        method: 'sms',
                    });

                    // Update parking sharedWith
                    if (result === 'sent') {
                        this.currentParking.sharedWith.push({
                            contactId: contact.id,
                            contactName: contact.name,
                            sharedAt: Date.now(),
                            method: 'sms',
                        });
                    }
                }
            } catch (error) {
                console.error('Share error:', error);
                shareResults.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    success: false,
                    error: error.message,
                });
            }
        }

        // Save updated parking data
        await this.saveCurrentParking();

        // Send confirmation
        await this.sendShareConfirmationNotification(shareResults.filter(r => r.success).length);

        return {
            success: true,
            results: shareResults,
        };
    }

    buildShareMessage(contactName) {
        const { latitude, longitude, address } = this.currentParking;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        
        return `Hi ${contactName},\n\nI've parked my car at:\n📍 ${address}\n\nYou can find it on Google Maps: ${mapsUrl}\n\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    async shareViaWhatsApp(contactIds = []) {
        if (!this.currentParking) {
            return { success: false, message: 'No parking location to share' };
        }

        const contacts = contactIds.length > 0
            ? this.trustedContacts.filter(c => contactIds.includes(c.id))
            : this.trustedContacts;

        if (contacts.length === 0) {
            return { success: false, message: 'No contacts available' };
        }

        const { latitude, longitude, address } = this.currentParking;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        const message = `🚗 My Car Location:\n📍 ${address}\n\n${mapsUrl}`;

        const shareResults = [];

        for (const contact of contacts) {
            try {
                // Open WhatsApp with pre-filled message
                const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                
                const canOpen = await Linking.canOpenURL(whatsappUrl);
                if (canOpen) {
                    await Linking.openURL(whatsappUrl);
                    
                    shareResults.push({
                        contactId: contact.id,
                        contactName: contact.name,
                        success: true,
                        method: 'whatsapp',
                    });
                }
            } catch (error) {
                shareResults.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    success: false,
                    error: error.message,
                });
            }
        }

        return {
            success: true,
            results: shareResults,
        };
    }

    // ==================== NAVIGATION ====================

    async openNavigationToCar() {
        if (!this.currentParking) {
            return { success: false, message: 'No parking location saved' };
        }

        const { latitude, longitude } = this.currentParking;
        const scheme = Platform.select({
            ios: 'maps:',
            android: 'geo:',
        });

        const url = Platform.select({
            ios: `maps:?daddr=${latitude},${longitude}&dirflg=d`,
            android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(My Car)`,
        });

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                return { success: true };
            }

            // Fallback to Google Maps web
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            await Linking.openURL(webUrl);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getDistanceToCar() {
        if (!this.currentParking) {
            return null;
        }

        // This would need current location - should be called with location param
        return null;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // ==================== WALK HOME REMINDER ====================

    async enableWalkHomeReminder() {
        this.walkHomeReminderEnabled = true;
        return { success: true };
    }

    async disableWalkHomeReminder() {
        this.walkHomeReminderEnabled = false;
        return { success: true };
    }

    async sendWalkHomeReminder() {
        if (!this.walkHomeReminderEnabled || !this.currentParking) {
            return { success: false, message: 'Reminder disabled or no parking saved' };
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚗 Walking to Your Car?',
                    body: `Remember your car is parked at ${this.currentParking.address}. Share your location with a trusted contact for safety.`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.DEFAULT,
                    data: {
                        type: 'parking_reminder',
                        parkingId: this.currentParking.id,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== NOTIFICATIONS ====================

    async sendParkingSavedNotification(parking) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🅿️ Parking Location Saved',
                    body: `Your car location has been saved at ${parking.address}`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.DEFAULT,
                    data: {
                        type: 'parking_saved',
                        parkingId: parking.id,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            console.error('Send parking notification error:', error);
            return { success: false, message: error.message };
        }
    }

    async sendShareConfirmationNotification(count) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📤 Location Shared',
                    body: `Parking location shared with ${count} contact${count > 1 ? 's' : ''}`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.DEFAULT,
                    data: {
                        type: 'parking_shared',
                        count,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== SETTINGS ====================

    async enableAutoSave() {
        this.autoSaveEnabled = true;
        return { success: true };
    }

    async disableAutoSave() {
        this.autoSaveEnabled = false;
        return { success: true };
    }

    getSettings() {
        return {
            autoSaveEnabled: this.autoSaveEnabled,
            sharingEnabled: this.sharingEnabled,
            walkHomeReminderEnabled: this.walkHomeReminderEnabled,
            trustedContactsCount: this.trustedContacts.length,
        };
    }

    // ==================== UTILS ====================

    async clearAllData() {
        this.currentParking = null;
        this.parkingHistory = [];
        this.trustedContacts = [];

        await AsyncStorage.multiRemove([
            PARKING_STORAGE_KEY,
            PARKING_HISTORY_KEY,
            '@trusted_contacts',
        ]);

        return { success: true };
    }

    getStats() {
        return {
            totalSaved: this.parkingHistory.length + (this.currentParking ? 1 : 0),
            currentParking: !!this.currentParking,
            trustedContacts: this.trustedContacts.length,
        };
    }
}

export default new ParkedCarService();
