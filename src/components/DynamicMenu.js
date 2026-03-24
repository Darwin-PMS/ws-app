import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMenus, useSecondaryMenu } from '../context/MenuContext';
import { usePermissions } from '../context/PermissionContext';
import BannerCarousel from './BannerCarousel';

/**
 * Dynamic Menu Item Component
 * Renders a single menu item with appropriate styling
 */
export const DynamicMenuItem = ({ item, onPress, level = 0 }) => {
    const { colors, spacing, borderRadius } = useTheme();
    const { flags, hasPermission, hasAnyRole } = usePermissions();

    // Check if item is accessible
    const isAccessible = React.useMemo(() => {
        if (item.isVisible === false) return false;

        if (item.requiredRoles && !hasAnyRole(item.requiredRoles)) {
            return false;
        }

        if (item.requiredFlags) {
            for (const flag of item.requiredFlags) {
                if (!flags[flag]) return false;
            }
        }

        if (item.requiredPermissions) {
            for (const perm of item.requiredPermissions) {
                const [resource, action] = perm.split(':');
                if (!hasPermission(resource, action)) return false;
            }
        }

        return true;
    }, [item, flags, hasPermission, hasAnyRole]);

    if (!isAccessible) return null;

    const handlePress = () => {
        if (onPress) {
            onPress(item);
        }
    };

    const iconColor = item.color || colors.primary;
    const hasChildren = item.children && item.children.length > 0;

    return (
        <View style={{ marginLeft: level * spacing.md }}>
            <TouchableOpacity
                style={[
                    styles.item,
                    {
                        backgroundColor: colors.surface,
                        borderRadius: borderRadius.lg,
                        borderColor: colors.border,
                        marginBottom: spacing.sm,
                    },
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {item.icon && (
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: `${iconColor}20` },
                        ]}
                    >
                        <Ionicons name={item.icon} size={22} color={iconColor} />
                    </View>
                )}

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {item.label}
                    </Text>
                    {item.subtitle && (
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            {item.subtitle}
                        </Text>
                    )}
                </View>

                {hasChildren && (
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textMuted}
                    />
                )}
            </TouchableOpacity>

            {/* Render children recursively */}
            {hasChildren && (
                <View style={styles.children}>
                    {item.children.map((child) => (
                        <DynamicMenuItem
                            key={child.id}
                            item={child}
                            onPress={onPress}
                            level={level + 1}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

/**
 * Dynamic Menu Component
 * 
 * Renders a menu from the backend with permission-based filtering.
 * Can be used for primary navigation, secondary menus, or custom menu types.
 * 
 * @param {Object} props
 * @param {string} props.menuId - Specific menu ID to render
 * @param {string} props.menuType - Menu type ('primary', 'secondary', etc.)
 * @param {Function} props.onItemPress - Callback when an item is pressed
 * @param {Object} props.style - Additional container styles
 * @param {boolean} props.showHeader - Whether to show menu name as header
 */
export const DynamicMenu = ({
    menuId,
    menuType,
    onItemPress,
    style,
    showHeader = false,
    showBanner = true,
}) => {
    const { colors, spacing, borderRadius } = useTheme();
    const { menus, isLoading, isInitialized } = useMenus();

    // Banner data for menu screen
    const menuBanners = [
        {
            id: 'menu1',
            title: 'Quick Access',
            subtitle: 'Navigate easily',
            backgroundColor: '#667eea',
        },
        {
            id: 'menu2',
            title: 'Stay Updated',
            subtitle: 'Latest features',
            backgroundColor: '#f093fb',
        },
        {
            id: 'menu3',
            title: 'Help & Support',
            subtitle: 'We are here to help',
            backgroundColor: '#4facfe',
        },
    ];

    // Get the appropriate menu
    const menu = React.useMemo(() => {
        if (menuId) {
            return menus.find((m) => m.id === menuId);
        }
        if (menuType) {
            return menus.find((m) => m.type === menuType);
        }
        return menus[0] || null;
    }, [menus, menuId, menuType]);

    // Filter menu items based on new fields
    const filteredItems = React.useMemo(() => {
        // Use children array for hierarchical menu structure
        const items = menu?.children || menu?.items || [];

        return items.filter(item => {
            // Filter by isVisible
            if (item.isVisible === false) return false;
            if (menu.isVisible === false) return false;

            return true;
        });
    }, [menu]);

    if (isLoading || !isInitialized) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Use children array for hierarchical menu structure
    const items = menu?.children || menu?.items || [];
    if (!menu || items.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            {showHeader && menu.name && (
                <Text
                    style={[
                        styles.header,
                        {
                            color: menu.textColor || colors.textMuted,
                            marginBottom: spacing.md,
                            backgroundColor: menu.bgColor || 'transparent',
                            padding: spacing.sm,
                            borderRadius: borderRadius.md,
                        },
                    ]}
                >
                    {(menu.label || menu.name).toUpperCase()}
                </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredItems.map((item) => (
                    <DynamicMenuItem
                        key={item.id}
                        item={item}
                        onPress={onItemPress}
                    />
                ))}
            </ScrollView>

            {/* Banner Carousel at Bottom */}
            {showBanner && (
                <View style={styles.bannerContainer}>
                    <BannerCarousel
                        height={120}
                        autoPlay={true}
                        autoPlayInterval={5000}
                        banners={menuBanners}
                    />
                </View>
            )}
        </View>
    );
};

/**
 * Core Services Menu Component
 * Specialized component for the Core Services screen
 */
export const CoreServicesDynamicMenu = ({ navigation }) => {
    const { colors, spacing } = useTheme();
    const { items, isLoading, isInitialized } = useSecondaryMenu();

    const handleItemPress = (item) => {
        if (item.screen && navigation) {
            navigation.navigate(item.screen);
        } else if (item.route && navigation) {
            navigation.navigate(item.route);
        }
    };

    if (isLoading || !isInitialized) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!items || items.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No services available
                </Text>
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <Text
                style={[
                    styles.header,
                    { color: colors.textMuted, marginBottom: spacing.md },
                ]}
            >
                CORE SERVICES
            </Text>

            {items.map((item) => (
                <DynamicMenuItem
                    key={item.id}
                    item={item}
                    onPress={handleItemPress}
                />
            ))}
        </View>
    );
};

/**
 * Tab Bar Menu Component
 * Specialized component for tab bar navigation
 */
export const TabBarDynamicMenu = ({ state, descriptors, navigation }) => {
    const { colors } = useTheme();
    const { primaryMenu } = useMenus();

    // Map menu items to tab bar
    const visibleTabs = React.useMemo(() => {
        if (!primaryMenu) return [];
        // Use children array for hierarchical menu structure
        const items = primaryMenu.children || primaryMenu.items || [];
        return items.filter(item => item.route);
    }, [primaryMenu]);

    return (
        <View style={[styles.tabBar, { backgroundColor: colors.tabBarBackground, borderTopColor: colors.border }]}>
            {visibleTabs.map((item, index) => {
                const isFocused = state.index === index;
                const routeName = item.route;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: routeName,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(routeName);
                    }
                };

                return (
                    <TouchableOpacity
                        key={item.id}
                        onPress={onPress}
                        style={styles.tabItem}
                    >
                        <Ionicons
                            name={isFocused ? item.icon : `${item.icon}-outline`}
                            size={24}
                            color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                        />
                        <Text
                            style={{
                                color: isFocused ? colors.tabBarActive : colors.tabBarInactive,
                                fontSize: 11,
                                marginTop: 4,
                            }}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
    },
    header: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    children: {
        marginTop: 8,
    },
    bannerContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    tabBar: {
        flexDirection: 'row',
        height: 85,
        paddingTop: 8,
        paddingBottom: 25,
        borderTopWidth: 1,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DynamicMenu;
