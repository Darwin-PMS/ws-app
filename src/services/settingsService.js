// Settings Service
// Handles local app settings storage

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_GROQ_KEY = '@local_groq_api_key';

class SettingsService {
    constructor() {
        this.cachedSettings = {};
    }

    async getGroqApiKey() {
        try {
            if (this.cachedSettings.groq_key) {
                return this.cachedSettings.groq_key;
            }

            const localKey = await AsyncStorage.getItem(LOCAL_GROQ_KEY);
            if (localKey) {
                this.cachedSettings.groq_key = localKey;
            }

            return localKey;
        } catch (error) {
            console.error('Error fetching Groq API key:', error);
            return null;
        }
    }

    async saveGroqApiKey(apiKey) {
        try {
            await AsyncStorage.setItem(LOCAL_GROQ_KEY, apiKey);
            this.cachedSettings.groq_key = apiKey;
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
