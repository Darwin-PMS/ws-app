// Theme configuration for Groq AI/ML App
// Premium dark mode design tokens

// ============================================
// BASE & THEME-SPECIFIC COLORS
// ============================================

// Colors that are the same for both light and dark themes
const baseColors = {
    // Primary gradient colors
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',

    // Secondary gradient colors
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',

    // Accent color
    accent: '#8B5CF6',

    // Common colors
    white: '#FFFFFF',
    gray: '#71717A',

    // User message colors (consistent across themes)
    userBubble: '#7C3AED',
    userBubbleGradient: ['#8B5CF6', '#7C3AED'],
};

export const darkColors = {
    ...baseColors,
    // Override gray for dark theme
    gray: '#71717A',
    // Background colors
    background: '#0F0F14',
    backgroundLight: '#1A1A24',
    backgroundLighter: '#252532',
    surface: '#1E1E2C',
    surfaceElevated: '#252532',

    // Glass effect colors - Dark
    glass: 'rgba(30, 30, 44, 0.7)',
    glassBorder: 'rgba(139, 92, 246, 0.2)',
    glassHighlight: 'rgba(139, 92, 246, 0.1)',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    textAccent: '#C4B5FD',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    danger: '#EF4444',
    info: '#3B82F6',

    // AI message colors - Dark
    aiBubble: '#1E1E2C', // Same as surface
    aiBubbleBorder: '#3F3F5A',

    // Card color
    card: '#1E1E2C',

    // Tab bar colors
    tabBarBackground: '#14141B',
    tabBarActive: '#8B5CF6',
    tabBarInactive: '#71717A',

    // Border colors
    border: '#3F3F5A',
    borderLight: '#27273A',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
};

// ============================================
export const lightColors = {
    ...baseColors,
    // Override gray for light theme
    gray: '#94A3B8',
    // Background colors - Light theme
    background: '#F8FAFC',
    backgroundLight: '#F1F5F9',
    backgroundLighter: '#E2E8F0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Glass effect colors - Light theme
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(139, 92, 246, 0.15)',
    glassHighlight: 'rgba(139, 92, 246, 0.05)',

    // Text colors - Light theme
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textAccent: '#7C3AED',

    // Status colors
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    danger: '#DC2626',
    info: '#2563EB',

    // AI message colors - Light
    aiBubble: '#F1F5F9',
    aiBubbleBorder: '#E2E8F0',

    // Card color
    card: '#FFFFFF',

    // Tab bar colors - Light theme
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#8B5CF6',
    tabBarInactive: '#94A3B8',

    // Border colors - Light theme
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',
};

// Backward compatibility - export as 'colors' (defaults to light)
// Note: Using a plain object instead of Proxy to avoid Metro bundler issues
export const colors = { ...lightColors };

// ============================================
// SHARED DESIGN TOKENS
// ============================================

export const gradients = (currentColors) => ({
    primary: [currentColors.primary, currentColors.primaryDark],
    secondary: [currentColors.secondary, currentColors.secondaryDark],
    background: [currentColors.backgroundLight, currentColors.background],
    card: [currentColors.backgroundLighter, currentColors.surface],
    button: [currentColors.primary, currentColors.primaryDark],
    accent: [currentColors.primaryLight, currentColors.primary],
});

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const typography = {
    // Font families
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },

    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 32,
        title: 28,
    },

    // Font weights
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const shadows = (currentColors) => ({
    sm: {
        shadowColor: currentColors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    small: {
        shadowColor: currentColors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: currentColors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    medium: {
        shadowColor: currentColors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: currentColors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    large: {
        shadowColor: currentColors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: {
        shadowColor: currentColors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
});

// ============================================
// ASSEMBLED THEMES
// ============================================

const common = {
    spacing,
    borderRadius,
    typography,
};

export const themes = {
    light: { ...common, colors: lightColors, gradients: gradients(lightColors), shadows: shadows(lightColors) },
    dark: { ...common, colors: darkColors, gradients: gradients(darkColors), shadows: shadows(darkColors) },
};

// Default export for backward compatibility or direct use (light mode only)
export default themes.light;
