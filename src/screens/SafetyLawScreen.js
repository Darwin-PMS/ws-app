// Safety Law Screen
// List view of laws with category/jurisdiction filter

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
import safetyLawService from '../services/safetyLawService';

const SafetyLawScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [laws, setLaws] = useState([]);
    const [categories, setCategories] = useState([]);
    const [jurisdictions, setJurisdictions] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedJurisdiction, setSelectedJurisdiction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load laws, categories, and jurisdictions
    const loadData = useCallback(async () => {
        try {
            const params = {};
            if (selectedCategory) params.category = selectedCategory;
            if (selectedJurisdiction) params.jurisdiction = selectedJurisdiction;

            const [lawsResponse, categoriesResponse, jurisdictionsResponse] = await Promise.all([
                safetyLawService.getLaws(params),
                safetyLawService.getCategories(),
                safetyLawService.getJurisdictions(),
            ]);

            if (lawsResponse.success) {
                setLaws(lawsResponse.data || []);
            }
            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data || []);
            }
            if (jurisdictionsResponse.success) {
                setJurisdictions(jurisdictionsResponse.data || []);
            }
        } catch (error) {
            console.error('Error loading laws:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, selectedJurisdiction]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Filter laws by search query
    const filteredLaws = laws.filter(law => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            law.title?.toLowerCase().includes(query) ||
            law.description?.toLowerCase().includes(query)
        );
    });

    // Get penalty color
    const getPenaltyColor = (penalty) => {
        if (!penalty) return colors.textSecondary;
        const penaltyLower = penalty.toLowerCase();
        if (penaltyLower.includes('death') || penaltyLower.includes('life')) {
            return colors.error;
        } else if (penaltyLower.includes('imprisonment') || penaltyLower.includes('jail')) {
            return colors.warning;
        } else if (penaltyLower.includes('fine')) {
            return colors.info;
        }
        return colors.textSecondary;
    };

    // Render law item
    const renderLawItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.lawCard,
                { backgroundColor: colors.card, borderRadius, ...shadows.small }
            ]}
            onPress={() => navigation.navigate('SafetyLawDetail', { lawId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.lawHeader}>
                <View style={styles.lawTitleContainer}>
                    <Text style={[styles.lawTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>

            {item.description && (
                <Text style={[styles.lawDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View style={styles.lawFooter}>
                <View style={styles.lawTags}>
                    {item.category && (
                        <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>
                                {item.category}
                            </Text>
                        </View>
                    )}
                    {item.jurisdiction && (
                        <View style={[styles.tag, { backgroundColor: colors.secondary + '20' }]}>
                            <Text style={[styles.tagText, { color: colors.secondary }]}>
                                {item.jurisdiction}
                            </Text>
                        </View>
                    )}
                </View>

                {item.penalty && (
                    <View style={[styles.penaltyContainer, { backgroundColor: getPenaltyColor(item.penalty) + '15' }]}>
                        <Ionicons name="warning" size={14} color={getPenaltyColor(item.penalty)} />
                        <Text style={[styles.penaltyText, { color: getPenaltyColor(item.penalty) }]} numberOfLines={1}>
                            {item.penalty}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Render category filter
    const renderCategoryFilter = () => (
        <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                Category
            </Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: null, name: 'All' }, ...categories]}
                keyExtractor={(item) => item.id?.toString() || 'all'}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: selectedCategory === item.id ? colors.primary : colors.surface,
                                borderColor: selectedCategory === item.id ? colors.primary : colors.border,
                            }
                        ]}
                        onPress={() => setSelectedCategory(item.id)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
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

    // Render jurisdiction filter
    const renderJurisdictionFilter = () => (
        <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                Jurisdiction
            </Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: null, name: 'All' }, ...jurisdictions]}
                keyExtractor={(item) => item.id?.toString() || 'all'}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: selectedJurisdiction === item.id ? colors.secondary : colors.surface,
                                borderColor: selectedJurisdiction === item.id ? colors.secondary : colors.border,
                            }
                        ]}
                        onPress={() => setSelectedJurisdiction(item.id)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                { color: selectedJurisdiction === item.id ? colors.white : colors.text }
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
        return <LoadingSpinner fullScreen message="Loading laws..." />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.info }]}>
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    Safety Laws
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Know your legal rights
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search laws..."
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

            {/* Filters */}
            {categories.length > 0 && renderCategoryFilter()}
            {jurisdictions.length > 0 && renderJurisdictionFilter()}

            {/* Law List */}
            {filteredLaws.length > 0 ? (
                <FlatList
                    data={filteredLaws}
                    renderItem={renderLawItem}
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
                    icon="document-text-outline"
                    title="No Laws Found"
                    message="There are no laws available matching your filters."
                    actionLabel="Clear Filters"
                    onAction={() => {
                        setSelectedCategory(null);
                        setSelectedJurisdiction(null);
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
    filterSection: {
        paddingTop: 12,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 16,
        marginBottom: 8,
    },
    categoryList: {
        paddingHorizontal: 16,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    lawCard: {
        padding: 16,
        marginBottom: 12,
    },
    lawHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    lawTitleContainer: {
        flex: 1,
        marginRight: 8,
    },
    lawTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    lawDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    lawFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    lawTags: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    penaltyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        maxWidth: '50%',
    },
    penaltyText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
});

export default SafetyLawScreen;
