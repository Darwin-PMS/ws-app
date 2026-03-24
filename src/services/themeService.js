// Theme Service
// API calls for theme management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi, ENDPOINTS } from './api/mobileApi';

const THEME_CACHE_KEY = '@app_theme_cache';
const THEME_CACHE_TIME_KEY = '@app_theme_cache_time';
const THEME_PREF_KEY = '@app_theme_preference';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const themeService = {
    async getCurrentTheme() {
        return mobileApi.get(ENDPOINTS.theme.current);
    },

    async getAllThemes() {
        return mobileApi.get(ENDPOINTS.theme.all);
    },

    async getThemePreference() {
        try {
            return await mobileApi.get(ENDPOINTS.theme.preference);
        } catch (error) {
            console.log('Theme preference fetch failed:', error);
            return null;
        }
    },

    async setThemePreference(mode) {
        try {
            const response = await mobileApi.put(ENDPOINTS.theme.preference, { mode });
            if (response.success && response.data) {
                await this.cacheThemePreference(response.data);
            }
            return response;
        } catch (error) {
            console.log('Theme preference set failed:', error);
            throw error;
        }
    },

    async updateUserTheme(themeId) {
        return mobileApi.put(ENDPOINTS.theme.setUser, { themeId });
    },

    async getThemeConfig(themeId) {
        return mobileApi.get(ENDPOINTS.theme.config(themeId));
    },

    async getCachedTheme() {
        try {
            const cached = await AsyncStorage.getItem(THEME_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {}
        return null;
    },

    async cacheTheme(theme) {
        try {
            await AsyncStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
            await AsyncStorage.setItem(THEME_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}
    },

    async getCachedThemePreference() {
        try {
            const cached = await AsyncStorage.getItem(THEME_PREF_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {}
        return null;
    },

    async cacheThemePreference(pref) {
        try {
            await AsyncStorage.setItem(THEME_PREF_KEY, JSON.stringify(pref));
        } catch (e) {}
    },

    async clearCache() {
        try {
            await AsyncStorage.multiRemove([THEME_CACHE_KEY, THEME_CACHE_TIME_KEY, THEME_PREF_KEY]);
        } catch (e) {}
    }
};

export default themeService;
