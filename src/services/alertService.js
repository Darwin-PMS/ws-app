// Alert Service
// Handles real-time alerts for behavior anomalies and trusted contacts notification

import * as Notifications from 'expo-notifications';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import behaviorApiService from './behaviorApiService';
import sosService from './sosService';

const STORAGE_KEYS = {
    LAST_ALERT_TIME: '@last_alert_time',
    ALERT_COOLDOWN: 60000, // 1 minute cooldown between alerts
};

class AlertService {
    constructor() {
        this.alertCallbacks = new Map();
        this.isActive = false;
        this.lastAlertTime = 0;
    }

    // ========================
    // Initialization
    // ========================

    async initialize() {
        // Configure notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();

        return status === 'granted';
    }

    // ========================
    // Trigger Alert
    // ========================

    async triggerAlert(anomaly) {
        // Check cooldown
        const now = Date.now();
        if (now - this.lastAlertTime < STORAGE_KEYS.ALERT_COOLDOWN) {
            console.log('Alert cooldown active, skipping');
            return { success: false, reason: 'cooldown' };
        }

        this.lastAlertTime = now;
        this.isActive = true;

        try {
            // Determine alert severity and action
            const action = this.determineAlertAction(anomaly);

            // Send to backend
            const backendResult = await behaviorApiService.resolveAlert(
                anomaly.id,
                'acknowledged',
                'Auto-acknowledged from device'
            );

            // Take action based on severity
            switch (action.type) {
                case 'sos':
                    await this.triggerSOS(anomaly);
                    break;
                case 'trusted_contact':
                    await this.notifyTrustedContacts(anomaly);
                    break;
                case 'notification':
                    await this.sendLocalNotification(anomaly);
                    break;
                default:
                    console.log('No alert action needed');
            }

            // Notify listeners
            this.notifyAlertListeners(anomaly, action);

            return { success: true, action };
        } catch (error) {
            console.error('Trigger alert error:', error);
            return { success: false, error: error.message };
        } finally {
            this.isActive = false;
        }
    }

    // ========================
    // Determine Alert Action
    // ========================

    determineAlertAction(anomaly) {
        const severity = anomaly.severity || anomaly.type?.severity;

        switch (severity) {
            case 'critical':
                return {
                    type: 'sos',
                    priority: 1,
                    message: 'Critical anomaly detected - triggering SOS'
                };
            case 'high':
                return {
                    type: 'trusted_contact',
                    priority: 2,
                    message: 'High severity - notifying trusted contacts'
                };
            case 'medium':
                return {
                    type: 'notification',
                    priority: 3,
                    message: 'Medium severity - sending notification'
                };
            default:
                return {
                    type: 'log',
                    priority: 4,
                    message: 'Low severity - logging only'
                };
        }
    }

    // ========================
    // Trigger SOS
    // ========================

    async triggerSOS(anomaly) {
        const location = anomaly.location || anomaly.contextData?.location;

        try {
            const result = await sosService.triggerSOS({
                latitude: location?.latitude,
                longitude: location?.longitude,
                message: `Safety Alert: ${anomaly.type} detected. ${anomaly.aiAnalysis || ''}`,
                isAutomatic: true
            });

            // Also send SMS to emergency contacts
            await this.sendEmergencySMS(anomaly, location);

            return result;
        } catch (error) {
            console.error('SOS trigger error:', error);
            throw error;
        }
    }

    // ========================
    // Notify Trusted Contacts
    // ========================

    async notifyTrustedContacts(anomaly) {
        const location = anomaly.location || anomaly.contextData?.location;

        // Get user settings
        const settingsResult = await behaviorApiService.getSettings();
        const settings = settingsResult.data || {};

        if (!settings.privacySettings?.shareWithContacts) {
            console.log('Contact sharing disabled in settings');
            return { success: false, reason: 'disabled' };
        }

        // Prepare message
        const message = this.formatAlertMessage(anomaly, location);

        // Check if SMS is available
        const isAvailable = await SMS.isAvailableAsync();

        if (isAvailable) {
            // Get emergency contacts
            // Note: In real implementation, fetch from emergency contacts service
            const contacts = await this.getEmergencyContacts();

            if (contacts.length > 0) {
                const result = await SMS.sendSMSAsync(
                    contacts.map(c => c.phone),
                    message,
                    {
                        attachments: location ? {
                            uri: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
                            mimeType: 'text/plain',
                            filename: 'location.txt'
                        } : undefined
                    }
                );

                return result;
            }
        }

        // Fallback to push notifications
        await this.sendPushNotificationToContacts(anomaly, message);

        return { success: true };
    }

    // ========================
    // Send Emergency SMS
    // ========================

    async sendEmergencySMS(anomaly, location) {
        const message = `EMERGENCY ALERT!\n\n${anomaly.type} detected.\nLocation: ${location ? `${location.latitude}, ${location.longitude}` : 'Unknown'}\nMap: https://maps.google.com/?q=${location?.latitude},${location?.longitude}`;

        const contacts = await this.getEmergencyContacts();

        if (contacts.length > 0 && await SMS.isAvailableAsync()) {
            await SMS.sendSMSAsync(
                contacts.map(c => c.phone),
                message
            );
        }
    }

    // ========================
    // Get Emergency Contacts
    // ========================

    async getEmergencyContacts() {
        // Fetch from AsyncStorage or emergency contacts service
        // This is a placeholder - implement with actual service
        try {
            const contactsJson = await AsyncStorage.getItem('@emergency_contacts');
            if (contactsJson) {
                return JSON.parse(contactsJson);
            }
        } catch (e) {
            console.error('Error getting contacts:', e);
        }
        return [];
    }

    // ========================
    // Format Alert Message
    // ========================

    formatAlertMessage(anomaly, location) {
        const typeLabels = {
            unexpected_stop: 'Unusual Stop',
            route_deviation: 'Route Deviation',
            unusual_inactivity: 'No Movement',
            abnormal_speed: 'Abnormal Speed',
            fall_detected: 'Fall Detected'
        };

        const type = typeLabels[anomaly.type] || anomaly.type;
        const locationText = location
            ? `Location: ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`
            : 'Location: Unknown';

        return `Safety Alert: ${type} detected.\n\n${locationText}\n\nTap to view details.`;
    }

    // ========================
    // Local Notifications
    // ========================

    async sendLocalNotification(anomaly) {
        const typeLabels = {
            unexpected_stop: 'Unusual Stop Detected',
            route_deviation: 'Route Deviation',
            unusual_inactivity: 'No Movement Detected',
            abnormal_speed: 'Abnormal Speed'
        };

        await Notifications.scheduleNotificationAsync({
            content: {
                title: typeLabels[anomaly.type] || 'Safety Alert',
                body: this.formatAlertMessage(anomaly, anomaly.location),
                data: { anomaly },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
        });
    }

    // ========================
    // Push Notifications to Contacts
    // ========================

    async sendPushNotificationToContacts(anomaly, message) {
        // In a real implementation, this would send push notifications
        // via a backend service to the trusted contacts' devices
        console.log('Sending push notification to contacts:', message);
    }

    // ========================
    // Alert Listeners
    // ========================

    onAlert(callback) {
        const id = Date.now().toString();
        this.alertCallbacks.set(id, callback);

        return () => {
            this.alertCallbacks.delete(id);
        };
    }

    notifyAlertListeners(anomaly, action) {
        for (const callback of this.alertCallbacks.values()) {
            try {
                callback(anomaly, action);
            } catch (e) {
                console.error('Alert listener error:', e);
            }
        }
    }

    // ========================
    // Acknowledge Alert
    // ========================

    async acknowledgeAlert(anomalyId) {
        try {
            await behaviorApiService.resolveAlert(
                anomalyId,
                'acknowledged',
                'User acknowledged alert on device'
            );
            return { success: true };
        } catch (error) {
            console.error('Acknowledge error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================
    // Get Alert Status
    // ========================

    async getAlerts(params = {}) {
        try {
            const result = await behaviorApiService.getAlerts(params);
            return result;
        } catch (error) {
            console.error('Get alerts error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new AlertService();
