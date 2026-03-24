import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '../../context/PermissionContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Higher-Order Component for permission-based access control
 * 
 * @param {Object} options
 * @param {string} options.flag - Required feature flag
 * @param {string} options.permission - Required permission (format: "resource:action")
 * @param {string[]} options.roles - Required roles
 * @param {boolean} options.allRoles - Require all roles (default: false)
 * @param {string} options.screenName - Screen name for hidden screen check
 * @param {React.ComponentType} options.fallback - Fallback component to render
 * @param {Function} options.onAccessDenied - Callback when access is denied
 */
export const withPermission = (WrappedComponent, options = {}) => {
    const {
        flag,
        permission,
        roles,
        allRoles = false,
        screenName,
        fallback: FallbackComponent,
        onAccessDenied,
    } = options;

    return function WithPermissionComponent(props) {
        const {
            hasFlag,
            hasPermission,
            hasAnyRole,
            hasAllRoles,
            isScreenHidden,
            isInitialized
        } = usePermissions();
        const { colors } = useTheme();

        // Wait for initialization
        if (!isInitialized) {
            return (
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <Text style={[styles.text, { color: colors.text }]}>Loading permissions...</Text>
                </View>
            );
        }

        // Check screen access
        if (screenName && isScreenHidden(screenName)) {
            if (onAccessDenied) {
                onAccessDenied();
            }

            if (FallbackComponent) {
                return <FallbackComponent {...props} />;
            }

            return (
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Access Denied</Text>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        You don't have permission to access this feature.
                    </Text>
                </View>
            );
        }

        // Check flag
        if (flag && !hasFlag(flag)) {
            if (FallbackComponent) {
                return <FallbackComponent {...props} />;
            }
            return null;
        }

        // Check permission
        if (permission) {
            const [resource, action] = permission.split(':');
            if (!hasPermission(resource, action)) {
                if (FallbackComponent) {
                    return <FallbackComponent {...props} />;
                }
                return null;
            }
        }

        // Check roles
        if (roles && roles.length > 0) {
            const hasRequiredRole = allRoles
                ? hasAllRoles(roles)
                : hasAnyRole(roles);

            if (!hasRequiredRole) {
                if (FallbackComponent) {
                    return <FallbackComponent {...props} />;
                }
                return null;
            }
        }

        // All checks passed, render the wrapped component
        return <WrappedComponent {...props} />;
    };
};

/**
 * HOC for feature flag-based access
 */
export const withFeatureFlag = (WrappedComponent, flag, fallback) => {
    return withPermission(WrappedComponent, { flag, fallback });
};

/**
 * HOC for role-based access
 */
export const withRole = (WrappedComponent, roles, options = {}) => {
    return withPermission(WrappedComponent, { roles, ...options });
};

/**
 * HOC for permission-based access
 */
export const withPermissionCheck = (WrappedComponent, permission, fallback) => {
    return withPermission(WrappedComponent, { permission, fallback });
};

/**
 * HOC for admin-only access
 */
export const withAdmin = (WrappedComponent, fallback) => {
    return withPermission(WrappedComponent, {
        roles: ['admin'],
        fallback,
        onAccessDenied: () => console.warn('Admin access denied'),
    });
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default withPermission;
