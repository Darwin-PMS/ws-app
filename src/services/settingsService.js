// Settings Service
// Handles fetching global application settings from the backend

import { mobileApi, ENDPOINTS } from './api/mobileApi';

class SettingsService {
    constructor() {
        this.cachedSettings = {};
    }

    async initialize() {
        await mobileApi.initialize();
    }

    async getGroqApiKey() {
        try {
            if (this.cachedSettings.groq_key) {
                return this.cachedSettings.groq_key;
            }

            const response = await mobileApi.get(ENDPOINTS.settings.groqKey);

            if (response.success && response.data && response.data.key) {
                this.cachedSettings.groq_key = response.data.key;
                return response.data.key;
            }

            return null;
        } catch (error) {
            console.error('Error fetching Groq API key:', error);
            return null;
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
