// Geofencing Service for Safe Zones
// Manages safe zones with automatic breach notifications

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const GEOFENCE_STORAGE_KEY = '@safe_zones';

class GeofencingService {
    constructor() {
        this.safeZones = [];
        this.watchId = null;
        this.notificationCallback = null;
        this.locationUpdateInterval = 10000; // 10 seconds
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        await this.loadSafeZones();
        await this.requestPermissions();
        await this.setupNotifications();
    }

    async requestPermissions() {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            
            if (foregroundStatus !== 'granted') {
                return { success: false, message: 'Foreground location permission denied' };
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            
            return {
                success: true,
                foreground: foregroundStatus === 'granted',
                background: backgroundStatus === 'granted',
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async setupNotifications() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status !== 'granted') {
                return { success: false, message: 'Notification permission denied' };
            }

            // Configure Android notification channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('geofence', {
                    name: 'Safe Zone Alerts',
                    importance: Notifications.AndroidImportance.MAX,
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

    // ==================== SAFE ZONE MANAGEMENT ====================

    async loadSafeZones() {
        try {
            const stored = await AsyncStorage.getItem(GEOFENCE_STORAGE_KEY);
            if (stored) {
                this.safeZones = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading safe zones:', error);
            this.safeZones = [];
        }
        return this.safeZones;
    }

    async saveSafeZones() {
        try {
            await AsyncStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(this.safeZones));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async addSafeZone(zone) {
        const newZone = {
            id: Date.now().toString(),
            name: zone.name || 'Safe Zone',
            latitude: zone.latitude,
            longitude: zone.longitude,
            radius: zone.radius || 100, // meters
            type: zone.type || 'home', // home, work, custom
            notificationsEnabled: zone.notificationsEnabled !== false,
            createdAt: Date.now(),
            active: true,
        };

        this.safeZones.push(newZone);
        await this.saveSafeZones();
        
        return { success: true, zone: newZone };
    }

    async removeSafeZone(zoneId) {
        this.safeZones = this.safeZones.filter(z => z.id !== zoneId);
        await this.saveSafeZones();
        return { success: true };
    }

    async updateSafeZone(zoneId, updates) {
        const index = this.safeZones.findIndex(z => z.id === zoneId);
        if (index === -1) {
            return { success: false, message: 'Zone not found' };
        }

        this.safeZones[index] = { ...this.safeZones[index], ...updates };
        await this.saveSafeZones();
        
        return { success: true, zone: this.safeZones[index] };
    }

    getSafeZones() {
        return this.safeZones;
    }

    getActiveSafeZones() {
        return this.safeZones.filter(z => z.active);
    }

    // ==================== DISTANCE CALCULATIONS ====================

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
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

    isPointInSafeZone(latitude, longitude, zone) {
        const distance = this.calculateDistance(
            latitude,
            longitude,
            zone.latitude,
            zone.longitude
        );
        return distance <= zone.radius;
    }

    findNearestSafeZone(latitude, longitude) {
        if (this.safeZones.length === 0) return null;

        let nearest = null;
        let minDistance = Infinity;

        for (const zone of this.safeZones) {
            if (!zone.active) continue;
            
            const distance = this.calculateDistance(
                latitude,
                longitude,
                zone.latitude,
                zone.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...zone, distance };
            }
        }

        return nearest;
    }

    // ==================== GEOFENCE MONITORING ====================

    async startMonitoring(callback) {
        this.notificationCallback = callback;

        const permission = await this.requestPermissions();
        if (!permission.success) {
            return permission;
        }

        // Stop existing monitoring
        await this.stopMonitoring();

        // Start watching location
        this.watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: this.locationUpdateInterval,
                distanceInterval: 20, // 20 meters
            },
            (location) => {
                const { latitude, longitude } = location.coords;
                this.checkGeofenceBreaches(latitude, longitude);
            }
        );

        return { success: true };
    }

    async stopMonitoring() {
        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }
        return { success: true };
    }

    async checkGeofenceBreaches(latitude, longitude) {
        const breaches = [];

        for (const zone of this.safeZones) {
            if (!zone.active || !zone.notificationsEnabled) continue;

            const wasInside = zone.lastKnownInside || false;
            const isInside = this.isPointInSafeZone(latitude, longitude, zone);

            if (wasInside && !isInside) {
                // Exiting safe zone
                breaches.push({
                    type: 'exit',
                    zone,
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                });

                await this.sendBreachNotification('exit', zone);
            } else if (!wasInside && isInside) {
                // Entering safe zone
                breaches.push({
                    type: 'enter',
                    zone,
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                });

                await this.sendBreachNotification('enter', zone);
            }

            // Update last known state
            zone.lastKnownInside = isInside;
        }

        if (breaches.length > 0 && this.notificationCallback) {
            this.notificationCallback(breaches);
        }

        return breaches;
    }

    // ==================== NOTIFICATIONS ====================

    async sendBreachNotification(type, zone) {
        try {
            const title = type === 'enter' 
                ? `✅ Entered ${zone.name}` 
                : `⚠️ Left ${zone.name}`;
            
            const message = type === 'enter'
                ? `You have arrived at ${zone.name}`
                : `You have left ${zone.name}. Stay safe!`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body: message,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: {
                        type: 'geofence_breach',
                        breachType: type,
                        zoneId: zone.id,
                        zoneName: zone.name,
                    },
                },
                trigger: null, // Immediate
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending notification:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== QUICK SAFE ZONES ====================

    async markCurrentLocationAsSafe(name, radius = 100) {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return await this.addSafeZone({
                name,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                radius,
                type: 'custom',
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== PRESET SAFE ZONES ====================

    async addHomeZone(latitude, longitude, radius = 200) {
        return await this.addSafeZone({
            name: 'Home',
            latitude,
            longitude,
            radius,
            type: 'home',
        });
    }

    async addWorkZone(latitude, longitude, radius = 150) {
        return await this.addSafeZone({
            name: 'Work',
            latitude,
            longitude,
            radius,
            type: 'work',
        });
    }

    // ==================== UTILS ====================

    async clearAllZones() {
        this.safeZones = [];
        await this.saveSafeZones();
        return { success: true };
    }

    getZoneStats() {
        const total = this.safeZones.length;
        const active = this.safeZones.filter(z => z.active).length;
        const byType = {
            home: this.safeZones.filter(z => z.type === 'home').length,
            work: this.safeZones.filter(z => z.type === 'work').length,
            custom: this.safeZones.filter(z => z.type === 'custom').length,
        };

        return { total, active, byType };
    }
}

export default new GeofencingService();
