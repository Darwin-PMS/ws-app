// Safety Law Service
// API calls for safety laws

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyLawService = {
    async getLaws(params = {}) {
        return mobileApi.get(ENDPOINTS.safetyLaws.list);
    },

    async getLawById(id) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byId(id));
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyLaws.categories);
    },

    async getJurisdictions() {
        return mobileApi.get(ENDPOINTS.safetyLaws.jurisdictions);
    },

    async searchLaws(keyword) {
        return mobileApi.get(ENDPOINTS.safetyLaws.search);
    },

    async getLawsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byCategory(categoryId));
    },

    async getLawsByJurisdiction(jurisdictionId) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byJurisdiction(jurisdictionId));
    },

    async getLawsByCategoryAndJurisdiction(categoryId, jurisdictionId) {
        return mobileApi.get(ENDPOINTS.safetyLaws.list);
    },

    async getRecentLaws(limit = 10) {
        return mobileApi.get(ENDPOINTS.safetyLaws.recent);
    }
};

export default safetyLawService;
