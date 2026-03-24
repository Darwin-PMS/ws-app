import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions, useFlag, usePermission, useRoleCheck } from '../../context/PermissionContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Permission Guard Component
 * 
 * Conditionally renders children based on permission checks.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if permission check passes
 * @param {React.ReactNode} props.fallback - Content to render if permission check fails (optional)
 * @param {string} props.flag - Required feature flag
 * @param {string} props.permission - Required permission in format "resource:action"
 * @param {string[]} props.roles - Required roles (any match grants access)
 * @param {boolean} props.allRoles - If true, all roles must match (default: false = any role)
 * @param {Object} props.condition - Complex condition object with flags, permissions, roles
 * @param {boolean} props.hide - If true, renders null on failure instead of fallback
 */
export const PermissionGuard = ({
    children,
    fallback = null,
    flag,
    permission,
    roles,
    allRoles = false,
    condition,
    hide = false,
}) => {
    const { hasFlag, hasPermission, hasAnyRole, hasAllRoles, evaluateCondition, isInitialized } = usePermissions();
    const { colors } = useTheme();

    // Wait for permissions to initialize
    if (!isInitialized) {
        return null;
    }

    let hasAccess = true;

    // Check feature flag
    if (flag && !hasFlag(flag)) {
        hasAccess = false;
    }

    // Check permission
    if (hasAccess && permission) {
        const [resource, action] = permission.split(':');
        if (!hasPermission(resource, action)) {
            hasAccess = false;
        }
    }

    // Check roles
    if (hasAccess && roles && roles.length > 0) {
        if (allRoles) {
            if (!hasAllRoles(roles)) {
                hasAccess = false;
            }
        } else {
            if (!hasAnyRole(roles)) {
                hasAccess = false;
            }
        }
    }

    // Check complex condition
    if (hasAccess && condition) {
        if (!evaluateCondition(condition)) {
            hasAccess = false;
        }
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    if (hide) {
        return null;
    }

    return fallback;
};

/**
 * Feature Flag Guard
 * Simplified guard for feature flag checks
 */
export const FeatureFlag = ({ flag, children, fallback = null }) => {
    const hasAccess = useFlag(flag);
    return hasAccess ? <>{children}</> : fallback;
};

/**
 * Permission Check Guard
 * Simplified guard for permission checks
 */
export const PermissionCheck = ({ resource, action, children, fallback = null }) => {
    const hasAccess = usePermission(resource, action);
    return hasAccess ? <>{children}</> : fallback;
};

/**
 * Role Guard
 * Simplified guard for role checks
 */
export const RoleGuard = ({ roles, all = false, children, fallback = null }) => {
    const hasAny = useRoleCheck(roles);
    // Note: For all roles check, use PermissionGuard directly
    return hasAny ? <>{children}</> : fallback;
};

/**
 * Screen Access Guard
 * Prevents rendering of entire screens based on access control
 */
export const ScreenGuard = ({ screenName, children, onAccessDenied }) => {
    const { isScreenHidden, isInitialized } = usePermissions();
    const { colors } = useTheme();

    if (!isInitialized) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.text, { color: colors.text }]}>Loading...</Text>
            </View>
        );
    }

    if (isScreenHidden(screenName)) {
        if (onAccessDenied) {
            onAccessDenied();
        }
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>Access Denied</Text>
                <Text style={[styles.text, { color: colors.textSecondary }]}>
                    You don't have permission to access this screen.
                </Text>
            </View>
        );
    }

    return <>{children}</>;
};

/**
 * Feature Toggle Component
 * Renders different content based on feature flag
 */
export const FeatureToggle = ({ flag, enabled, disabled = null }) => {
    const isEnabled = useFlag(flag);
    return isEnabled ? <>{enabled}</> : <>{disabled}</>;
};

/**
 * Read-Only Field Guard
 * Renders children with read-only styling if field is restricted
 */
export const ReadOnlyField = ({ fieldName, children }) => {
    const { isFieldReadOnly } = usePermissions();
    const isReadOnly = isFieldReadOnly(fieldName);

    if (isReadOnly && React.isValidElement(children)) {
        return React.cloneElement(children, {
            editable: false,
            disabled: true,
            ...children.props,
        });
    }

    return <>{children}</>;
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

export default PermissionGuard;
