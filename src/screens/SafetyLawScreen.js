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
import safetyLawService from '../services/safetyLawService';

const CATEGORY_ICONS = {
    criminal: 'shield-outline',
    workplace: 'briefcase-outline',
    road: 'car-outline',
    domestic: 'home-outline',
    digital: 'phone-portrait-outline',
    harassment: 'alert-circle-outline',
    default: 'document-text-outline',
};

const CATEGORY_COLORS = {
    criminal: { color: '#EF4444', bg: '#FEF2F2' },
    workplace: { color: '#3B82F6', bg: '#EFF6FF' },
    road: { color: '#F59E0B', bg: '#FFFBEB' },
    domestic: { color: '#8B5CF6', bg: '#F5F3FF' },
    digital: { color: '#10B981', bg: '#ECFDF5' },
    harassment: { color: '#EC4899', bg: '#FDF2F8' },
    default: { color: '#6366F1', bg: '#EEF2FF' },
};

const SafetyLawScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const [laws, setLaws] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [expandedLaw, setExpandedLaw] = useState(null);
    const searchAnim = useState(new Animated.Value(0))[0];

    const loadData = useCallback(async () => {
        try {
            const params = {};
            if (selectedCategory) params.category = selectedCategory;

            const [lawsResponse, categoriesResponse] = await Promise.all([
                safetyLawService.getLaws(params),
                safetyLawService.getCategories(),
            ]);

            if (lawsResponse.success) setLaws(lawsResponse.data || []);
            if (categoriesResponse.success) setCategories(categoriesResponse.data || []);
        } catch (error) {
            console.error('Error loading laws:', error);
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

    const filteredLaws = useMemo(() => {
        if (!searchQuery) return laws;
        const query = searchQuery.toLowerCase();
        return laws.filter(l =>
            l.title?.toLowerCase().includes(query) ||
            l.description?.toLowerCase().includes(query) ||
            l.category?.toLowerCase().includes(query)
        );
    }, [laws, searchQuery]);

    const groupedLaws = useMemo(() => {
        if (viewMode === 'grid') return { all: filteredLaws };
        const groups = {};
        filteredLaws.forEach(law => {
            const cat = law.category || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(law);
        });
        return groups;
    }, [filteredLaws, viewMode]);

    const getCategoryConfig = (category) => {
        const key = category?.toLowerCase().replace(/\s+/g, '') || 'default';
        return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
    };

    const getCategoryIcon = (category) => {
        const key = category?.toLowerCase().replace(/\s+/g, '') || 'default';
        return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
    };

    const getPenaltyConfig = (penalty) => {
        if (!penalty) return { color: colors.textSecondary, bg: colors.surface, icon: 'help-circle-outline', label: 'N/A' };
        const lower = penalty.toLowerCase();
        if (lower.includes('death') || lower.includes('life')) {
            return { color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle-outline', label: 'Severe' };
        } else if (lower.includes('imprisonment') || lower.includes('jail')) {
            return { color: '#EA580C', bg: '#FFEDD5', icon: 'lock-closed-outline', label: 'Prison' };
        } else if (lower.includes('fine')) {
            return { color: '#CA8A04', bg: '#FEF9C3', icon: 'cash-outline', label: 'Fine' };
        }
        return { color: colors.textSecondary, bg: colors.surface, icon: 'document-outline', label: 'Other' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

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
                <Ionicons
                    name={getCategoryIcon(category)}
                    size={14}
                    color={isSelected ? '#fff' : config.color}
                />
                <Text style={[
                    styles.categoryChipText,
                    { color: isSelected ? '#fff' : config.color }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderListItem = ({ item }) => {
        const config = getCategoryConfig(item.category);
        const penaltyConfig = getPenaltyConfig(item.penalty);
        const isExpanded = expandedLaw === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.listCard,
                    { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }
                ]}
                onPress={() => setExpandedLaw(isExpanded ? null : item.id)}
                onLongPress={() => navigation.navigate('SafetyLawDetail', { lawId: item.id })}
                activeOpacity={0.85}
            >
                <View style={styles.listCardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
                        <Ionicons name={getCategoryIcon(item.category)} size={16} color={config.color} />
                        <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                            {item.category}
                        </Text>
                    </View>
                    <View style={[styles.penaltyBadge, { backgroundColor: penaltyConfig.bg }]}>
                        <Ionicons name={penaltyConfig.icon} size={12} color={penaltyConfig.color} />
                        <Text style={[styles.penaltyBadgeText, { color: penaltyConfig.color }]}>
                            {penaltyConfig.label}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.lawTitle, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 2}>
                    {item.title}
                </Text>

                {isExpanded && item.description && (
                    <Text style={[styles.lawDescription, { color: colors.textSecondary }]}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.listCardFooter}>
                    {item.effectiveDate && (
                        <View style={styles.dateInfo}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                                {formatDate(item.effectiveDate)}
                            </Text>
                        </View>
                    )}
                    {item.jurisdiction && (
                        <View style={styles.jurisdictionInfo}>
                            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                                {item.jurisdiction}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.readMoreBtn}
                        onPress={() => navigation.navigate('SafetyLawDetail', { lawId: item.id })}
                    >
                        <Text style={[styles.readMoreText, { color: colors.primary }]}>
                            {isExpanded ? 'Show Less' : 'Read More'}
                        </Text>
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-forward'}
                            size={16}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }) => {
        const config = getCategoryConfig(item.category);
        const penaltyConfig = getPenaltyConfig(item.penalty);

        return (
            <TouchableOpacity
                style={[
                    styles.gridCard,
                    { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }
                ]}
                onPress={() => navigation.navigate('SafetyLawDetail', { lawId: item.id })}
                activeOpacity={0.85}
            >
                <View style={[styles.gridCardHeader, { backgroundColor: config.bg }]}>
                    <Ionicons name={getCategoryIcon(item.category)} size={24} color={config.color} />
                    <View style={[styles.gridPenaltyBadge, { backgroundColor: penaltyConfig.bg }]}>
                        <Text style={[styles.gridPenaltyText, { color: penaltyConfig.color }]}>
                            {penaltyConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.gridCardContent}>
                    <Text style={[styles.gridCategoryText, { color: config.color }]}>
                        {item.category}
                    </Text>
                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text style={[styles.gridDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                            {item.description}
                        </Text>
                    )}
                </View>

                <View style={styles.gridCardFooter}>
                    <Text style={[styles.gridReadMore, { color: colors.primary }]}>
                        Read More
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = (title) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionTitleContainer, { backgroundColor: getCategoryConfig(title).bg }]}>
                <Text style={[styles.sectionTitle, { color: getCategoryConfig(title).color }]}>
                    {title}
                </Text>
            </View>
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                {groupedLaws[title]?.length || 0} laws
            </Text>
        </View>
    );

    const renderListView = () => {
        const sections = Object.keys(groupedLaws);

        if (sections.length === 0) {
            return (
                <EmptyState
                    icon="scale-outline"
                    title="No Laws Found"
                    message={searchQuery ? `No laws match "${searchQuery}"` : "There are no laws available."}
                    actionLabel="Clear Filters"
                    onAction={() => {
                        setSelectedCategory(null);
                        setSearchQuery('');
                    }}
                />
            );
        }

        let flatData = [];
        sections.forEach(section => {
            if (selectedCategory === null) {
                flatData.push({ type: 'header', title: section });
            }
            flatData.push({ type: 'data', data: groupedLaws[section] });
        });

        return (
            <FlatList
                data={flatData}
                renderItem={({ item, index }) => {
                    if (item.type === 'header') {
                        return renderSectionHeader(item.title);
                    }
                    return (
                        <View style={styles.listSection}>
                            {item.data.map((law, i) => (
                                <View key={law.id}>
                                    {renderListItem({ item: law, index: i })}
                                </View>
                            ))}
                        </View>
                    );
                }}
                keyExtractor={(item, index) => item.type === 'header' ? `header-${item.title}` : `data-${index}`}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
            />
        );
    };

    const renderGridView = () => (
        <FlatList
            data={filteredLaws}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
            ListEmptyComponent={
                <EmptyState
                    icon="scale-outline"
                    title="No Laws Found"
                    message={searchQuery ? `No laws match "${searchQuery}"` : "There are no laws available."}
                    actionLabel="Clear Filters"
                    onAction={() => {
                        setSelectedCategory(null);
                        setSearchQuery('');
                    }}
                />
            }
        />
    );

    if (loading) return <LoadingSpinner fullScreen message="Loading laws..." />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerTitleText}>Safety Laws</Text>
                        <Text style={styles.headerSubtitleText}>{laws.length} laws available</Text>
                    </View>
                    <TouchableOpacity onPress={toggleViewMode} style={styles.headerBtn}>
                        <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleSearch} style={styles.headerBtn}>
                        <Ionicons name={showSearch ? 'close' : 'search'} size={24} color="#fff" />
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
                            placeholder="Search laws..."
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

                {viewMode === 'list' ? renderListView() : renderGridView()}
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
    categoryChipText: { fontSize: 13, fontWeight: '600' },
    listContainer: { padding: 16, paddingBottom: 100 },
    listSection: { gap: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 12 },
    sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
    sectionCount: { fontSize: 12 },
    listCard: { padding: 16, gap: 10 },
    listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
    categoryBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    penaltyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    penaltyBadgeText: { fontSize: 10, fontWeight: '600' },
    lawTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
    lawDescription: { fontSize: 14, lineHeight: 20, marginTop: 4 },
    listCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    jurisdictionInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 11 },
    readMoreBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    readMoreText: { fontSize: 13, fontWeight: '600' },
    gridContainer: { padding: 12, paddingBottom: 100 },
    gridRow: { gap: 12 },
    gridCard: { flex: 1, maxWidth: '48%', marginBottom: 12 },
    gridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    gridPenaltyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    gridPenaltyText: { fontSize: 9, fontWeight: '600' },
    gridCardContent: { padding: 12, flex: 1 },
    gridCategoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    gridTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 6 },
    gridDescription: { fontSize: 11, lineHeight: 16 },
    gridCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 12, gap: 4 },
    gridReadMore: { fontSize: 12, fontWeight: '600' },
});

export default SafetyLawScreen;
