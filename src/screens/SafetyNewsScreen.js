import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Image,
    Animated,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyNewsService from '../services/safetyNewsService';

const SafetyNewsScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows, isDark } = useTheme();
    const [news, setNews] = useState([]);
    const [featuredNews, setFeaturedNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const searchAnim = useState(new Animated.Value(0))[0];

    const categoryColors = useMemo(() => ({
        'safety-tips': { 
            color: colors.success, 
            bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
        },
        'legal-rights': { 
            color: colors.info, 
            bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
        },
        'emergency': { 
            color: colors.error, 
            bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
        },
        'awareness': { 
            color: colors.primary, 
            bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
        },
        default: { 
            color: colors.primary, 
            bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EEF2FF',
        },
    }), [colors, isDark]);

    const getCategoryConfig = (category) => {
        const key = category?.toLowerCase().replace(/\s+/g, '-') || 'default';
        return categoryColors[key] || categoryColors.default;
    };

    const loadData = useCallback(async () => {
        try {
            const [newsResponse, categoriesResponse, featuredResponse] = await Promise.all([
                safetyNewsService.getNews(selectedCategory ? { category: selectedCategory } : {}),
                safetyNewsService.getCategories(),
                safetyNewsService.getFeaturedNews(),
            ]);
            if (newsResponse.success) setNews(newsResponse.data || []);
            if (categoriesResponse.success) setCategories(categoriesResponse.data || []);
            if (featuredResponse.success) setFeaturedNews(featuredResponse.data || []);
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRefresh = () => { setRefreshing(true); loadData(); };

    const toggleSearch = () => {
        Animated.timing(searchAnim, {
            toValue: showSearch ? 0 : 1,
            duration: 250,
            useNativeDriver: false,
        }).start();
        setShowSearch(!showSearch);
        if (showSearch) setSearchQuery('');
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'list' ? 'grid' : 'list');
    };

    const filteredNews = useMemo(() => {
        if (!searchQuery) return news;
        const query = searchQuery.toLowerCase();
        return news.filter(n =>
            n.title?.toLowerCase().includes(query) ||
            n.summary?.toLowerCase().includes(query) ||
            n.category?.toLowerCase().includes(query)
        );
    }, [news, searchQuery]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60));
        if (diff < 1) return 'Just now';
        if (diff < 24) return `${diff}h ago`;
        const days = Math.floor(diff / 24);
        return `${days}d ago`;
    };

    const renderCategoryChip = (category, isSelected) => {
        const config = getCategoryConfig(category);
        const label = category === null ? 'All' : category;
        
        return (
            <TouchableOpacity
                key={label}
                style={[
                    styles.categoryChip,
                    {
                        backgroundColor: isSelected ? config.color : config.bg,
                        borderColor: isSelected ? config.color : colors.border,
                    }
                ]}
                onPress={() => setSelectedCategory(category === selectedCategory ? null : category)}
                activeOpacity={0.7}
            >
                <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : config.color }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderListItem = ({ item }) => {
        const config = getCategoryConfig(item.category);
        const isFeatured = item.isFeatured;

        return (
            <TouchableOpacity
                style={[styles.listCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}
                onPress={() => navigation.navigate('SafetyNewsDetail', { newsId: item.id })}
                activeOpacity={0.85}
            >
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={[styles.listImage, { borderTopLeftRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.xl }]} />
                ) : (
                    <View style={[styles.listImagePlaceholder, { backgroundColor: config.bg, borderTopLeftRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.xl }]}>
                        <Ionicons name="newspaper-outline" size={28} color={config.color} />
                    </View>
                )}
                
                <View style={styles.listContent}>
                    <View style={styles.listHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                                {item.category}
                            </Text>
                        </View>
                        {isFeatured && (
                            <View style={[styles.featuredBadge, { backgroundColor: colors.warning }]}>
                                <Ionicons name="star" size={10} color="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>

                    {item.summary && (
                        <Text style={[styles.newsSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.summary}
                        </Text>
                    )}

                    <View style={styles.listFooter}>
                        <View style={styles.newsMeta}>
                            {item.author && (
                                <Text style={[styles.authorText, { color: colors.textMuted }]} numberOfLines={1}>
                                    {item.author}
                                </Text>
                            )}
                            <Text style={[styles.dateText, { color: colors.textMuted }]}>
                                {formatDate(item.publishedAt)}
                            </Text>
                        </View>
                        {item.viewsCount > 0 && (
                            <View style={styles.viewsContainer}>
                                <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                                <Text style={[styles.viewsText, { color: colors.textMuted }]}>{item.viewsCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }) => {
        const config = getCategoryConfig(item.category);

        return (
            <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}
                onPress={() => navigation.navigate('SafetyNewsDetail', { newsId: item.id })}
                activeOpacity={0.85}
            >
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={[styles.gridImage, { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]} />
                ) : (
                    <View style={[styles.gridImagePlaceholder, { backgroundColor: config.bg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}>
                        <Ionicons name="newspaper-outline" size={32} color={config.color} />
                    </View>
                )}

                <View style={styles.gridContent}>
                    <View style={[styles.gridCategoryBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.gridCategoryText, { color: config.color }]}>
                            {item.category}
                        </Text>
                    </View>

                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>

                    {item.summary && (
                        <Text style={[styles.gridSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.summary}
                        </Text>
                    )}

                    <View style={styles.gridFooter}>
                        <Text style={[styles.gridDate, { color: colors.textMuted }]}>
                            {getTimeAgo(item.publishedAt)}
                        </Text>
                        {item.viewsCount > 0 && (
                            <View style={styles.gridViews}>
                                <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                                <Text style={[styles.viewsText, { color: colors.textMuted }]}>{item.viewsCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFeaturedSection = () => {
        if (featuredNews.length === 0 || selectedCategory || searchQuery) return null;

        return (
            <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="star" size={18} color={colors.warning} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
                    </View>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredScroll}
                >
                    {featuredNews.slice(0, 5).map((item, index) => {
                        const config = getCategoryConfig(item.category);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.featuredCard, { backgroundColor: colors.card, ...shadows.md }]}
                                onPress={() => navigation.navigate('SafetyNewsDetail', { newsId: item.id })}
                                activeOpacity={0.85}
                            >
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
                                ) : (
                                    <View style={[styles.featuredImagePlaceholder, { backgroundColor: config.bg }]}>
                                        <Ionicons name="newspaper-outline" size={40} color={config.color} />
                                    </View>
                                )}
                                <View style={styles.featuredOverlay}>
                                    <View style={[styles.featuredCategory, { backgroundColor: config.color }]}>
                                        <Text style={styles.featuredCategoryText}>{item.category}</Text>
                                    </View>
                                </View>
                                <View style={styles.featuredContent}>
                                    <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#333' }]} numberOfLines={2}>{item.title}</Text>
                                    <Text style={[styles.featuredMeta, { color: isDark ? '#A1A1AA' : '#666' }]}>
                                        {item.author && `By ${item.author} • `}{getTimeAgo(item.publishedAt)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    if (loading) return <LoadingSpinner fullScreen message="Loading news..." />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerTitleText}>Safety News</Text>
                        <Text style={styles.headerSubtitleText}>{news.length} articles</Text>
                    </View>
                    <TouchableOpacity onPress={toggleViewMode} style={styles.headerBtn}>
                        <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleSearch} style={styles.headerBtn}>
                        <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Animated.View style={[
                    styles.searchContainer,
                    {
                        height: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] }),
                        opacity: searchAnim,
                    }
                ]}>
                    <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="search" size={20} color="#fff" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search news..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#fff" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </Animated.View>
            </View>

            <View style={styles.content}>
                <View style={[styles.categoryScrollContainer, { borderBottomColor: colors.borderLight }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {renderCategoryChip(null, selectedCategory === null)}
                        {categories.map(cat => renderCategoryChip(cat, selectedCategory === cat))}
                    </ScrollView>
                </View>

                {filteredNews.length > 0 ? (
                    viewMode === 'list' ? (
                        <FlatList
                            data={filteredNews}
                            renderItem={renderListItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListHeaderComponent={renderFeaturedSection}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.secondary]} tintColor={colors.secondary} />
                            }
                        />
                    ) : (
                        <FlatList
                            data={filteredNews}
                            renderItem={renderGridItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.gridRow}
                            contentContainerStyle={styles.gridContainer}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.secondary]} tintColor={colors.secondary} />
                            }
                        />
                    )
                ) : (
                    <EmptyState
                        icon="newspaper-outline"
                        title="No News Found"
                        message={searchQuery ? `No articles match "${searchQuery}"` : "There are no news articles available."}
                        actionLabel="Clear Filters"
                        onAction={() => { setSelectedCategory(null); setSearchQuery(''); }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, marginLeft: 4 },
    headerTitleText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    headerSubtitleText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    searchContainer: { overflow: 'hidden', marginTop: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#fff' },
    content: { flex: 1 },
    categoryScrollContainer: { paddingVertical: 12, borderBottomWidth: 1 },
    categoryScroll: { paddingHorizontal: 16, gap: 8 },
    categoryChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6,
    },
    categoryChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    featuredSection: { paddingVertical: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    featuredScroll: { paddingHorizontal: 16, gap: 12 },
    featuredCard: { width: 260, borderRadius: 16, overflow: 'hidden' },
    featuredImage: { width: '100%', height: 140 },
    featuredImagePlaceholder: { width: '100%', height: 140, justifyContent: 'center', alignItems: 'center' },
    featuredOverlay: { position: 'absolute', top: 8, left: 8 },
    featuredCategory: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    featuredCategoryText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    featuredContent: { padding: 12 },
    featuredTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 4 },
    featuredMeta: { fontSize: 11 },
    listContainer: { padding: 16, paddingBottom: 100 },
    listCard: { flexDirection: 'row', marginBottom: 12, overflow: 'hidden' },
    listImage: { width: 100, height: 120 },
    listImagePlaceholder: { width: 100, height: 120, justifyContent: 'center', alignItems: 'center' },
    listContent: { flex: 1, padding: 14 },
    listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    categoryBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    featuredBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    newsTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 4 },
    newsSummary: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
    listFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
    newsMeta: { flex: 1 },
    authorText: { fontSize: 10, marginBottom: 2 },
    dateText: { fontSize: 10 },
    viewsContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewsText: { fontSize: 10 },
    gridContainer: { padding: 12, paddingBottom: 100 },
    gridRow: { gap: 12 },
    gridCard: { flex: 1, maxWidth: '48%', marginBottom: 12 },
    gridImage: { width: '100%', height: 100 },
    gridImagePlaceholder: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
    gridContent: { padding: 12 },
    gridCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
    gridCategoryText: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
    gridTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 4 },
    gridSummary: { fontSize: 11, lineHeight: 15, marginBottom: 8 },
    gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gridDate: { fontSize: 10 },
    gridViews: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export default SafetyNewsScreen;
