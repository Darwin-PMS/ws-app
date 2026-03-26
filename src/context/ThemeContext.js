import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo, Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeService from '../services/themeService';

const THEME_PREFERENCE_KEY = '@theme_preference';

export const DARK_COLORS = {
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
    textMuted: '#71717A',
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
};

export const LIGHT_COLORS = {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    accent: '#8B5CF6',
    white: '#FFFFFF',
    gray: '#71717A',
    background: '#F8FAFC',
    backgroundLight: '#F1F5F9',
    backgroundLighter: '#E2E8F0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(139, 92, 246, 0.15)',
    glassHighlight: 'rgba(139, 92, 246, 0.05)',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textAccent: '#7C3AED',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    danger: '#DC2626',
    info: '#2563EB',
    userBubble: '#7C3AED',
    aiBubble: '#F1F5F9',
    aiBubbleBorder: '#E2E8F0',
    card: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#8B5CF6',
    tabBarInactive: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    overlay: 'rgba(0, 0, 0, 0.4)',
};

export const DEFAULT_TYPOGRAPHY = {
    fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32, title: 28 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};

export const DEFAULT_SPACING = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const DEFAULT_BORDER_RADIUS = {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const createShadows = (color = '#000', isDark = true) => ({
    sm: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 2 },
    small: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 8, elevation: 4 },
    medium: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    large: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
});

const DEFAULT_CONTEXT = {
    theme: 'dark',
    isDark: true,
    colors: DARK_COLORS,
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    borderRadius: DEFAULT_BORDER_RADIUS,
    shadows: createShadows('#000', true),
    isLoading: true,
    isManualOverride: false,
    toggleTheme: () => {},
    setTheme: () => {},
    refreshTheme: () => {},
};

const ThemeContext = createContext(DEFAULT_CONTEXT);

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('dark');
    const [isLoading, setIsLoading] = useState(true);
    const [isManualOverride, setIsManualOverride] = useState(false);
    const [backendTheme, setBackendTheme] = useState(null);

    const isDark = themeMode === 'dark';

    const colors = useMemo(() => {
        if (backendTheme?.colors) {
            return isDark 
                ? { ...DARK_COLORS, ...backendTheme.colors }
                : { ...LIGHT_COLORS, ...backendTheme.colors };
        }
        return isDark ? DARK_COLORS : LIGHT_COLORS;
    }, [isDark, backendTheme]);

    const typography = useMemo(() => ({
        ...DEFAULT_TYPOGRAPHY,
        ...(backendTheme?.typography || {})
    }), [backendTheme]);

    const spacing = useMemo(() => ({
        ...DEFAULT_SPACING,
        ...(backendTheme?.spacing || {})
    }), [backendTheme]);

    const borderRadius = useMemo(() => ({
        ...DEFAULT_BORDER_RADIUS,
        ...(backendTheme?.borderRadius || {})
    }), [backendTheme]);

    const shadows = useMemo(() => createShadows('#000', isDark), [isDark]);

    const initializeTheme = useCallback(async () => {
        try {
            setIsLoading(true);

            // 1. Check local storage first
            const savedPref = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
            if (savedPref) {
                const { mode } = JSON.parse(savedPref);
                if (mode === 'light' || mode === 'dark') {
                    setThemeMode(mode);
                    setIsManualOverride(true);
                }
            } else {
                // 2. Try to get from backend
                try {
                    const pref = await themeService.getThemePreference();
                    if (pref?.mode) {
                        setThemeMode(pref.mode);
                    } else {
                        // 3. Fallback to system preference
                        const systemTheme = Appearance.getColorScheme();
                        setThemeMode(systemTheme || 'dark');
                    }
                } catch {
                    // Use system preference
                    const systemTheme = Appearance.getColorScheme();
                    setThemeMode(systemTheme || 'dark');
                }
            }

            // 4. Load backend theme for custom colors
            try {
                const theme = await themeService.getCurrentTheme();
                if (theme?.colors) {
                    setBackendTheme(theme);
                }
            } catch {
                // Backend theme is optional
            }
        } catch (error) {
            console.log('Theme init error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (!isManualOverride) {
                setThemeMode(colorScheme || 'dark');
            }
        });
        return () => subscription.remove();
    }, [isManualOverride]);

    // Refresh theme when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active' && !isManualOverride) {
                themeService.getThemePreference()
                    .then(pref => {
                        if (pref?.mode) {
                            setThemeMode(pref.mode);
                        }
                    })
                    .catch(() => {});
            }
        });
        return () => subscription.remove();
    }, [isManualOverride]);

    const toggleTheme = useCallback(async () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
        setIsManualOverride(true);

        // Save locally
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({ mode: newMode }));

        // Sync to backend (non-blocking)
        themeService.setThemePreference(newMode).catch(() => {});
    }, [themeMode]);

    const setTheme = useCallback(async (newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            setThemeMode(newTheme);
            setIsManualOverride(true);
            await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({ mode: newTheme }));
            themeService.setThemePreference(newTheme).catch(() => {});
        }
    }, []);

    const refreshTheme = useCallback(async () => {
        try {
            const theme = await themeService.getCurrentTheme();
            if (theme?.colors) {
                setBackendTheme(theme);
            }
        } catch {}
    }, []);

    const value = {
        theme: themeMode,
        isDark,
        colors,
        typography,
        spacing,
        borderRadius,
        shadows,
        isLoading,
        isManualOverride,
        toggleTheme,
        setTheme,
        refreshTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const useColors = () => {
    const { colors } = useTheme();
    return colors;
};

export default ThemeContext;
