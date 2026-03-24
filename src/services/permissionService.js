// Permission Service
// API calls for permission management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi, ENDPOINTS } from './api/mobileApi';

const PERMISSIONS_CACHE_KEY = '@app_permissions_cache';
const PERMISSIONS_CACHE_TIME_KEY = '@app_permissions_cache_time';
const CACHE_DURATION = 60 * 60 * 1000;

export const permissionService = {
    async getCurrentPermissions() {
        return mobileApi.get(ENDPOINTS.permissions.current);
    },

    async getRolePermissions(role) {
        return mobileApi.get(ENDPOINTS.permissions.byRole(role));
    },

    async updatePermissions(permissions) {
        return mobileApi.put(ENDPOINTS.permissions.updateUser, permissions);
    },

    async getCachedPermissions() {
        try {
            const cached = await AsyncStorage.getItem(PERMISSIONS_CACHE_KEY);
            const cachedTime = await AsyncStorage.getItem(PERMISSIONS_CACHE_TIME_KEY);

            if (cached && cachedTime) {
                const age = Date.now() - parseInt(cachedTime);
                if (age < CACHE_DURATION) {
                    return JSON.parse(cached);
                }
            }
        } catch (e) {}
        return null;
    },

    async cachePermissions(permissions) {
        try {
            await AsyncStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(permissions));
            await AsyncStorage.setItem(PERMISSIONS_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}
    },

    async clearCachedPermissions() {
        try {
            await AsyncStorage.multiRemove([PERMISSIONS_CACHE_KEY, PERMISSIONS_CACHE_TIME_KEY]);
        } catch (e) {}
    },

    hasFlag(permissions, flagName) {
        if (!permissions || !permissions.flags) return false;
        return permissions.flags[flagName] === true;
    },

    hasPermission(permissions, resource, action) {
        if (!permissions || !permissions.permissions) return false;
        const resourcePerms = permissions.permissions[resource];
        if (!resourcePerms) return false;
        return resourcePerms.includes(action) || resourcePerms.includes('*');
    },

    hasAnyRole(permissions, requiredRoles) {
        if (!permissions || !permissions.roles) return false;
        const userRoles = Array.isArray(permissions.roles) ? permissions.roles : [permissions.roles];
        return requiredRoles.some(role => userRoles.includes(role));
    },

    hasAllRoles(permissions, requiredRoles) {
        if (!permissions || !permissions.roles) return false;
        const userRoles = Array.isArray(permissions.roles) ? permissions.roles : [permissions.roles];
        return requiredRoles.every(role => userRoles.includes(role));
    },

    isScreenHidden(permissions, screenName) {
        if (!permissions || !permissions.ui_restrictions) return false;
        return permissions.ui_restrictions.hiddenScreens?.includes(screenName);
    },

    isFeatureDisabled(permissions, featureName) {
        if (!permissions || !permissions.ui_restrictions) return false;
        return permissions.ui_restrictions.disabledFeatures?.includes(featureName);
    },

    isFieldReadOnly(permissions, fieldName) {
        if (!permissions || !permissions.ui_restrictions) return false;
        return permissions.ui_restrictions.readOnlyFields?.includes(fieldName);
    },

    evaluateCondition(permissions, condition) {
        if (!condition || !condition.type) return true;

        switch (condition.type) {
            case 'hasFlag':
                return this.hasFlag(permissions, condition.flag);
            case 'hasPermission':
                return this.hasPermission(permissions, condition.resource, condition.action);
            case 'hasRole':
                return this.hasAnyRole(permissions, [condition.role]);
            default:
                return true;
        }
    }
};

export default permissionService;
