// Safety News Screen
// List view of news with category filter and featured news section

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyNewsService from '../services/safetyNewsService';

const { width } = Dimensions.get('window');

const SafetyNewsScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [news, setNews] = useState([]);
    const [featuredNews, setFeaturedNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load news and categories
    const loadData = useCallback(async () => {
        try {
            const [newsResponse, categoriesResponse, featuredResponse] = await Promise.all([
                safetyNewsService.getNews(selectedCategory ? { category: selectedCategory } : {}),
                safetyNewsService.getCategories(),
                safetyNewsService.getFeaturedNews(),
            ]);

            if (newsResponse.success) {
                setNews(newsResponse.data || []);
            }
            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data || []);
            }
            if (featuredResponse.success) {
                setFeaturedNews(featuredResponse.data || []);
            }
        } catch (error) {
            console.error('Error loading news:', error);
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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Filter news by search query
    const filteredNews = news.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title?.toLowerCase().includes(query) ||
            item.summary?.toLowerCase().includes(query)
        );
    });

    // Render featured news item
    const renderFeaturedNews = ({ item }) => (
        <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('SafetyNewsDetail', { newsId: item.id })}
            activeOpacity={0.8}
        >
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.featuredImagePlaceholder, { backgroundColor: colors.primary + '30' }]}>
                    <Ionicons name="newspaper" size={48} color={colors.primary} />
                </View>
            )}
            <View style={[styles.featuredOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                {item.category && (
                    <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.featuredBadgeText}>{item.category}</Text>
                    </View>
                )}
                <Text style={styles.featuredTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.featuredMeta}>
                    {item.author && (
                        <Text style={styles.featuredAuthor} numberOfLines={1}>
                            By {item.author}
                        </Text>
                    )}
                    {item.published_date && (
                        <Text style={styles.featuredDate}>
                            {formatDate(item.published_date)}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render news item
    const renderNewsItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.newsCard,
                { backgroundColor: colors.card, borderRadius, ...shadows.small }
            ]}
            onPress={() => navigation.navigate('SafetyNewsDetail', { newsId: item.id })}
            activeOpacity={0.7}
        >
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.newsImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.newsImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="newspaper" size={32} color={colors.primary} />
                </View>
            )}

            <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                    {item.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.categoryText, { color: colors.primary }]}>
                                {item.category}
                            </Text>
                        </View>
                    )}
                    {item.featured && (
                        <Ionicons name="star" size={16} color={colors.warning} />
                    )}
                </View>

                <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                </Text>

                <Text style={[styles.newsSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.summary}
                </Text>

                <View style={styles.newsFooter}>
                    <View style={styles.newsMeta}>
                        {item.author && (
                            <Text style={[styles.newsAuthor, { color: colors.textMuted }]} numberOfLines={1}>
                                {item.author}
                            </Text>
                        )}
                        {item.published_date && (
                            <Text style={[styles.newsDate, { color: colors.textMuted }]}>
                                {formatDate(item.published_date)}
                            </Text>
                        )}
                    </View>
                </View>
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
        return <LoadingSpinner fullScreen message="Loading news..." />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    Safety News
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Stay informed and safe
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderRadius }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search news..."
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

            {/* News List */}
            {filteredNews.length > 0 || featuredNews.length > 0 ? (
                <FlatList
                    data={filteredNews}
                    renderItem={renderNewsItem}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        featuredNews.length > 0 && !selectedCategory && !searchQuery ? (
                            <View style={styles.featuredSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Featured
                                </Text>
                                <FlatList
                                    horizontal
                                    data={featuredNews}
                                    renderItem={renderFeaturedNews}
                                    keyExtractor={(item) => `featured-${item.id}`}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.featuredList}
                                />
                            </View>
                        ) : null
                    }
                    ListHeaderComponentStyle={{ marginBottom: 8 }}
                    contentContainerStyle={styles.listContent}
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
                    icon="newspaper-outline"
                    title="No News Found"
                    message="There are no news articles available in this category."
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
    featuredSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    featuredList: {
        paddingRight: 16,
    },
    featuredCard: {
        width: width * 0.75,
        height: 200,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    featuredBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    featuredBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    featuredMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    featuredAuthor: {
        color: '#fff',
        fontSize: 12,
        flex: 1,
    },
    featuredDate: {
        color: '#fff',
        fontSize: 12,
    },
    newsCard: {
        flexDirection: 'row',
        marginBottom: 12,
        overflow: 'hidden',
    },
    newsImage: {
        width: 120,
        height: 120,
    },
    newsImagePlaceholder: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newsContent: {
        flex: 1,
        padding: 12,
    },
    newsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '500',
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    newsSummary: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    newsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    newsMeta: {
        flex: 1,
    },
    newsAuthor: {
        fontSize: 12,
        marginBottom: 2,
    },
    newsDate: {
        fontSize: 11,
    },
});

export default SafetyNewsScreen;
