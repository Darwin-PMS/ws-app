// Event Service
// API calls for event tracking

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const eventService = {
    async sendLocationEvent(familyId, locationData) {
        return mobileApi.post(ENDPOINTS.events.addLocation(familyId), locationData);
    },

    async sendBatchLocationEvents(familyId, locations) {
        return mobileApi.post(ENDPOINTS.events.addBatchLocations(familyId), { locations });
    },

    async getSuggestions(familyId) {
        return mobileApi.get(ENDPOINTS.events.suggestions(familyId));
    },

    async respondToSuggestion(suggestionId, response) {
        return mobileApi.post(ENDPOINTS.events.respondSuggestion(suggestionId), { response });
    },

    async getActivityLogs(familyId) {
        return mobileApi.get(ENDPOINTS.events.activityLogs(familyId));
    },

    async createActivityLog(familyId, logData) {
        return mobileApi.post(ENDPOINTS.events.addActivityLog(familyId), logData);
    },

    async getFamilyContext(familyId) {
        return mobileApi.get(ENDPOINTS.events.context(familyId));
    }
};

export default eventService;
