// Volume Button Trigger Service
// Handles volume button press detection for SOS trigger

import { Volume } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const VOLUME_KEY_ENABLED_KEY = '@volume_button_enabled';
const VOLUME_PRESS_COUNT_KEY = '@volume_press_count';
const VOLUME_PRESS_TIME_KEY = '@volume_press_time';
const VOLUME_REQUIRED_COUNT = 5; // Number of presses to trigger SOS
const VOLUME_TIME_WINDOW = 2000; // Time window in ms (2 seconds)

class VolumeButtonService {
    constructor() {
        this.isEnabled = false;
        this.subscription = null;
        this.onTriggerCallback = null;
    }

    async initialize() {
        try {
            // Check if volume listener is supported
            const isSupported = Platform.OS !== 'web';
            
            console.log('Volume Button Service Initialized:', { isSupported });
            return {
                available: isSupported
            };
        } catch (error) {
            console.error('Volume Button initialization error:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    async isVolumeButtonEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(VOLUME_KEY_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            return false;
        }
    }

    async enableVolumeButton() {
        try {
            await AsyncStorage.setItem(VOLUME_KEY_ENABLED_KEY, 'true');
            return { success: true, message: 'Volume button trigger enabled' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async disableVolumeButton() {
        try {
            await AsyncStorage.removeItem(VOLUME_KEY_ENABLED_KEY);
            await this.resetCount();
            return { success: true, message: 'Volume button trigger disabled' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async resetCount() {
        try {
            await AsyncStorage.setItem(VOLUME_PRESS_COUNT_KEY, '0');
            await AsyncStorage.setItem(VOLUME_PRESS_TIME_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error resetting volume count:', error);
        }
    }

    async getPressCount() {
        try {
            const count = await AsyncStorage.getItem(VOLUME_PRESS_COUNT_KEY);
            return parseInt(count || '0', 10);
        } catch (error) {
            return 0;
        }
    }

    async getLastPressTime() {
        try {
            const time = await AsyncStorage.getItem(VOLUME_PRESS_TIME_KEY);
            return time ? parseInt(time, 10) : 0;
        } catch (error) {
            return 0;
        }
    }

    // Handle volume change - call this when volume button is pressed
    async handleVolumeChange() {
        const isEnabled = await this.isVolumeButtonEnabled();
        if (!isEnabled) return null;

        const currentTime = Date.now();
        const lastPressTime = await this.getLastPressTime();
        let pressCount = await this.getPressCount();

        // Check if within time window
        if (currentTime - lastPressTime > VOLUME_TIME_WINDOW) {
            // Reset count if time window exceeded
            pressCount = 1;
        } else {
            // Increment count
            pressCount += 1;
        }

        // Save new count and time
        await AsyncStorage.setItem(VOLUME_PRESS_COUNT_KEY, pressCount.toString());
        await AsyncStorage.setItem(VOLUME_PRESS_TIME_KEY, currentTime.toString());

        console.log(`Volume button pressed: ${pressCount}/${VOLUME_REQUIRED_COUNT}`);

        // Check if threshold reached
        if (pressCount >= VOLUME_REQUIRED_COUNT) {
            // Reset count after triggering
            await this.resetCount();
            
            // Trigger callback
            if (this.onTriggerCallback) {
                this.onTriggerCallback();
            }

            return {
                triggered: true,
                pressCount: pressCount
            };
        }

        return {
            triggered: false,
            pressCount: pressCount,
            required: VOLUME_REQUIRED_COUNT
        };
    }

    // Start listening for volume changes
    async startListening(onTrigger) {
        if (this.subscription) {
            await this.stopListening();
        }

        this.onTriggerCallback = onTrigger;

        try {
            // Set initial volume to 1 (max)
            await Volume.setSoundModeAsync({ playsInSilentModeIOS: true });
            
            // Add listener for volume changes
            this.subscription = Volume.addEventListener('volumeDidChange', async ({ value }) => {
                // Volume changed - this could be from button press
                // We check if it was a button press by the change
                if (value !== undefined) {
                    await this.handleVolumeChange();
                }
            });

            console.log('Volume button listening started');
            return { success: true };
        } catch (error) {
            console.error('Error starting volume listener:', error);
            return { success: false, error: error.message };
        }
    }

    // Stop listening
    async stopListening() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
        this.onTriggerCallback = null;
        console.log('Volume button listening stopped');
        return { success: true };
    }

    // Get configuration
    getConfig() {
        return {
            requiredPresses: VOLUME_REQUIRED_COUNT,
            timeWindow: VOLUME_TIME_WINDOW
        };
    }
}

export default new VolumeButtonService();
