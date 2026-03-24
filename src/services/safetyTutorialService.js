// Safety Tutorial Service
// API calls for safety tutorials

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyTutorialService = {
    async getTutorials(params = {}) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.list);
    },

    async getTutorialById(id) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byId(id));
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyTutorials.categories);
    },

    async searchTutorials(keyword) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.search);
    },

    async getTutorialsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byCategory(categoryId));
    },

    async getTutorialsByDifficulty(difficulty) {
        return mobileApi.get(ENDPOINTS.safetyTutorials.byDifficulty(difficulty));
    }
};

export default safetyTutorialService;
