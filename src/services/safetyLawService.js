// Safety Law Service
// API calls for safety laws

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyLawService = {
    async getLaws(params = {}) {
        let url = ENDPOINTS.safetyLaws.list;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url = `${url}?${queryString}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getLawById(id) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byId(id), { skipAuth: true });
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyLaws.categories, { skipAuth: true });
    },

    async getJurisdictions() {
        return mobileApi.get(ENDPOINTS.safetyLaws.jurisdictions, { skipAuth: true });
    },

    async searchLaws(keyword) {
        let url = ENDPOINTS.safetyLaws.search;
        if (keyword) {
            url = `${url}?keyword=${encodeURIComponent(keyword)}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getLawsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byCategory(categoryId), { skipAuth: true });
    },

    async getLawsByJurisdiction(jurisdictionId) {
        return mobileApi.get(ENDPOINTS.safetyLaws.byJurisdiction(jurisdictionId), { skipAuth: true });
    },

    async getRecentLaws(limit = 10) {
        return mobileApi.get(`${ENDPOINTS.safetyLaws.recent}?limit=${limit}`, { skipAuth: true });
    }
};

export default safetyLawService;
