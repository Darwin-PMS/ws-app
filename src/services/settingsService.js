// Settings Service
// Handles local app settings storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import databaseService from './databaseService';

const LOCAL_GROQ_KEY = '@local_groq_api_key';

class SettingsService {
    constructor() {
        this.cachedSettings = {};
    }

    async getGroqApiKey() {
        try {
            // First check cache
            if (this.cachedSettings.groq_key) {
                return this.cachedSettings.groq_key;
            }

            // Check local storage first
            const localKey = await AsyncStorage.getItem(LOCAL_GROQ_KEY);
            if (localKey) {
                this.cachedSettings.groq_key = localKey;
                return localKey;
            }

            // Try to get userId from AsyncStorage (set during login)
            const userId = await AsyncStorage.getItem('@user_id');
            
            // If no local key, try to fetch from API
            if (userId) {
                try {
                    const settings = await databaseService.getSettings(userId);
                    if (settings && settings.data) {
                        const serverKey = settings.data.find(s => s.setting_key === 'groq_key');
                        if (serverKey && serverKey.setting_value) {
                            // Cache and return
                            this.cachedSettings.groq_key = serverKey.setting_value;
                            return serverKey.setting_value;
                        }
                    }
                } catch (apiError) {
                    console.log('Could not fetch settings from server:', apiError.message);
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching Groq API key:', error);
            return null;
        }
    }

    async saveGroqApiKey(apiKey) {
        try {
            // Save to local storage
            await AsyncStorage.setItem(LOCAL_GROQ_KEY, apiKey);
            this.cachedSettings.groq_key = apiKey;

            // Also try to save to server
            const userId = await AsyncStorage.getItem('@user_id');
            if (userId) {
                try {
                    await databaseService.updateSettings(userId, {
                        groq_key: apiKey
                    });
                } catch (apiError) {
                    console.log('Could not save to server, saved locally only');
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving Groq API key:', error);
            return false;
        }
    }

    async clearLocalGroqKey() {
        try {
            await AsyncStorage.removeItem(LOCAL_GROQ_KEY);
            this.cachedSettings.groq_key = null;
            return true;
        } catch (error) {
            console.error('Error clearing Groq API key:', error);
            return false;
        }
    }

    clearCache() {
        this.cachedSettings = {};
    }

    async getSetting(key) {
        if (key === 'groq_key') {
            return { data: { value: await this.getGroqApiKey() } };
        }
        throw new Error(`Unknown setting key: ${key}`);
    }
}

export default new SettingsService();
