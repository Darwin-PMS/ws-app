// Fake Battery Death Service
// Simulates phone shutdown for safety while continuing background tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const STORAGE_KEYS = {
    SETTINGS: '@fake_battery_settings',
    HISTORY: '@fake_battery_history',
    STATE: '@fake_battery_state',
};

const DEFAULT_SETTINGS = {
    shutdownAnimation: true,
    showBatteryIcon: true,
    shutdownMessage: 'Battery critically low - Phone shutting down',
    continueTracking: true,
    wakeUpMethod: 'timer', // 'gesture', 'timer', 'button', 'pin'
    wakeUpTimer: 30, // seconds
    wakeUpPin: '1234',
    vibrationEnabled: true,
    soundEnabled: true,
    autoWakeUp: true,
    customMessage: '',
};

const DEFAULT_HISTORY = [];

class FakeBatteryService {
    constructor() {
        this.settings = {};
        this.isInitialized = false;
        this.isActive = false;
        this.startTime = null;
        this.backgroundTracking = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            this.settings = settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;

            const stateData = await AsyncStorage.getItem(STORAGE_KEYS.STATE);
            if (stateData) {
                const state = JSON.parse(stateData);
                this.isActive = state.isActive;
                this.startTime = state.startTime ? new Date(state.startTime) : null;
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Fake battery service init error:', error);
            this.settings = DEFAULT_SETTINGS;
            this.isInitialized = true;
        }
    }

    async saveSettings() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Save settings error:', error);
        }
    }

    async saveState() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({
                isActive: this.isActive,
                startTime: this.startTime ? this.startTime.toISOString() : null,
            }));
        } catch (error) {
            console.error('Save state error:', error);
        }
    }

    async getSettings() {
        await this.initialize();
        return this.settings;
    }

    async updateSettings(newSettings) {
        await this.initialize();
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        return this.settings;
    }

    async activateFakeShutdown() {
        await this.initialize();
        
        this.isActive = true;
        this.startTime = new Date();
        
        if (this.settings.continueTracking) {
            this.backgroundTracking = true;
        }

        await this.saveState();

        if (this.settings.soundEnabled) {
            try {
                await Speech.speak(this.settings.shutdownMessage || 'Battery critically low', {
                    language: 'en',
                    pitch: 0.8,
                    rate: 0.9,
                });
            } catch (error) {
                console.error('Speech error:', error);
            }
        }

        return {
            isActive: true,
            startTime: this.startTime,
            message: this.settings.shutdownMessage,
        };
    }

    async deactivateFakeShutdown() {
        this.isActive = false;
        this.startTime = null;
        this.backgroundTracking = false;
        
        await this.saveState();

        try {
            await Speech.speak('Phone powered on', {
                language: 'en',
                pitch: 1.0,
                rate: 1.0,
            });
        } catch (error) {
            console.error('Speech error:', error);
        }

        await this.addToHistory({
            type: 'wakeup',
            timestamp: new Date().toISOString(),
            duration: this.getSessionDuration(),
        });

        return { isActive: false };
    }

    async getStatus() {
        await this.initialize();
        return {
            isActive: this.isActive,
            startTime: this.startTime,
            backgroundTracking: this.backgroundTracking,
            sessionDuration: this.getSessionDuration(),
        };
    }

    getSessionDuration() {
        if (!this.startTime) return 0;
        return Math.floor((new Date() - this.startTime) / 1000);
    }

    async verifyWakeUpPin(pin) {
        await this.initialize();
        return pin === this.settings.wakeUpPin;
    }

    async checkWakeUpTimer() {
        if (!this.isActive || this.settings.wakeUpMethod !== 'timer') {
            return false;
        }

        const duration = this.getSessionDuration();
        if (duration >= this.settings.wakeUpTimer) {
            return true;
        }
        return false;
    }

    async addToHistory(entry) {
        try {
            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
            let history = historyData ? JSON.parse(historyData) : DEFAULT_HISTORY;
            
            history.unshift(entry);
            if (history.length > 50) {
                history = history.slice(0, 50);
            }

            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('Add to history error:', error);
        }
    }

    async getHistory() {
        try {
            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
            return historyData ? JSON.parse(historyData) : DEFAULT_HISTORY;
        } catch (error) {
            console.error('Get history error:', error);
            return DEFAULT_HISTORY;
        }
    }

    async resetHistory() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
        } catch (error) {
            console.error('Reset history error:', error);
        }
    }

    getWakeUpMethods() {
        return [
            { id: 'gesture', name: 'Shake to Wake', description: 'Shake your phone to turn on' },
            { id: 'timer', name: 'Auto Timer', description: 'Automatically wake up after set time' },
            { id: 'button', name: 'Power Button', description: 'Press power button to wake up' },
            { id: 'pin', name: 'PIN Code', description: 'Enter a PIN to wake up' },
        ];
    }

    getQuickScenarios() {
        return [
            { id: '1', name: 'Quick Escape', duration: 30, icon: 'flash' },
            { id: '2', name: 'Meeting', duration: 60, icon: 'business' },
            { id: '3', name: 'Public Transport', duration: 45, icon: 'bus' },
            { id: '4', name: 'Walking Home', duration: 20, icon: 'walk' },
            { id: '5', name: 'Custom', duration: 0, icon: 'settings' },
        ];
    }

    async isBackgroundTrackingActive() {
        return this.backgroundTracking;
    }

    async stopBackgroundTracking() {
        this.backgroundTracking = false;
        await this.saveState();
    }

    async resumeBackgroundTracking() {
        if (this.isActive && this.settings.continueTracking) {
            this.backgroundTracking = true;
            await this.saveState();
        }
    }
}

export default new FakeBatteryService();
