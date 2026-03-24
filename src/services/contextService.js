// Context Service - Client-side service for location events and suggestions

import AsyncStorage from '@react-native-async-storage/async-storage';
import locationService from './locationService';
import { mobileApi, ENDPOINTS } from './api/mobileApi';
import { API_CONFIG } from './api/endpoints';

class ContextService {
    constructor() {
        this.isWatching = false;
        this.currentFamilyId = null;
        this.suggestions = [];
        this.listeners = {
            onSuggestion: [],
            onLocationProcessed: [],
            onError: []
        };
    }

    addListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    async requestPermissions() {
        return await locationService.requestPermissions();
    }

    async isLocationServicesEnabled() {
        return await locationService.isLocationServicesEnabled();
    }

    async setCurrentFamily(familyId) {
        this.currentFamilyId = familyId;
        await AsyncStorage.setItem('currentFamilyId', familyId);
    }

    async getCurrentFamily() {
        if (!this.currentFamilyId) {
            this.currentFamilyId = await AsyncStorage.getItem('currentFamilyId');
        }
        return this.currentFamilyId;
    }

    async startTracking() {
        if (this.isWatching) {
            return { success: false, message: 'Already tracking' };
        }

        const permission = await this.requestPermissions();
        if (!permission.success) {
            return { success: false, message: permission.message };
        }

        const familyId = await this.getCurrentFamily();
        if (!familyId) {
            return { success: false, message: 'No family selected' };
        }

        await locationService.startWatchingLocation(
            async (location) => {
                await this.processLocation(location);
            },
            {
                accuracy: locationService.Accuracy.Balanced,
                timeInterval: 60000,
                distanceInterval: 50,
            }
        );

        this.isWatching = true;
        return { success: true };
    }

    async stopTracking() {
        await locationService.stopWatchingLocation();
        this.isWatching = false;
        return { success: true };
    }

    async processLocation(location) {
        try {
            const familyId = await this.getCurrentFamily();
            if (!familyId) {
                return;
            }

            const response = await mobileApi.post(ENDPOINTS.events.addLocation(familyId), {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: new Date().toISOString()
            });

            if (response.success && response.suggestion) {
                this.suggestions.unshift(response.suggestion);
                this.emit('onSuggestion', response.suggestion);
            }

            this.emit('onLocationProcessed', {
                location,
                processed: response.processed,
                reason: response.reason
            });

            return response;
        } catch (error) {
            console.error('Process location error:', error);
            this.emit('onError', error);
            return { success: false, error: error.message };
        }
    }

    async getSuggestions(familyId, status = 'pending') {
        try {
            const response = await mobileApi.get(ENDPOINTS.events.suggestions(familyId));

            if (response.success) {
                this.suggestions = response.suggestions;
            }

            return response;
        } catch (error) {
            console.error('Get suggestions error:', error);
            return { success: false, error: error.message };
        }
    }

    async respondToSuggestion(suggestionId, action, payload = {}) {
        try {
            const response = await mobileApi.post(ENDPOINTS.events.respondSuggestion(suggestionId), {
                action,
                payload
            });

            if (response.success && action === 'accepted') {
                this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
            }

            return response;
        } catch (error) {
            console.error('Respond to suggestion error:', error);
            return { success: false, error: error.message };
        }
    }

    async acceptSuggestion(suggestionId, additionalData = {}) {
        return await this.respondToSuggestion(suggestionId, 'accepted', additionalData);
    }

    async dismissSuggestion(suggestionId) {
        return await this.respondToSuggestion(suggestionId, 'dismissed');
    }

    async snoozeSuggestion(suggestionId, duration = 30) {
        return await this.respondToSuggestion(suggestionId, 'snoozed', { duration });
    }

    async getActivityLogs(familyId, options = {}) {
        try {
            const response = await mobileApi.get(ENDPOINTS.events.activityLogs(familyId));
            return response;
        } catch (error) {
            console.error('Get activity logs error:', error);
            return { success: false, error: error.message };
        }
    }

    async createActivityLog(familyId, activityData) {
        try {
            const response = await mobileApi.post(ENDPOINTS.events.addActivityLog(familyId), activityData);
            return response;
        } catch (error) {
            console.error('Create activity log error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFamilyPlaces(familyId) {
        try {
            const response = await mobileApi.get(ENDPOINTS.familyPlaces.list(familyId));
            return response;
        } catch (error) {
            console.error('Get family places error:', error);
            return { success: false, error: error.message };
        }
    }

    async checkLocation(familyId, latitude, longitude) {
        try {
            const response = await mobileApi.post(ENDPOINTS.familyPlaces.check(familyId), { latitude, longitude });
            return response;
        } catch (error) {
            console.error('Check location error:', error);
            return { success: false, error: error.message };
        }
    }

    async getConsentSettings() {
        try {
            const response = await mobileApi.get(ENDPOINTS.consent.get);
            return response;
        } catch (error) {
            console.error('Get consent settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateConsentSettings(settings) {
        try {
            const response = await mobileApi.put(ENDPOINTS.consent.update, settings);
            return response;
        } catch (error) {
            console.error('Update consent settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async enableLocationTracking() {
        return await this.updateConsentSettings({
            locationEnabled: true,
            familyAgentEnabled: true
        });
    }

    async disableLocationTracking() {
        return await this.updateConsentSettings({
            locationEnabled: false
        });
    }
}

export default new ContextService();
