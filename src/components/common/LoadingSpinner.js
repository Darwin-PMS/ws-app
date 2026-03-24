// Loading Spinner Component
// A customizable loading indicator with optional message

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/theme';

const LoadingSpinner = ({
    size = 'large',
    message = 'Loading...',
    fullScreen = false,
    overlay = false
}) => {
    const { colors } = useTheme();
    const color = colors.primary;

    // Create dynamic styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        fullScreen: {
            flex: 1,
            backgroundColor: colors.background,
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
        },
        message: {
            marginTop: spacing.md,
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    });

    const containerStyle = [
        styles.container,
        fullScreen && styles.fullScreen,
        overlay && styles.overlay
    ];

    return (
        <View style={containerStyle} accessibilityLabel={message}>
            <ActivityIndicator size={size} color={color} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

// Styles need to be created inside component for dynamic colors
// This is a workaround - in practice, consider refactoring to use useTheme everywhere
export default LoadingSpinner;
