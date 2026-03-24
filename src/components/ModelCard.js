import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing, shadows } from '../theme/theme';

const ModelCard = ({ model, isSelected, onSelect }) => {
    const { colors } = useTheme();

    // Create styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.sm,
        },
        selectedContainer: {
            borderColor: colors.primary,
            backgroundColor: colors.glassHighlight,
        },
        header: {
            marginBottom: spacing.sm,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        name: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
            marginRight: spacing.sm,
        },
        badge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '600',
        },
        owner: {
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 2,
        },
        details: {
            flexDirection: 'row',
            marginBottom: spacing.sm,
        },
        detailItem: {
            flex: 1,
        },
        detailLabel: {
            fontSize: 11,
            color: colors.textMuted,
            marginBottom: 2,
        },
        detailValue: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        capabilities: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.xs,
        },
        capabilityTag: {
            backgroundColor: colors.backgroundLighter,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
        },
        capabilityText: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        selectedIndicator: {
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
        },
        selectedText: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '600',
        },
    });

    // Determine status badge
    const getStatusBadge = () => {
        const id = model.id.toLowerCase();
        if (id.includes('preview')) {
            return { text: 'Preview', color: colors.info };
        }
        if (id.includes('deprecated') || id.includes('old')) {
            return { text: 'Deprecated', color: colors.warning };
        }
        return { text: 'Production', color: colors.success };
    };

    const status = getStatusBadge();

    // Get model capabilities
    const getCapabilities = () => {
        const capabilities = [];
        if (model.id.includes('vision') || model.id.includes('llama-4')) {
            capabilities.push('Vision');
        }
        if (model.id.includes('whisper')) {
            capabilities.push('Speech-to-Text');
        }
        if (model.id.includes('tts') || model.id.includes('orpheus')) {
            capabilities.push('Text-to-Speech');
        }
        if (model.id.includes('llama') || model.id.includes('mixtral') || model.id.includes('gemma')) {
            capabilities.push('Chat');
        }
        return capabilities.length > 0 ? capabilities : ['Chat'];
    };

    const capabilities = getCapabilities();

    // Get context window if available
    const contextWindow = model.context_window || model.max_tokens || 'Unknown';

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={() => onSelect?.(model.id)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={1}>{model.id}</Text>
                    <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
                        <Text style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
                    </View>
                </View>
                {model.owned_by && (
                    <Text style={styles.owner}>by {model.owned_by}</Text>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Context Window</Text>
                    <Text style={styles.detailValue}>{contextWindow.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.capabilities}>
                {capabilities.map((cap, index) => (
                    <View key={index} style={styles.capabilityTag}>
                        <Text style={styles.capabilityText}>{cap}</Text>
                    </View>
                ))}
            </View>

            {isSelected && (
                <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓ Active</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default ModelCard;
