// Menu Service
// API calls for menu management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi, ENDPOINTS } from './api/mobileApi';

const MENUS_CACHE_KEY = '@app_menus_cache';
const MENUS_CACHE_TIME_KEY = '@app_menus_cache_time';
const CACHE_DURATION = 60 * 60 * 1000;

export const menuService = {
    async getMenusForUser() {
        return mobileApi.get(ENDPOINTS.menu.user);
    },

    async getAllMenus() {
        return mobileApi.get(ENDPOINTS.menu.all);
    },

    async getMenuById(menuId) {
        return mobileApi.get(ENDPOINTS.menu.byId(menuId));
    },

    async cacheMenus(menus) {
        try {
            await AsyncStorage.setItem(MENUS_CACHE_KEY, JSON.stringify(menus));
            await AsyncStorage.setItem(MENUS_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}
    },

    async getCachedMenus() {
        try {
            const cached = await AsyncStorage.getItem(MENUS_CACHE_KEY);
            const cachedTime = await AsyncStorage.getItem(MENUS_CACHE_TIME_KEY);

            if (cached && cachedTime) {
                const age = Date.now() - parseInt(cachedTime);
                if (age < CACHE_DURATION) {
                    return JSON.parse(cached);
                }
            }
        } catch (e) {}
        return null;
    },

    async clearCachedMenus() {
        try {
            await AsyncStorage.multiRemove([MENUS_CACHE_KEY, MENUS_CACHE_TIME_KEY]);
        } catch (e) {}
    },

    findMenuItem(items, itemId) {
        if (!items || !Array.isArray(items)) return null;

        for (const item of items) {
            if (item.id === itemId) return item;
            if (item.children && item.children.length > 0) {
                const found = this.findMenuItem(item.children, itemId);
                if (found) return found;
            }
        }
        return null;
    },

    findMenuItemByRoute(items, route) {
        if (!items || !Array.isArray(items)) return null;

        for (const item of items) {
            if (item.route === route) return item;
            if (item.children && item.children.length > 0) {
                const found = this.findMenuItemByRoute(item.children, route);
                if (found) return found;
            }
        }
        return null;
    }
};

export default menuService;
