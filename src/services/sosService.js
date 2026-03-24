// SOS Service
// API calls for SOS alerts

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const sosService = {
    async triggerSOS(data = {}) {
        return mobileApi.post(ENDPOINTS.sos.trigger, data);
    },

    async getActiveSOS() {
        return mobileApi.get(ENDPOINTS.sos.active);
    },

    async getSOSHistory(params = {}) {
        return mobileApi.get(ENDPOINTS.sos.history);
    },

    async resolveSOS(alertId, resolutionData = {}) {
        return mobileApi.put(ENDPOINTS.sos.resolve(alertId), resolutionData);
    },

    async cancelSOS(alertId) {
        return mobileApi.delete(ENDPOINTS.sos.delete(alertId));
    },

    async updateSOSLocation(data = {}) {
        return mobileApi.post(ENDPOINTS.sos.locationUpdate, data);
    }
};

export default sosService;
