import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import permissionService from '../services/permissionService';
import { useApp } from './AppContext';

// Create the context with default values
const PermissionContext = createContext({
    permissions: null,
    role: null,
    roles: [],
    flags: {},
    uiRestrictions: {},
    isLoading: false,
    isInitialized: false,
    error: null,
    // Permission check functions
    hasFlag: () => false,
    hasPermission: () => false,
    hasAnyRole: () => false,
    hasAllRoles: () => false,
    isScreenHidden: () => false,
    isFeatureDisabled: () => false,
    isFieldReadOnly: () => false,
    evaluateCondition: () => false,
    // Actions
    refreshPermissions: () => { },
    clearPermissions: () => { },
});

/**
 * Permission Provider Component
 * 
 * Manages user permissions, roles, and feature flags from the backend.
 * Provides methods to check access control throughout the app.
 */
export const PermissionProvider = ({ children }) => {
    const { isLoggedIn, userRole } = useApp();

    const [permissions, setPermissions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);

    // Extract permission data
    const role = useMemo(() => permissions?.role || userRole || null, [permissions, userRole]);
    const roles = useMemo(() => permissions?.roles || [], [permissions]);
    const flags = useMemo(() => permissions?.flags || {}, [permissions]);
    const uiRestrictions = useMemo(() => permissions?.uiRestrictions || {}, [permissions]);

    /**
     * Load permissions from backend
     */
    const loadPermissions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await permissionService.getCurrentPermissions();

            if (result.success && result.data) {
                setPermissions(result.data);
            } else {
                throw new Error(result.message || 'Failed to load permissions');
            }
        } catch (err) {
            // Silent fail for auth errors - user will be logged out by API client

            // Check if this is an auth error (401/403)
            const isAuthError = err.status === 401 || err.status === 403 ||
                (err.message && (err.message.includes('Invalid or expired token') ||
                    err.message.includes('Authentication failed') ||
                    err.message.includes('token')));

            // Set error message
            setError(err.message);

            // For auth errors, the API client should handle logout via authFailureCallback
            // We just log it here
            if (isAuthError) {
                // Auth error detected - user will be logged out
            }

            // Try to use cached permissions as fallback
            const cached = await permissionService.getCachedPermissions();
            if (cached) {
                setPermissions(cached);
            }
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, []);

    /**
     * Initialize permissions when user logs in
     */
    useEffect(() => {
        if (isLoggedIn) {
            loadPermissions();
        } else {
            // Clear permissions when logged out
            setPermissions(null);
            setIsInitialized(false);
            permissionService.clearCachedPermissions();
        }
    }, [isLoggedIn, loadPermissions]);

    /**
     * Refresh permissions from backend
     */
    const refreshPermissions = useCallback(async () => {
        if (!isLoggedIn) return;
        await loadPermissions();
    }, [isLoggedIn, loadPermissions]);

    /**
     * Clear permissions (e.g., on logout)
     */
    const clearPermissions = useCallback(async () => {
        setPermissions(null);
        setIsInitialized(false);
        setError(null);
        await permissionService.clearCachedPermissions();
    }, []);

    // Permission check functions
    const hasFlag = useCallback((flagName) => {
        return permissionService.hasFlag(permissions, flagName);
    }, [permissions]);

    const hasPermission = useCallback((resource, action) => {
        return permissionService.hasPermission(permissions, resource, action);
    }, [permissions]);

    const hasAnyRole = useCallback((requiredRoles) => {
        return permissionService.hasAnyRole(permissions, requiredRoles);
    }, [permissions]);

    const hasAllRoles = useCallback((requiredRoles) => {
        return permissionService.hasAllRoles(permissions, requiredRoles);
    }, [permissions]);

    const isScreenHidden = useCallback((screenName) => {
        return permissionService.isScreenHidden(permissions, screenName);
    }, [permissions]);

    const isFeatureDisabled = useCallback((featureName) => {
        return permissionService.isFeatureDisabled(permissions, featureName);
    }, [permissions]);

    const isFieldReadOnly = useCallback((fieldName) => {
        return permissionService.isFieldReadOnly(permissions, fieldName);
    }, [permissions]);

    const evaluateCondition = useCallback((condition) => {
        return permissionService.evaluateCondition(permissions, condition);
    }, [permissions]);

    // Context value
    const value = {
        permissions,
        role,
        roles,
        flags,
        uiRestrictions,
        isLoading,
        isInitialized,
        error,
        // Check functions
        hasFlag,
        hasPermission,
        hasAnyRole,
        hasAllRoles,
        isScreenHidden,
        isFeatureDisabled,
        isFieldReadOnly,
        evaluateCondition,
        // Actions
        refreshPermissions,
        clearPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

/**
 * Custom hook to access permission context
 */
export const usePermissions = () => {
    const context = useContext(PermissionContext);

    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }

    return context;
};

/**
 * Hook to check if user has a specific flag
 */
export const useFlag = (flagName) => {
    const { hasFlag } = usePermissions();
    return hasFlag(flagName);
};

/**
 * Hook to check if user has a specific permission
 */
export const usePermission = (resource, action) => {
    const { hasPermission } = usePermissions();
    return hasPermission(resource, action);
};

/**
 * Hook to check if user has any of the specified roles
 */
export const useRoleCheck = (requiredRoles) => {
    const { hasAnyRole } = usePermissions();
    return hasAnyRole(requiredRoles);
};

/**
 * Hook to get UI restrictions
 */
export const useUIRestrictions = () => {
    const { uiRestrictions, isScreenHidden, isFeatureDisabled, isFieldReadOnly } = usePermissions();

    return {
        uiRestrictions,
        isScreenHidden,
        isFeatureDisabled,
        isFieldReadOnly,
    };
};

export default PermissionContext;
