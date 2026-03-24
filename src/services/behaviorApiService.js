// Behavior Analysis API Service
// Frontend service to interact with the behavior analysis backend API

import { mobileApi, ENDPOINTS } from './api/mobileApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    USER_ID: '@user_id',
};

const analyzeLocation = async (location, context = {}) => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.post(ENDPOINTS.behavior.analyze, {
            userId,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                altitude: location.altitude,
                heading: location.heading,
                speed: location.speed,
                timestamp: location.timestamp || new Date().toISOString()
            },
            context: {
                activityType: context.activityType || 'unknown',
                batteryLevel: context.batteryLevel,
                isCharging: context.isCharging,
                appState: context.appState
            }
        });

        return response;
    } catch (error) {
        console.error('Analyze location error:', error);
        return { success: false, error: error.message };
    }
};

const getAnomalies = async (params = {}) => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.get(ENDPOINTS.behavior.anomalies);
        return response;
    } catch (error) {
        console.error('Get anomalies error:', error);
        return { success: false, error: error.message };
    }
};

const getBehaviorSummary = async () => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.get(ENDPOINTS.behavior.summary(userId));
        return response;
    } catch (error) {
        console.error('Get behavior summary error:', error);
        return { success: false, error: error.message };
    }
};

const submitFeedback = async (anomalyId, feedbackType, notes = '', context = {}) => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.post(ENDPOINTS.behavior.feedback, {
            userId,
            anomalyId,
            feedbackType,
            notes,
            expectedBehavior: context.expectedBehavior,
            context: {
                wasExpected: context.wasExpected || false,
                reason: context.reason
            }
        });

        return response;
    } catch (error) {
        console.error('Submit feedback error:', error);
        return { success: false, error: error.message };
    }
};

const getSettings = async () => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.get(ENDPOINTS.behavior.settings(userId));
        return response;
    } catch (error) {
        console.error('Get settings error:', error);
        return { success: false, error: error.message };
    }
};

const updateSettings = async (settings) => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.put(ENDPOINTS.behavior.updateSettings(userId), settings);
        return response;
    } catch (error) {
        console.error('Update settings error:', error);
        return { success: false, error: error.message };
    }
};

const getRoutines = async () => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.get(ENDPOINTS.behavior.routines(userId));
        return response;
    } catch (error) {
        console.error('Get routines error:', error);
        return { success: false, error: error.message };
    }
};

const learnRoutines = async () => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.post(ENDPOINTS.behavior.learnRoutine, { userId });
        return response;
    } catch (error) {
        console.error('Learn routines error:', error);
        return { success: false, error: error.message };
    }
};

const getAlerts = async (params = {}) => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.get(ENDPOINTS.behavior.alerts(userId));
        return response;
    } catch (error) {
        console.error('Get alerts error:', error);
        return { success: false, error: error.message };
    }
};

const resolveAlert = async (alertId, resolution, notes = '') => {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const response = await mobileApi.put(ENDPOINTS.behavior.resolveAlert(alertId), {
            userId,
            resolution,
            notes,
            responseTime: 0
        });

        return response;
    } catch (error) {
        console.error('Resolve alert error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    analyzeLocation,
    getAnomalies,
    getBehaviorSummary,
    submitFeedback,
    getSettings,
    updateSettings,
    getRoutines,
    learnRoutines,
    getAlerts,
    resolveAlert
};
