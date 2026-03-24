// Battery Service
// Monitors battery level and notifies emergency contacts when critically low

import * as Battery from 'expo-battery';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BatteryService {
    constructor() {
        this.batteryLevel = 100;
        this.batteryState = Battery.BatteryState.UNKNOWN;
        this.isMonitoring = false;
        this.batterySubscription = null;
        this.lowBatteryAlertSent = false;
        this.criticalBatteryAlertSent = false;
        this.lastBatteryCheck = null;

        // Configurable thresholds
        this.LOW_BATTERY_THRESHOLD = 0.20; // 20%
        this.CRITICAL_BATTERY_THRESHOLD = 0.10; // 10%
        this.BATTERY_CHECK_INTERVAL = 60000; // 1 minute
    }

    // Initialize battery monitoring
    async initialize() {
        try {
            // Get initial battery info
            this.batteryLevel = await this.getBatteryLevelAsync();
            this.batteryState = await this.getBatteryStateAsync();

            return {
                success: true,
                batteryLevel: this.batteryLevel,
                batteryState: this.batteryState
            };
        } catch (error) {
            console.error('Error initializing battery service:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get current battery level (0.0 to 1.0)
    async getBatteryLevelAsync() {
        try {
            const level = await Battery.getBatteryLevelAsync();
            return level >= 0 ? level : 1.0; // Return 1.0 if unknown (desktop)
        } catch (error) {
            console.error('Error getting battery level:', error);
            return 1.0;
        }
    }

    // Get battery charging state
    async getBatteryStateAsync() {
        try {
            return await Battery.getBatteryStateAsync();
        } catch (error) {
            console.error('Error getting battery state:', error);
            return Battery.BatteryState.UNKNOWN;
        }
    }

    // Check if battery is low (below threshold)
    async isLowBattery() {
        const level = await this.getBatteryLevelAsync();
        const state = await this.getBatteryStateAsync();

        return level < this.LOW_BATTERY_THRESHOLD &&
            state !== Battery.BatteryState.CHARGING &&
            state !== Battery.BatteryState.FULL;
    }

    // Check if battery is critical (very low)
    async isCriticalBattery() {
        const level = await this.getBatteryLevelAsync();
        const state = await this.getBatteryStateAsync();

        return level < this.CRITICAL_BATTERY_THRESHOLD &&
            state !== Battery.BatteryState.CHARGING &&
            state !== Battery.BatteryState.FULL;
    }

    // Get battery status summary
    async getBatteryStatus() {
        const level = await this.getBatteryLevelAsync();
        const state = await this.getBatteryStateAsync();

        let status = 'normal';
        let color = '#10B981'; // Green

        if (level < this.CRITICAL_BATTERY_THRESHOLD) {
            status = 'critical';
            color = '#EF4444'; // Red
        } else if (level < this.LOW_BATTERY_THRESHOLD) {
            status = 'low';
            color = '#F59E0B'; // Orange
        }

        return {
            level: Math.round(level * 100),
            state: this.getBatteryStateString(state),
            status,
            color,
            isCharging: state === Battery.BatteryState.CHARGING,
            isFull: state === Battery.BatteryState.FULL
        };
    }

    // Convert battery state to string
    getBatteryStateString(state) {
        switch (state) {
            case Battery.BatteryState.CHARGING:
                return 'Charging';
            case Battery.BatteryState.UNPLUGGED:
                return 'Unplugged';
            case Battery.BatteryState.FULL:
                return 'Full';
            case Battery.BatteryState.UNKNOWN:
            default:
                return 'Unknown';
        }
    }

    // Start monitoring battery level
    startMonitoring(callback) {
        if (this.isMonitoring) {
            console.log('Battery monitoring already active');
            return;
        }

        this.isMonitoring = true;
        this.lowBatteryAlertSent = false;
        this.criticalBatteryAlertSent = false;

        // Listen for battery state changes
        this.batterySubscription = Battery.addBatteryStateListener(async (event) => {
            this.batteryState = event.batteryState;
            this.batteryLevel = await this.getBatteryLevelAsync();

            console.log('Battery state changed:', {
                level: this.batteryLevel,
                state: this.batteryState
            });

            // Trigger callback if provided
            if (callback) {
                const status = await this.getBatteryStatus();
                callback(status);
            }
        });

        console.log('Battery monitoring started');
    }

    // Stop monitoring battery
    stopMonitoring() {
        if (this.batterySubscription) {
            this.batterySubscription.remove();
            this.batterySubscription = null;
        }
        this.isMonitoring = false;
        console.log('Battery monitoring stopped');
    }

    // Send low battery alert to emergency contacts
    async sendLowBatteryAlert(emergencyContacts, userName) {
        if (emergencyContacts.length === 0) {
            console.log('No emergency contacts to notify');
            return { success: false, error: 'No emergency contacts' };
        }

        // Don't send if already sent
        if (this.lowBatteryAlertSent) {
            console.log('Low battery alert already sent');
            return { success: false, error: 'Alert already sent' };
        }

        try {
            // Get current location
            let locationString = 'Location unavailable';
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                locationString = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
            } catch (locError) {
                console.log('Could not get location for battery alert:', locError.message);
            }

            const phoneNumbers = emergencyContacts.map(c => c.phone);
            const batteryPercent = Math.round(this.batteryLevel * 100);

            const message = `⚠️ LOW BATTERY ALERT ⚠️\n\n` +
                `${userName}'s phone battery is LOW (${batteryPercent}%).\n\n` +
                `Current Location: ${locationString}\n\n` +
                `Time: ${new Date().toLocaleString()}\n\n` +
                `Please be aware that their phone may shut down soon.`;

            // Check if SMS is available
            const isAvailable = await SMS.isAvailableAsync();

            if (isAvailable) {
                const { result } = await SMS.sendSMSAsync(phoneNumbers, message);

                if (result === 'sent' || result === 'unknown') {
                    this.lowBatteryAlertSent = true;
                    console.log('Low battery alert sent successfully');

                    // Store alert state
                    await this.saveAlertState();

                    return { success: true, result };
                }
            } else {
                console.log('SMS not available on this device');
                return { success: false, error: 'SMS not available' };
            }
        } catch (error) {
            console.error('Error sending low battery alert:', error);
            return { success: false, error: error.message };
        }
    }

    // Send critical battery alert to emergency contacts
    async sendCriticalBatteryAlert(emergencyContacts, userName) {
        if (emergencyContacts.length === 0) {
            console.log('No emergency contacts to notify');
            return { success: false, error: 'No emergency contacts' };
        }

        // Don't send if already sent
        if (this.criticalBatteryAlertSent) {
            console.log('Critical battery alert already sent');
            return { success: false, error: 'Alert already sent' };
        }

        try {
            // Get current location
            let locationString = 'Location unavailable';
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                locationString = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
            } catch (locError) {
                console.log('Could not get location for critical battery alert:', locError.message);
            }

            const phoneNumbers = emergencyContacts.map(c => c.phone);
            const batteryPercent = Math.round(this.batteryLevel * 100);

            const message = `🆘 CRITICAL BATTERY ALERT 🆘\n\n` +
                `${userName}'s phone battery is CRITICAL (${batteryPercent}%)!\n\n` +
                `The phone will likely shut down very soon.\n\n` +
                `Last Known Location: ${locationString}\n\n` +
                `Time: ${new Date().toLocaleString()}\n\n` +
                `PLEASE CHECK ON THEM IMMEDIATELY OR CONTACT AUTHORITIES IF NEEDED!`;

            // Check if SMS is available
            const isAvailable = await SMS.isAvailableAsync();

            if (isAvailable) {
                const { result } = await SMS.sendSMSAsync(phoneNumbers, message);

                if (result === 'sent' || result === 'unknown') {
                    this.criticalBatteryAlertSent = true;
                    console.log('Critical battery alert sent successfully');

                    // Store alert state
                    await this.saveAlertState();

                    return { success: true, result };
                }
            } else {
                console.log('SMS not available on this device');
                return { success: false, error: 'SMS not available' };
            }
        } catch (error) {
            console.error('Error sending critical battery alert:', error);
            return { success: false, error: error.message };
        }
    }

    // Save alert state to storage
    async saveAlertState() {
        try {
            const alertState = {
                lowBatteryAlertSent: this.lowBatteryAlertSent,
                criticalBatteryAlertSent: this.criticalBatteryAlertSent,
                lastAlertTime: new Date().toISOString()
            };
            await AsyncStorage.setItem('batteryAlertState', JSON.stringify(alertState));
        } catch (error) {
            console.error('Error saving alert state:', error);
        }
    }

    // Load alert state from storage
    async loadAlertState() {
        try {
            const alertStateJson = await AsyncStorage.getItem('batteryAlertState');
            if (alertStateJson) {
                const alertState = JSON.parse(alertStateJson);

                // Reset if last alert was more than 4 hours ago
                const lastAlertTime = new Date(alertState.lastAlertTime);
                const hoursSinceLastAlert = (new Date() - lastAlertTime) / (1000 * 60 * 60);

                if (hoursSinceLastAlert >= 4) {
                    // Reset alert flags after 4 hours
                    this.lowBatteryAlertSent = false;
                    this.criticalBatteryAlertSent = false;
                    await this.saveAlertState();
                } else {
                    this.lowBatteryAlertSent = alertState.lowBatteryAlertSent;
                    this.criticalBatteryAlertSent = alertState.criticalBatteryAlertSent;
                }

                console.log('Loaded battery alert state:', alertState);
            }
        } catch (error) {
            console.error('Error loading alert state:', error);
        }
    }

    // Reset alert flags (for testing or manual reset)
    async resetAlertFlags() {
        this.lowBatteryAlertSent = false;
        this.criticalBatteryAlertSent = false;
        await this.saveAlertState();
        console.log('Battery alert flags reset');
    }

    // Check and send appropriate battery alert
    async checkAndAlert(emergencyContacts, userName) {
        const isLow = await this.isLowBattery();
        const isCritical = await this.isCriticalBattery();

        // Load previous alert state
        await this.loadAlertState();

        if (isCritical && !this.criticalBatteryAlertSent) {
            console.log('Critical battery level detected!');
            return await this.sendCriticalBatteryAlert(emergencyContacts, userName);
        } else if (isLow && !this.lowBatteryAlertSent && !this.criticalBatteryAlertSent) {
            console.log('Low battery level detected!');
            return await this.sendLowBatteryAlert(emergencyContacts, userName);
        }

        return { success: true, message: 'No alert needed' };
    }

    // Get optimal tracking interval based on battery level
    getOptimalTrackingInterval() {
        if (this.batteryLevel < this.CRITICAL_BATTERY_THRESHOLD) {
            return 60000; // 1 minute - very infrequent
        } else if (this.batteryLevel < this.LOW_BATTERY_THRESHOLD) {
            return 30000; // 30 seconds - less frequent
        } else {
            return 10000; // 10 seconds - normal
        }
    }

    // Determine if background tracking should continue
    shouldContinueTracking() {
        // Don't stop tracking while charging
        if (this.batteryState === Battery.BatteryState.CHARGING) {
            return true;
        }

        // Stop tracking if critical battery
        if (this.batteryLevel < this.CRITICAL_BATTERY_THRESHOLD) {
            return false;
        }

        return true;
    }
}

export default new BatteryService();
