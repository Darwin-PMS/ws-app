// Empty State Component
// Displayed when there's no data to show

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../theme/theme';

const EmptyState = ({
    icon = 'folder-open-outline',
    title = 'No Data',
    message = 'There is nothing to display here.',
    actionLabel,
    onAction,
}) => {
    const { colors } = useTheme();
    const iconColor = colors.textSecondary;

    // Create dynamic styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
        },
        iconContainer: {
            marginBottom: spacing.lg,
            opacity: 0.7,
        },
        title: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
        },
        message: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
        },
        actionButton: {
            marginTop: spacing.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
        },
        actionText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#fff',
        },
    });
    return (
        <View style={styles.container} accessibilityLabel={title}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={60} color={iconColor} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onAction}
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default EmptyState;
