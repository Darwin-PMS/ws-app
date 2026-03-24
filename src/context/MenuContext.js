import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import menuService from '../services/menuService';
import { usePermissions } from './PermissionContext';

// Create the context with default values
const MenuContext = createContext({
    menus: [],
    primaryMenu: null,
    secondaryMenu: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    // Actions
    refreshMenus: () => { },
    clearMenus: () => { },
    getMenuById: () => null,
    findMenuItem: () => null,
    findMenuItemByRoute: () => null,
});

/**
 * Menu Provider Component
 * 
 * Manages dynamic menus from the backend.
 * Filters menu items based on user permissions.
 */
export const MenuProvider = ({ children }) => {
    const { permissions, role, flags, hasPermission, hasAnyRole, isInitialized: permissionsInitialized } = usePermissions();

    const [menus, setMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);

    // Extract specific menus
    const primaryMenu = useMemo(() =>
        menus.find(m => m.type === 'primary') || null,
        [menus]
    );

    const secondaryMenu = useMemo(() =>
        menus.find(m => m.type === 'secondary') || null,
        [menus]
    );

    /**
     * Filter menu items based on current permissions
     */
    const filterMenuItems = useCallback((items) => {
        if (!items || !Array.isArray(items)) return [];

        return items.filter(item => {
            // Check visibility
            if (item.isVisible === false || item.is_visible === false) return false;

            // Check role requirements - support both camelCase and snake_case
            const requiredRoles = item.requiredRoles || item.required_roles;
            if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
                if (!hasAnyRole(requiredRoles)) {
                    return false;
                }
            }

            // Check flag requirements
            const requiredFlags = item.requiredFlags || item.required_flags;
            if (requiredFlags && Array.isArray(requiredFlags) && requiredFlags.length > 0) {
                for (const flag of requiredFlags) {
                    if (!flags[flag]) {
                        return false;
                    }
                }
            }

            // Check permission requirements
            const requiredPermissions = item.requiredPermissions || item.required_permissions;
            if (requiredPermissions && Array.isArray(requiredPermissions) && requiredPermissions.length > 0) {
                for (const perm of requiredPermissions) {
                    const [resource, action] = perm.split(':');
                    if (!hasPermission(resource, action)) {
                        return false;
                    }
                }
            }

            // Recursively filter children
            if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                item.children = filterMenuItems(item.children);
            }

            return true;
        });
    }, [permissions, flags, hasAnyRole, hasPermission]);

    /**
     * Load menus from backend
     */
    const loadMenus = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await menuService.getMenusForUser();

            if (result.success && result.data) {
                // Filter menus based on permissions
                const filteredMenus = result.data.map(menu => {
                    // For hierarchical menus, children are stored in the 'children' property
                    // For flat menus, items are stored in the 'items' property
                    const menuItems = menu.children || menu.items || [];

                    return {
                        ...menu,
                        items: filterMenuItems(menuItems),
                    };
                });

                setMenus(filteredMenus);

                // Cache menus
                await menuService.cacheMenus(result.data);
            } else {
                throw new Error(result.message || 'Failed to load menus');
            }
        } catch (err) {
            // Silent fail - use cached menus

            // Check if this is an auth error (401/403)
            const isAuthError = err.status === 401 || err.status === 403 ||
                (err.message && (err.message.includes('Invalid or expired token') ||
                    err.message.includes('Authentication failed')));

            // For auth errors, the API client handles logout via authFailureCallback
            // We just log and continue with cached data if available
            if (isAuthError) {
                // Auth error detected - user will be logged out
            }

            // Only show error message for non-auth errors
            // Auth errors are handled by the auth flow (user will be redirected to login)
            if (!isAuthError) {
                setError(err.message);
            }

            // Try to use cached menus as fallback for better UX
            const cached = await menuService.getCachedMenus();
            if (cached) {
                const filteredMenus = cached.map(menu => {
                    const menuItems = menu.children || menu.items || [];
                    return {
                        ...menu,
                        items: filterMenuItems(menuItems),
                    };
                });
                setMenus(filteredMenus);
            }
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, [filterMenuItems]);

    /**
     * Initialize menus when permissions are ready
     */
    useEffect(() => {
        if (permissionsInitialized) {
            loadMenus();
        }
    }, [permissionsInitialized, loadMenus]);

    /**
     * Refresh menus from backend
     */
    const refreshMenus = useCallback(async () => {
        await loadMenus();
    }, [loadMenus]);

    /**
     * Clear menus (e.g., on logout)
     */
    const clearMenus = useCallback(async () => {
        setMenus([]);
        setIsInitialized(false);
        setError(null);
        await menuService.clearCachedMenus();
    }, []);

    /**
     * Get menu by ID
     */
    const getMenuById = useCallback((menuId) => {
        return menus.find(m => m.id === menuId) || null;
    }, [menus]);

    /**
     * Find menu item by ID
     */
    const findMenuItem = useCallback((itemId) => {
        for (const menu of menus) {
            // Search in children array (hierarchical) first, then items
            const items = menu.children || menu.items || [];
            const found = menuService.findMenuItem(items, itemId);
            if (found) return found;
        }
        return null;
    }, [menus]);

    /**
     * Find menu item by route/screen
     */
    const findMenuItemByRoute = useCallback((route) => {
        for (const menu of menus) {
            // Search in children array (hierarchical) first, then items
            const items = menu.children || menu.items || [];
            const found = menuService.findMenuItemByRoute(items, route);
            if (found) return found;
        }
        return null;
    }, [menus]);

    // Context value
    const value = {
        menus,
        primaryMenu,
        secondaryMenu,
        isLoading,
        isInitialized,
        error,
        // Actions
        refreshMenus,
        clearMenus,
        getMenuById,
        findMenuItem,
        findMenuItemByRoute,
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};

/**
 * Custom hook to access menu context
 */
export const useMenus = () => {
    const context = useContext(MenuContext);

    if (!context) {
        throw new Error('useMenus must be used within a MenuProvider');
    }

    return context;
};

/**
 * Hook to get primary navigation items
 */
export const usePrimaryMenu = () => {
    const { primaryMenu, isLoading, isInitialized } = useMenus();

    return {
        // Use children array for hierarchical menu structure (items stored in children)
        items: primaryMenu?.children || primaryMenu?.items || [],
        isLoading,
        isInitialized,
    };
};

/**
 * Hook to get secondary/core services menu items
 */
export const useSecondaryMenu = () => {
    const { secondaryMenu, isLoading, isInitialized } = useMenus();

    return {
        // Use children array for hierarchical menu structure (items stored in children)
        items: secondaryMenu?.children || secondaryMenu?.items || [],
        isLoading,
        isInitialized,
    };
};

/**
 * Hook to check if a specific menu item is accessible
 */
export const useMenuItemAccess = (itemId) => {
    const { findMenuItem } = useMenus();
    const { permissions, hasAnyRole, hasPermission } = usePermissions();

    const item = findMenuItem(itemId);

    if (!item) return { accessible: false, item: null };

    // Check role requirements
    if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (!hasAnyRole(item.requiredRoles)) {
            return { accessible: false, item };
        }
    }

    // Check permission requirements
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        for (const perm of item.requiredPermissions) {
            const [resource, action] = perm.split(':');
            if (!hasPermission(resource, action)) {
                return { accessible: false, item };
            }
        }
    }

    return { accessible: true, item };
};

export default MenuContext;
