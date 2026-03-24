// Consent Service
// API calls for consent management

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const consentService = {
    async getConsentSettings() {
        return mobileApi.get(ENDPOINTS.consent.get);
    },

    async updateConsentSettings(consentData) {
        return mobileApi.put(ENDPOINTS.consent.update, consentData);
    },

    async updateConsentCategory(category, value) {
        return mobileApi.put(ENDPOINTS.consent.updateCategories, { category, value });
    },

    async getAuditLogs(params = {}) {
        return mobileApi.get(ENDPOINTS.consent.auditLogs);
    }
};

export default consentService;
