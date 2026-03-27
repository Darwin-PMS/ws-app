// Banner Service
// API calls for banners

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/mobileApi';

const BANNERS_CACHE_KEY = '@app_banners_cache';
const BANNERS_CACHE_TIME_KEY = '@app_banners_cache_time';
const CACHE_DURATION = 60 * 60 * 1000;

export const bannerService = {
    async getBanners() {
        try {
            const response = await apiClient.get(ENDPOINTS.banners.list);
            if (response.success) {
                await bannerService.cacheBanners(response.banners);
                return { success: true, banners: response.banners };
            }
            return response;
        } catch (error) {
            console.log('Error fetching banners:', error);
            // Try to get cached banners
            const cached = await bannerService.getCachedBanners();
            if (cached) {
                return { success: true, banners: cached, fromCache: true };
            }
            throw error;
        }
    },

    async cacheBanners(banners) {
        try {
            await AsyncStorage.setItem(BANNERS_CACHE_KEY, JSON.stringify(banners));
            await AsyncStorage.setItem(BANNERS_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error caching banners:', e);
        }
    },

    async getCachedBanners() {
        try {
            const cached = await AsyncStorage.getItem(BANNERS_CACHE_KEY);
            const cachedTime = await AsyncStorage.getItem(BANNERS_CACHE_TIME_KEY);

            if (cached && cachedTime) {
                const age = Date.now() - parseInt(cachedTime);
                if (age < CACHE_DURATION) {
                    return JSON.parse(cached);
                }
            }
        } catch (e) {
            console.error('Error getting cached banners:', e);
        }
        return null;
    },

    async clearCachedBanners() {
        try {
            await AsyncStorage.multiRemove([BANNERS_CACHE_KEY, BANNERS_CACHE_TIME_KEY]);
        } catch (e) {
            console.error('Error clearing banners cache:', e);
        }
    }
};

export default bannerService;
