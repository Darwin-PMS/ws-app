// Safety Tutorial Service
// API calls for safety tutorials

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyTutorialService = {
    async getTutorials(params = {}) {
        let url = ENDPOINTS.safetyTutorials.list;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url = `${url}?${queryString}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getTutorialById(id) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byId(id), { skipAuth: true });
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyTutorials.categories, { skipAuth: true });
    },

    async searchTutorials(keyword) {
        let url = ENDPOINTS.safetyTutorials.search;
        if (keyword) {
            url = `${url}?keyword=${encodeURIComponent(keyword)}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getTutorialsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byCategory(categoryId), { skipAuth: true });
    },

    async getTutorialsByDifficulty(difficulty) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byDifficulty(difficulty), { skipAuth: true });
    }
};

export default safetyTutorialService;
