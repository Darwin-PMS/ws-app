// Silent Mode Service
// Manages silent and vibration mode settings for the app

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'silent_vibration_settings';

const DEFAULT_SETTINGS = {
    silentMode: false,      // When true, all app sounds are silenced
    vibrationMode: true,   // When true, vibration feedback is enabled
    silentUntil: null,     // Optional: timestamp until which silent mode is active
};

class SilentModeService {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.isInitialized = false;
    }

    /**
     * Initialize the service and load settings from storage
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing SilentModeService:', error);
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving silent mode settings:', error);
        }
    }

    /**
     * Get current settings
     */
    async getSettings() {
        await this.initialize();
        return { ...this.settings };
    }

    /**
     * Get quick access to current setting values
     */
    async isSilentModeEnabled() {
        await this.initialize();

        // Check if silent mode is time-bound
        if (this.settings.silentUntil) {
            const now = Date.now();
            if (now > this.settings.silentUntil) {
                // Silent mode expired, reset it
                await this.updateSettings({ silentMode: false, silentUntil: null });
                return false;
            }
        }

        return this.settings.silentMode;
    }

    /**
     * Check if vibration is enabled
     */
    async isVibrationEnabled() {
        await this.initialize();
        return this.settings.vibrationMode;
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    async updateSettings(newSettings) {
        await this.initialize();
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        return { ...this.settings };
    }

    /**
     * Toggle silent mode on/off
     * @param {boolean} enabled - Whether to enable silent mode
     * @param {number|null} durationMinutes - Optional duration in minutes
     */
    async setSilentMode(enabled, durationMinutes = null) {
        await this.initialize();

        let silentUntil = null;
        if (enabled && durationMinutes) {
            silentUntil = Date.now() + (durationMinutes * 60 * 1000);
        }

        this.settings.silentMode = enabled;
        this.settings.silentUntil = silentUntil;
        await this.saveSettings();

        return {
            silentMode: enabled,
            silentUntil
        };
    }

    /**
     * Toggle vibration mode on/off
     * @param {boolean} enabled - Whether to enable vibration
     */
    async setVibrationMode(enabled) {
        await this.initialize();
        this.settings.vibrationMode = enabled;
        await this.saveSettings();

        return { vibrationMode: enabled };
    }

    /**
     * Enable silent mode for a specific duration
     * @param {number} durationMinutes - Duration in minutes
     */
    async enableSilentModeTemporarily(durationMinutes) {
        return await this.setSilentMode(true, durationMinutes);
    }

    /**
     * Disable silent mode
     */
    async disableSilentMode() {
        return await this.setSilentMode(false);
    }

    /**
     * Get the remaining time for silent mode (in minutes)
     * Returns null if silent mode is not active or not time-bound
     */
    async getSilentModeRemainingTime() {
        await this.initialize();

        if (!this.settings.silentMode || !this.settings.silentUntil) {
            return null;
        }

        const remaining = this.settings.silentUntil - Date.now();
        if (remaining <= 0) {
            // Silent mode expired
            await this.updateSettings({ silentMode: false, silentUntil: null });
            return null;
        }

        return Math.ceil(remaining / (60 * 1000));
    }

    /**
     * Quick toggle for urgent situations
     * This can be called from anywhere to quickly silence the app
     */
    async quickToggle() {
        await this.initialize();

        const newState = !this.settings.silentMode;
        await this.setSilentMode(newState);

        return { silentMode: newState };
    }

    /**
     * Get available silent mode duration options (in minutes)
     */
    getDurationOptions() {
        return [
            { id: 15, label: '15 minutes' },
            { id: 30, label: '30 minutes' },
            { id: 60, label: '1 hour' },
            { id: 120, label: '2 hours' },
            { id: 480, label: '8 hours' },
            { id: 0, label: 'Until turned off' },
        ];
    }

    /**
     * Clear all settings and reset to defaults
     */
    async resetSettings() {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
        return { ...this.settings };
    }
}

export default new SilentModeService();
