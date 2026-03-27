import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@theme_preference';

const DARK_COLORS = {
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

const LIGHT_COLORS = {
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

const DEFAULT_TYPOGRAPHY = {
    fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32, title: 28 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};

const DEFAULT_SPACING = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

const DEFAULT_BORDER_RADIUS = {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

const createShadows = (color = '#000', isDark = true) => ({
    sm: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 2 },
    small: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 8, elevation: 4 },
    medium: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    large: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
});

const defaultContextValue = {
    theme: 'dark',
    isDark: true,
    colors: DARK_COLORS,
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    borderRadius: DEFAULT_BORDER_RADIUS,
    shadows: createShadows('#000', true),
    isLoading: false,
    isManualOverride: false,
    toggleTheme: () => {},
    setTheme: () => {},
    refreshTheme: () => {},
};

const ThemeContext = createContext(defaultContextValue);

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('dark');
    const [isLoading, setIsLoading] = useState(false);
    const [isManualOverride, setIsManualOverride] = useState(false);

    const isDark = themeMode === 'dark';

    const colors = useMemo(() => isDark ? DARK_COLORS : LIGHT_COLORS, [isDark]);
    const typography = useMemo(() => DEFAULT_TYPOGRAPHY, []);
    const spacing = useMemo(() => DEFAULT_SPACING, []);
    const borderRadius = useMemo(() => DEFAULT_BORDER_RADIUS, []);
    const shadows = useMemo(() => createShadows('#000', isDark), [isDark]);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedPref = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
                if (savedPref) {
                    const { mode } = JSON.parse(savedPref);
                    if (mode === 'light' || mode === 'dark') {
                        setThemeMode(mode);
                        setIsManualOverride(true);
                    }
                } else {
                    const systemTheme = Appearance.getColorScheme();
                    setThemeMode(systemTheme || 'dark');
                }
            } catch {
                setThemeMode('dark');
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (!isManualOverride) {
                setThemeMode(colorScheme || 'dark');
            }
        });
        return () => subscription.remove();
    }, [isManualOverride]);

    const toggleTheme = useCallback(async () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
        setIsManualOverride(true);
        try {
            await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({ mode: newMode }));
        } catch {}
    }, [themeMode]);

    const setTheme = useCallback(async (newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            setThemeMode(newTheme);
            setIsManualOverride(true);
            try {
                await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({ mode: newTheme }));
            } catch {}
        }
    }, []);

    const value = useMemo(() => ({
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
        refreshTheme: () => {},
    }), [themeMode, isDark, colors, typography, spacing, borderRadius, shadows, isLoading, isManualOverride]);

    return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        return defaultContextValue;
    }
    if (!context.colors) {
        return { ...context, colors: DARK_COLORS };
    }
    return context;
};

export const useColors = () => {
    const context = useContext(ThemeContext);
    return context?.colors || DARK_COLORS;
};

export { DARK_COLORS, LIGHT_COLORS };

export default ThemeContext;
