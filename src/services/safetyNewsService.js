// Safety News Service
// API calls for safety news

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyNewsService = {
    async getNews(params = {}) {
        return mobileApi.get(ENDPOINTS.safetyNews.list);
    },

    async getNewsById(id) {
        return mobileApi.get(ENDPOINTS.safetyNews.byId(id));
    },

    async getFeaturedNews() {
        return mobileApi.get(ENDPOINTS.safetyNews.featured);
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyNews.categories);
    },

    async searchNews(keyword) {
        return mobileApi.get(ENDPOINTS.safetyNews.search);
    },

    async getNewsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyNews.byCategory(categoryId));
    },

    async getLatestNews(limit = 10) {
        return mobileApi.get(ENDPOINTS.safetyNews.latest);
    },

    async getPopularNews(limit = 10) {
        return mobileApi.get(ENDPOINTS.safetyNews.popular);
    }
};

export default safetyNewsService;
