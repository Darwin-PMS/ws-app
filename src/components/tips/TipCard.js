// Tip Card Component
// Expandable card showing child care tip details

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const TipCard = ({
    tip,
    onPress,
    onFavorite,
    isFavorite = false,
    showCategory = true,
}) => {
    const { colors, spacing, borderRadius } = useTheme();
    const [expanded, setExpanded] = useState(false);

    const getIconName = (iconName) => {
        const iconMap = {
            'calendar': 'calendar',
            'medkit-outline': 'medkit',
            'heart': 'heart',
            'restaurant': 'restaurant',
            'car': 'car',
            'home': 'home',
            'game-controller': 'game-controller',
            'book': 'book',
            'tv': 'tv',
            'people': 'people',
        };
        return iconMap[iconName] || 'information-circle';
    };

    const getCategoryColor = (category) => {
        const categoryColors = {
            health: '#10B981',
            nutrition: '#F59E0B',
            safety: '#EF4444',
            development: '#8B5CF6',
            education: '#3B82F6',
        };
        return categoryColors[category] || colors.primary;
    };

    const handlePress = () => {
        if (onPress) {
            onPress(tip);
        } else {
            setExpanded(!expanded);
        }
    };

    const categoryColor = getCategoryColor(tip.category);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${tip.title} tip`}
        >
            {/* Left: Icon */}
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
                <Ionicons name={getIconName(tip.icon)} size={24} color={categoryColor} />
            </View>

            {/* Middle: Content */}
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
                        {tip.title}
                    </Text>
                    {showCategory && (
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>
                                {tip.category}
                            </Text>
                        </View>
                    )}
                </View>

                <Text
                    style={styles.content}
                    numberOfLines={expanded ? undefined : 2}
                >
                    {tip.content}
                </Text>

                {/* Expanded content */}
                {expanded && tip.ageRange && (
                    <View style={styles.ageRangeContainer}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.ageRangeText}>
                            Recommended age: {tip.ageRange.min}-{tip.ageRange.max} months
                        </Text>
                    </View>
                )}
            </View>

            {/* Right: Actions */}
            <View style={styles.actionsContainer}>
                {onFavorite && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => onFavorite(tip.id)}
                        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFavorite ? '#EF4444' : colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    categoryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.md,
        marginLeft: spacing.sm,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    content: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    ageRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    ageRangeText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    actionsContainer: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: spacing.sm,
    },
    favoriteButton: {
        padding: spacing.xs,
    },
});

export default TipCard;
