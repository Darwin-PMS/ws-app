import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Animated,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyTutorialService from '../services/safetyTutorialService';

const CATEGORY_ICONS = {
    'self-defense': 'hand-right',
    'digital-safety': 'shield-outline',
    'travel-safety': 'car-outline',
    'workplace-safety': 'briefcase-outline',
    'emergency-response': 'medkit-outline',
    default: 'book-outline',
};

const CATEGORY_COLORS = {
    'self-defense': { color: '#EF4444', bg: '#FEF2F2' },
    'digital-safety': { color: '#3B82F6', bg: '#EFF6FF' },
    'travel-safety': { color: '#F59E0B', bg: '#FFFBEB' },
    'workplace-safety': { color: '#8B5CF6', bg: '#F5F3FF' },
    'emergency-response': { color: '#10B981', bg: '#ECFDF5' },
    default: { color: '#6366F1', bg: '#EEF2FF' },
};

const DIFFICULTY_CONFIG = {
    beginner: { color: '#10B981', bg: '#ECFDF5', label: 'Beginner', icon: 'happy-outline' },
    intermediate: { color: '#F59E0B', bg: '#FFFBEB', label: 'Intermediate', icon: 'fitness-outline' },
    advanced: { color: '#EF4444', bg: '#FEF2F2', label: 'Advanced', icon: 'flash-outline' },
};

const SafetyTutorialScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const [tutorials, setTutorials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const searchAnim = useState(new Animated.Value(0))[0];

    const loadData = useCallback(async () => {
        try {
            const [tutorialsResponse, categoriesResponse] = await Promise.all([
                safetyTutorialService.getTutorials(selectedCategory ? { category: selectedCategory } : {}),
                safetyTutorialService.getCategories(),
            ]);
            if (tutorialsResponse.success) setTutorials(tutorialsResponse.data || []);
            if (categoriesResponse.success) setCategories(categoriesResponse.data || []);
        } catch (error) {
            console.error('Error loading tutorials:', error);
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

    const filteredTutorials = useMemo(() => {
        if (!searchQuery) return tutorials;
        const query = searchQuery.toLowerCase();
        return tutorials.filter(t =>
            t.title?.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.category?.toLowerCase().includes(query)
        );
    }, [tutorials, searchQuery]);

    const getCategoryConfig = (category) => {
        const key = category?.toLowerCase().replace(/\s+/g, '-') || 'default';
        return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
    };

    const getCategoryIcon = (category) => {
        const key = category?.toLowerCase().replace(/\s+/g, '-') || 'default';
        return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
    };

    const getDifficultyConfig = (difficulty) => {
        return DIFFICULTY_CONFIG[difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.beginner;
    };

    const tutorialStats = useMemo(() => ({
        total: tutorials.length,
        categories: new Set(tutorials.map(t => t.category)).size,
        totalDuration: tutorials.reduce((acc, t) => acc + (t.duration || 0), 0),
    }), [tutorials]);

    const renderCategoryChip = (category, isSelected) => {
        const config = getCategoryConfig(category);
        const icon = getCategoryIcon(category);
        const label = category === null ? 'All' : category;
        
        return (
            <TouchableOpacity
                key={label}
                style={[
                    styles.categoryChip,
                    {
                        backgroundColor: isSelected ? config.color : config.bg,
                        borderColor: isSelected ? config.color : 'transparent',
                    }
                ]}
                onPress={() => setSelectedCategory(category === selectedCategory ? null : category)}
                activeOpacity={0.7}
            >
                <Ionicons name={icon} size={14} color={isSelected ? '#fff' : config.color} />
                <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : config.color }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderListItem = ({ item }) => {
        const config = getCategoryConfig(item.category);
        const difficultyConfig = getDifficultyConfig(item.difficulty);
        const icon = getCategoryIcon(item.category);

        return (
            <TouchableOpacity
                style={[styles.listCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}
                onPress={() => navigation.navigate('SafetyTutorialDetail', { tutorialId: item.id })}
                activeOpacity={0.85}
            >
                <View style={[styles.listCardAccent, { backgroundColor: config.color }]} />
                
                <View style={styles.listCardContent}>
                    <View style={styles.listCardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                            <Ionicons name={icon} size={24} color={config.color} />
                        </View>
                        <View style={styles.listCardBadges}>
                            <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
                                <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                                    {item.category}
                                </Text>
                            </View>
                            <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.bg }]}>
                                <Ionicons name={difficultyConfig.icon} size={10} color={difficultyConfig.color} />
                                <Text style={[styles.difficultyBadgeText, { color: difficultyConfig.color }]}>
                                    {difficultyConfig.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.tutorialTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>

                    {item.description && (
                        <Text style={[styles.tutorialDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    <View style={styles.listCardFooter}>
                        {item.duration && (
                            <View style={styles.durationContainer}>
                                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                                <Text style={[styles.durationText, { color: colors.textTertiary }]}>
                                    {item.duration} min
                                </Text>
                            </View>
                        )}
                        <View style={[styles.startBtn, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={[styles.startBtnText, { color: colors.primary }]}>Start</Text>
                            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }) => {
        const config = getCategoryConfig(item.category);
        const difficultyConfig = getDifficultyConfig(item.difficulty);
        const icon = getCategoryIcon(item.category);

        return (
            <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}
                onPress={() => navigation.navigate('SafetyTutorialDetail', { tutorialId: item.id })}
                activeOpacity={0.85}
            >
                <View style={[styles.gridHeader, { backgroundColor: config.bg }]}>
                    <Ionicons name={icon} size={32} color={config.color} />
                    <View style={[styles.gridDifficultyBadge, { backgroundColor: difficultyConfig.bg }]}>
                        <Ionicons name={difficultyConfig.icon} size={10} color={difficultyConfig.color} />
                    </View>
                </View>

                <View style={styles.gridContent}>
                    <View style={[styles.gridCategoryBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.gridCategoryText, { color: config.color }]}>
                            {item.category}
                        </Text>
                    </View>

                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>

                    {item.description && (
                        <Text style={[styles.gridDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    <View style={styles.gridFooter}>
                        {item.duration && (
                            <View style={styles.gridDuration}>
                                <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                                <Text style={[styles.gridDurationText, { color: colors.textTertiary }]}>
                                    {item.duration} min
                                </Text>
                            </View>
                        )}
                        <View style={[styles.gridStartBtn, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="play" size={12} color={colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="book-outline" size={20} color={colors.primary} />
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{tutorialStats.total}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tutorials</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.secondary + '15' }]}>
                    <Ionicons name="grid-outline" size={20} color={colors.secondary} />
                    <Text style={[styles.statNumber, { color: colors.secondary }]}>{tutorialStats.categories}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Categories</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="time-outline" size={20} color={colors.success} />
                    <Text style={[styles.statNumber, { color: colors.success }]}>
                        {tutorialStats.totalDuration > 0 ? Math.round(tutorialStats.totalDuration / 60) + 'h' : '0h'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Content</Text>
                </View>
            </View>

            <View style={[styles.infoBanner, { backgroundColor: colors.info + '10' }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.info} />
                <Text style={[styles.infoBannerText, { color: colors.text }]}>
                    Learn essential safety skills to protect yourself
                </Text>
            </View>
        </View>
    );

    if (loading) return <LoadingSpinner fullScreen message="Loading tutorials..." />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerTitleText}>Safety Tutorials</Text>
                        <Text style={styles.headerSubtitleText}>{tutorials.length} tutorials</Text>
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
                            placeholder="Search tutorials..."
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
                <View style={styles.categoryScrollContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {renderCategoryChip(null, selectedCategory === null)}
                        {categories.map(cat => renderCategoryChip(cat, selectedCategory === cat))}
                    </ScrollView>
                </View>

                {filteredTutorials.length > 0 ? (
                    viewMode === 'list' ? (
                        <FlatList
                            data={filteredTutorials}
                            renderItem={renderListItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListHeaderComponent={renderHeader}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                            }
                        />
                    ) : (
                        <FlatList
                            data={filteredTutorials}
                            renderItem={renderGridItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.gridRow}
                            contentContainerStyle={styles.gridContainer}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                            }
                        />
                    )
                ) : (
                    <EmptyState
                        icon="book-outline"
                        title="No Tutorials Found"
                        message={searchQuery ? `No tutorials match "${searchQuery}"` : "There are no tutorials available in this category."}
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
    categoryScrollContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    categoryScroll: { paddingHorizontal: 16, gap: 8 },
    categoryChip: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, gap: 6,
    },
    categoryChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    headerContent: { marginBottom: 16, paddingTop: 8 },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14 },
    statNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 6 },
    statLabel: { fontSize: 11, marginTop: 2 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 10 },
    infoBannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
    listContainer: { padding: 16, paddingBottom: 100 },
    listCard: { flexDirection: 'row', marginBottom: 12, overflow: 'hidden' },
    listCardAccent: { width: 4 },
    listCardContent: { flex: 1, padding: 14 },
    listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    listCardBadges: { flexDirection: 'row', gap: 6 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    categoryBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    difficultyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    difficultyBadgeText: { fontSize: 10, fontWeight: '600' },
    tutorialTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
    tutorialDescription: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    listCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    durationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 12 },
    startBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    startBtnText: { fontSize: 12, fontWeight: '600' },
    gridContainer: { padding: 12, paddingBottom: 100 },
    gridRow: { gap: 12 },
    gridCard: { flex: 1, maxWidth: '48%', marginBottom: 12 },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    gridDifficultyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    gridContent: { padding: 12 },
    gridCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
    gridCategoryText: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
    gridTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 6 },
    gridDescription: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
    gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gridDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    gridDurationText: { fontSize: 11 },
    gridStartBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});

export default SafetyTutorialScreen;
