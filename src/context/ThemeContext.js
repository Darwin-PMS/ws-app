import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AccessibilityInfo, Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeService from '../services/themeService';
import { darkColors, lightColors } from '../theme/theme';

const THEME_PREFERENCE_KEY = '@theme_preference';

// Default theme configuration (fallback)
const defaultThemeConfig = {
    colors: {
        primary: '#8B5CF6',
        primaryLight: '#A78BFA',
        primaryDark: '#7C3AED',
        secondary: '#EC4899',
        secondaryLight: '#F472B6',
        secondaryDark: '#DB2777',
        accent: '#8B5CF6',
        white: '#FFFFFF',
        gray: '#71717A',
        background: '#0F0F14',
        backgroundLight: '#1A1A24',
        backgroundLighter: '#252532',
        surface: '#1E1E2C',
        surfaceElevated: '#252532',
        glass: 'rgba(30, 30, 44, 0.7)',
        glassBorder: 'rgba(139, 92, 246, 0.2)',
        glassHighlight: 'rgba(139, 92, 246, 0.1)',
        text: '#FFFFFF',
        textSecondary: '#A1A1AA',
        textMuted: '#d7d7dfff',
        textAccent: '#C4B5FD',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        danger: '#EF4444',
        info: '#3B82F6',
        userBubble: '#7C3AED',
        aiBubble: '#1E1E2C',
        aiBubbleBorder: '#3F3F5A',
        card: '#1E1E2C',
        tabBarBackground: '#14141B',
        tabBarActive: '#8B5CF6',
        tabBarInactive: '#71717A',
        border: '#3F3F5A',
        borderLight: '#27273A',
        overlay: 'rgba(0, 0, 0, 0.6)',
    },
    typography: {
        fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
        fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32, title: 28 },
        fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
        lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
    shadows: {
        sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
        small: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
        md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
        medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
        lg: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
        large: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
        glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    },
};

// Create the context with default values
const ThemeContext = createContext({
    theme: 'dark',
    isDark: true,
    colors: defaultThemeConfig.colors,
    typography: defaultThemeConfig.typography,
    spacing: defaultThemeConfig.spacing,
    borderRadius: defaultThemeConfig.borderRadius,
    shadows: defaultThemeConfig.shadows,
    themeConfig: defaultThemeConfig,
    isLoading: true,
    isDynamic: false,
    toggleTheme: () => { },
    setTheme: () => { },
    refreshTheme: () => { },
});

/**
 * Theme Provider Component with Dynamic Backend Loading
 * 
 * Features:
 * - Fetches theme from backend API
 * - Caches theme locally for offline use
 * - Falls back to default theme on errors
 * - Supports runtime theme updates
 * - System preference detection
 */
export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('dark');
    const [themeConfig, setThemeConfig] = useState(defaultThemeConfig);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDynamic, setIsDynamic] = useState(false);
    const [isAccessibilityReduced, setIsAccessibilityReduced] = useState(false);
    const [isManualOverride, setIsManualOverride] = useState(false);
    const baseThemeColors = useRef(null);

    const isDark = themeMode === 'dark';

    // Extract theme values from config with deep merge to ensure all colors exist
    const colors = useMemo(() => {
        const baseColors = themeConfig.colors || defaultThemeConfig.colors;
        const modeColors = isDark ? darkColors : lightColors;
        
        if (isManualOverride && baseThemeColors.current) {
            return {
                ...baseThemeColors.current,
                ...modeColors,
                primary: baseColors.primary || modeColors.primary,
                primaryLight: baseColors.primaryLight || modeColors.primaryLight,
                primaryDark: baseColors.primaryDark || modeColors.primaryDark,
                secondary: baseColors.secondary || modeColors.secondary,
                secondaryLight: baseColors.secondaryLight || modeColors.secondaryLight,
                secondaryDark: baseColors.secondaryDark || modeColors.secondaryDark,
                accent: baseColors.accent || modeColors.accent,
            };
        }
        
        return {
            ...defaultThemeConfig.colors,
            ...baseColors
        };
    }, [themeConfig, isDark, isManualOverride]);
    const typography = useMemo(() => ({
        ...defaultThemeConfig.typography,
        ...(themeConfig.typography || {})
    }), [themeConfig]);
    const spacing = useMemo(() => ({
        ...defaultThemeConfig.spacing,
        ...(themeConfig.spacing || {})
    }), [themeConfig]);
    const borderRadius = useMemo(() => ({
        ...defaultThemeConfig.borderRadius,
        ...(themeConfig.borderRadius || {})
    }), [themeConfig]);
    const shadows = useMemo(() => ({
        ...defaultThemeConfig.shadows,
        ...(themeConfig.shadows || {})
    }), [themeConfig]);

    /**
     * Load theme from backend
     */
    const loadThemeFromBackend = useCallback(async () => {
        try {
            const result = await themeService.getCurrentTheme();

            if (result.success && result.data) {
                const backendTheme = result.data;

                // Transform backend theme to frontend format with deep merge
                const transformedTheme = {
                    colors: { ...defaultThemeConfig.colors, ...(backendTheme.colors || {}) },
                    typography: { ...defaultThemeConfig.typography, ...(backendTheme.typography || {}) },
                    spacing: { ...defaultThemeConfig.spacing, ...(backendTheme.spacing || {}) },
                    borderRadius: { ...defaultThemeConfig.borderRadius, ...(backendTheme.borderRadius || {}) },
                    shadows: { ...defaultThemeConfig.shadows, ...(backendTheme.shadows || {}) },
                };

                // Cache the theme
                await themeService.cacheTheme(backendTheme);

                return transformedTheme;
            }
            return null;
        } catch (error) {
            // Silent fail - use cached/default theme

            // Check if this is an auth error (401/403)
            const isAuthError = error.status === 401 || error.status === 403 ||
                (error.message && (error.message.includes('Invalid or expired token') ||
                    error.message.includes('Authentication failed')));

            // For auth errors, the API client handles logout via authFailureCallback
            if (isAuthError) {
                // Auth error detected - user will be logged out
            }

            return null;
        }
    }, []);

    /**
     * Initialize theme on app startup
     */
    const initializeTheme = useCallback(async () => {
        try {
            setIsLoading(true);

            // First, check for user's manual preference
            const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
            if (savedPreference) {
                const { mode, config } = JSON.parse(savedPreference);
                setThemeMode(mode);
                setIsManualOverride(true);
                if (config) {
                    setThemeConfig(config);
                    baseThemeColors.current = config.colors;
                }
            } else {
                // First, try to get cached theme for immediate display
                const cachedTheme = await themeService.getCachedTheme();

                if (cachedTheme) {
                    const transformedTheme = {
                        colors: { ...defaultThemeConfig.colors, ...(cachedTheme.colors || {}) },
                        typography: { ...defaultThemeConfig.typography, ...(cachedTheme.typography || {}) },
                        spacing: { ...defaultThemeConfig.spacing, ...(cachedTheme.spacing || {}) },
                        borderRadius: { ...defaultThemeConfig.borderRadius, ...(cachedTheme.borderRadius || {}) },
                        shadows: { ...defaultThemeConfig.shadows, ...(cachedTheme.shadows || {}) },
                    };
                    setThemeConfig(transformedTheme);
                    baseThemeColors.current = transformedTheme.colors;
                    setIsDynamic(true);

                    // Determine theme mode from background color
                    const bgColor = transformedTheme.colors.background;
                    const isDarkTheme = bgColor === '#0F0F14' || bgColor === '#000000' || bgColor?.startsWith('#0');
                    setThemeMode(isDarkTheme ? 'dark' : 'light');
                } else {
                    // Use system preference as fallback
                    const systemTheme = Appearance.getColorScheme();
                    setThemeMode(systemTheme || 'dark');
                }
            }

            // Then fetch from backend in background
            const backendTheme = await loadThemeFromBackend();

            if (backendTheme && !savedPreference) {
                setThemeConfig(backendTheme);
                baseThemeColors.current = backendTheme.colors;
                setIsDynamic(true);

                // Determine theme mode from background color
                const bgColor = backendTheme.colors.background;
                const isDarkTheme = bgColor === '#0F0F14' || bgColor === '#000000' || bgColor?.startsWith('#0');
                setThemeMode(isDarkTheme ? 'dark' : 'light');
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, [loadThemeFromBackend]);

    /**
     * Refresh theme from backend
     */
    const refreshTheme = useCallback(async () => {
        // Don't refresh if user has manual override
        if (isManualOverride) {
            return;
        }

        try {
            setIsLoading(true);
            const backendTheme = await loadThemeFromBackend();

            if (backendTheme) {
                setThemeConfig(backendTheme);
                baseThemeColors.current = backendTheme.colors;
                setIsDynamic(true);

                const bgColor = backendTheme.colors.background;
                const isDarkTheme = bgColor === '#0F0F14' || bgColor === '#000000' || bgColor?.startsWith('#0');
                setThemeMode(isDarkTheme ? 'dark' : 'light');
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, [loadThemeFromBackend, isManualOverride]);

    // Initial theme load
    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            // Only update if not using dynamic backend theme and no manual override
            if (!isDynamic && !isManualOverride && colorScheme) {
                setThemeMode(colorScheme);
            }
        });

        return () => subscription.remove();
    }, [isDynamic, isManualOverride]);

    // Listen for app state changes to refresh theme when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // Refresh theme when app comes to foreground
                refreshTheme();
            }
        });

        return () => subscription.remove();
    }, [refreshTheme]);

    // Listen for accessibility changes
    useEffect(() => {
        const checkAccessibility = async () => {
            try {
                const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
                setIsAccessibilityReduced(reducedMotion);
            } catch (error) {
                // Error checking accessibility
            }
        };

        checkAccessibility();

        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setIsAccessibilityReduced
        );

        return () => {
            if (subscription && subscription.remove) {
                subscription.remove();
            }
        };
    }, []);

    // Toggle theme - works with both dynamic and non-dynamic themes
    const toggleTheme = useCallback(async () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
        setIsManualOverride(true);

        // Store user's preference
        try {
            await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({
                mode: newMode,
                config: baseThemeColors.current ? {
                    colors: baseThemeColors.current,
                    typography: themeConfig.typography,
                    spacing: themeConfig.spacing,
                    borderRadius: themeConfig.borderRadius,
                    shadows: themeConfig.shadows,
                } : null
            }));
            // Sync with backend
            themeService.setThemePreference(newMode).catch(() => {});
        } catch (error) {
            // Silent fail
        }
    }, [themeMode, themeConfig]);

    // Set theme mode - works with both dynamic and non-dynamic themes
    const setTheme = useCallback(async (newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            setThemeMode(newTheme);
            setIsManualOverride(true);

            // Store user's preference
            try {
                await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({
                    mode: newTheme,
                    config: baseThemeColors.current ? {
                        colors: baseThemeColors.current,
                        typography: themeConfig.typography,
                        spacing: themeConfig.spacing,
                        borderRadius: themeConfig.borderRadius,
                        shadows: themeConfig.shadows,
                    } : null
                }));
                // Sync with backend
                themeService.setThemePreference(newTheme).catch(() => {});
            } catch (error) {
                // Silent fail
            }
        }
    }, [themeConfig]);

    // Context value
    const value = {
        theme: themeMode,
        isDark,
        colors,
        typography,
        spacing,
        borderRadius,
        shadows,
        themeConfig,
        isLoading,
        isDynamic,
        isManualOverride,
        isInitialized,
        isAccessibilityReduced,
        toggleTheme,
        setTheme,
        refreshTheme,
    };

    // Note: We no longer block rendering with `return null` during initialization
    // The default theme is immediately available for first-time users
    // This prevents blank/white screen while theme is loading
    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Custom hook to access theme context
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
};

/**
 * Hook to get colors that automatically update with theme changes
 */
export const useColors = () => {
    const { colors } = useTheme();
    return colors;
};

/**
 * Hook to check if a feature is available based on theme capabilities
 */
export const useThemeFeature = (feature) => {
    const { themeConfig } = useTheme();

    const features = {
        hasGradients: !!themeConfig.colors?.primary && !!themeConfig.colors?.primaryDark,
        hasGlassEffects: !!themeConfig.colors?.glass,
        hasCustomTypography: !!themeConfig.typography?.fontFamily,
        hasAnimations: true, // Could be disabled based on accessibility
    };

    return features[feature] || false;
};

export default ThemeContext;
