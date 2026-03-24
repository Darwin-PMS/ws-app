// Safety Tutorial Screen
// List view of all tutorials with category filter

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyTutorialService from '../services/safetyTutorialService';

const SafetyTutorialScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [tutorials, setTutorials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load tutorials and categories
    const loadData = useCallback(async () => {
        try {
            const [tutorialsResponse, categoriesResponse] = await Promise.all([
                safetyTutorialService.getTutorials(selectedCategory ? { category: selectedCategory } : {}),
                safetyTutorialService.getCategories(),
            ]);

            if (tutorialsResponse.success) {
                setTutorials(tutorialsResponse.data || []);
            }
            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data || []);
            }
        } catch (error) {
            console.error('Error loading tutorials:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Filter tutorials by search query
    const filteredTutorials = tutorials.filter(tutorial => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            tutorial.title?.toLowerCase().includes(query) ||
            tutorial.description?.toLowerCase().includes(query)
        );
    });

    // Get difficulty color
    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return colors.success;
            case 'intermediate':
                return colors.warning;
            case 'advanced':
                return colors.error;
            default:
                return colors.info;
        }
    };

    // Render tutorial item
    const renderTutorialItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.tutorialCard,
                { backgroundColor: colors.card, borderRadius, ...shadows.small }
            ]}
            onPress={() => navigation.navigate('SafetyTutorialDetail', { tutorialId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.tutorialHeader}>
                <Text style={[styles.tutorialTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>
                            {item.category}
                        </Text>
                    </View>
                )}
            </View>

            <Text style={[styles.tutorialDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.tutorialFooter}>
                <View style={styles.tutorialInfo}>
                    {item.duration && (
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                {item.duration}
                            </Text>
                        </View>
                    )}
                    {item.difficulty && (
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                                {item.difficulty}
                            </Text>
                        </View>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    // Render category filter
    const renderCategoryFilter = () => (
        <View style={styles.filterContainer}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: null, name: 'All' }, ...categories]}
                keyExtractor={(item) => item.id?.toString() || 'all'}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            {
                                backgroundColor: selectedCategory === item.id ? colors.primary : colors.surface,
                                borderColor: selectedCategory === item.id ? colors.primary : colors.border,
                            }
                        ]}
                        onPress={() => setSelectedCategory(item.id)}
                    >
                        <Text
                            style={[
                                styles.categoryChipText,
                                { color: selectedCategory === item.id ? colors.white : colors.text }
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading tutorials..." />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    Safety Tutorials
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Learn essential safety skills
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search tutorials..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Category Filter */}
            {renderCategoryFilter()}

            {/* Tutorial List */}
            {filteredTutorials.length > 0 ? (
                <FlatList
                    data={filteredTutorials}
                    renderItem={renderTutorialItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                />
            ) : (
                <EmptyState
                    icon="book-outline"
                    title="No Tutorials Found"
                    message="There are no tutorials available in this category."
                    actionLabel="Clear Filter"
                    onAction={() => {
                        setSelectedCategory(null);
                        setSearchQuery('');
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterContainer: {
        paddingTop: 12,
    },
    categoryList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    tutorialCard: {
        padding: 16,
        marginBottom: 12,
    },
    tutorialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    tutorialTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    tutorialDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    tutorialFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tutorialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 13,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
});

export default SafetyTutorialScreen;
