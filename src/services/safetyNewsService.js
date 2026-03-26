// Safety News Service
// API calls for safety news

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const safetyNewsService = {
    async getNews(params = {}) {
        let url = ENDPOINTS.safetyNews.list;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url = `${url}?${queryString}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getNewsById(id) {
        return mobileApi.get(ENDPOINTS.safetyNews.byId(id), { skipAuth: true });
    },

    async getFeaturedNews() {
        return mobileApi.get(ENDPOINTS.safetyNews.featured, { skipAuth: true });
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.safetyNews.categories, { skipAuth: true });
    },

    async searchNews(keyword) {
        let url = ENDPOINTS.safetyNews.search;
        if (keyword) {
            url = `${url}?keyword=${encodeURIComponent(keyword)}`;
        }
        return mobileApi.get(url, { skipAuth: true });
    },

    async getNewsByCategory(categoryId) {
        return mobileApi.get(ENDPOINTS.safetyNews.byCategory(categoryId), { skipAuth: true });
    },

    async getLatestNews(limit = 10) {
        return mobileApi.get(`${ENDPOINTS.safetyNews.latest}?limit=${limit}`, { skipAuth: true });
    },

    async getPopularNews(limit = 10) {
        return mobileApi.get(`${ENDPOINTS.safetyNews.popular}?limit=${limit}`, { skipAuth: true });
    }
};

export default safetyNewsService;
