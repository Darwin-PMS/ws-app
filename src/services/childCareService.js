// Child Care Service
// API calls for child care features

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi, ENDPOINTS } from './api/mobileApi';

const TIPS_CACHE_KEY = '@childcare_tips_cache';
const TIPS_CACHE_TIME_KEY = '@childcare_tips_cache_time';
const CHAT_HISTORY_KEY = '@childcare_chat_history';
const CACHE_DURATION = 60 * 60 * 1000;

export const childCareService = {
    async getTips(params = {}) {
        try {
            const response = await mobileApi.get(ENDPOINTS.childcare.tips);
            if (response.success) {
                try {
                    await AsyncStorage.setItem(TIPS_CACHE_KEY, JSON.stringify(response.tips || []));
                    await AsyncStorage.setItem(TIPS_CACHE_TIME_KEY, Date.now().toString());
                } catch (e) {}
            }
            return response;
        } catch (error) {
            try {
                const cached = await AsyncStorage.getItem(TIPS_CACHE_KEY);
                if (cached) {
                    return { success: true, tips: JSON.parse(cached), cached: true };
                }
            } catch (e) {}
            throw error;
        }
    },

    async getTipById(tipId) {
        return mobileApi.get(ENDPOINTS.childcare.tip(tipId));
    },

    async addFavorite(tipId) {
        return mobileApi.post(ENDPOINTS.childcare.addFavorite, { tipId });
    },

    async removeFavorite(tipId) {
        return mobileApi.delete(ENDPOINTS.childcare.removeFavorite(tipId));
    },

    async getCategories() {
        return mobileApi.get(ENDPOINTS.childcare.categories);
    },

    async sendMessage(conversationId, message, context = {}) {
        return mobileApi.post(ENDPOINTS.childcare.sendChatMessage, { conversationId, message, context });
    },

    async getConversations() {
        return mobileApi.get(ENDPOINTS.childcare.conversations);
    },

    async getConversation(conversationId) {
        return mobileApi.get(ENDPOINTS.childcare.deleteConversation(conversationId));
    },

    async deleteConversation(conversationId) {
        return mobileApi.delete(ENDPOINTS.childcare.deleteConversation(conversationId));
    },

    async getChatHistory() {
        try {
            const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    },

    async saveChatHistory(messages) {
        try {
            await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) {}
    },

    async getChildren() {
        return mobileApi.get(ENDPOINTS.childcare.children);
    },

    async addChild(childData) {
        return mobileApi.post(ENDPOINTS.childcare.addChild, childData);
    },

    async updateChild(childId, childData) {
        return mobileApi.put(ENDPOINTS.childcare.updateChild(childId), childData);
    },

    async deleteChild(childId) {
        return mobileApi.delete(ENDPOINTS.childcare.deleteChild(childId));
    },

    async logGrowth(childId, entry) {
        return mobileApi.post(ENDPOINTS.childcare.addGrowthTracker(childId), entry);
    },

    async getGrowthLogs(childId) {
        return mobileApi.get(ENDPOINTS.childcare.growthTracker(childId));
    },

    async logFeeding(childId, entry) {
        return mobileApi.post(ENDPOINTS.childcare.addFeedingTracker(childId), entry);
    },

    async getFeedingLogs(childId) {
        return mobileApi.get(ENDPOINTS.childcare.feedingTracker(childId));
    },

    async logSleep(childId, entry) {
        return mobileApi.post(ENDPOINTS.childcare.addSleepTracker(childId), entry);
    },

    async getSleepLogs(childId) {
        return mobileApi.get(ENDPOINTS.childcare.sleepTracker(childId));
    },

    async clearCache() {
        const STORAGE_KEYS = {
            TIPS: '@childcare_tips_cache',
            TIPS_TIME: '@childcare_tips_cache_time',
            CHILDREN: '@childcare_children_cache',
            CONVERSATIONS: '@childcare_conversations_cache'
        };
        try {
            await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
        } catch (error) {}
    }
};

export default childCareService;
