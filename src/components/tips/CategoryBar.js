// Category Bar Component
// Horizontal scrollable category selector

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const CategoryBar = ({
    categories = [],
    selectedCategory = 'all',
    onSelectCategory,
    showCounts = false,
}) => {
    const { colors, spacing, borderRadius } = useTheme();
    const getIconName = (iconName) => {
        // Map icon names to Ionicons
        const iconMap = {
            'apps': 'apps',
            'medkit': 'medkit',
            'nutrition': 'nutrition',
            'shield-checkmark': 'shield-checkmark',
            'trending-up': 'trending-up',
            'school': 'school',
        };
        return iconMap[iconName] || 'folder';
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.id;

                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                isSelected && styles.categoryChipActive
                            ]}
                            onPress={() => onSelectCategory(category.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`${category.name} category`}
                        >
                            <Ionicons
                                name={getIconName(category.icon)}
                                size={16}
                                color={isSelected ? '#fff' : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.categoryText,
                                    isSelected && styles.categoryTextActive
                                ]}
                            >
                                {category.name}
                            </Text>
                            {showCounts && category.count !== undefined && (
                                <View style={[
                                    styles.countBadge,
                                    isSelected && styles.countBadgeActive
                                ]}>
                                    <Text style={[
                                        styles.countText,
                                        isSelected && styles.countTextActive
                                    ]}>
                                        {category.count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        paddingVertical: spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    countBadge: {
        backgroundColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: spacing.xs,
    },
    countBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    countText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    countTextActive: {
        color: '#fff',
    },
});

export default CategoryBar;
