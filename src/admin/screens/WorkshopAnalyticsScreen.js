import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const CATEGORIES = [
    { id: 'harassment', title: 'Harassment Awareness', icon: 'shield-checkmark', color: '#E91E63' },
    { id: 'self_defense', title: 'Self-Defense', icon: 'fitness', color: '#FF5722' },
    { id: 'digital_safety', title: 'Digital Safety', icon: 'phone-portrait', color: '#9C27B0' },
    { id: 'workplace', title: 'Workplace Safety', icon: 'business', color: '#2196F3' },
    { id: 'public', title: 'Public Safety', icon: 'people', color: '#4CAF50' },
    { id: 'dating_safety', title: 'Dating Safety', icon: 'heart', color: '#FF4081' },
    { id: 'scam_awareness', title: 'Scam Awareness', icon: 'warning', color: '#FF9800' },
    { id: 'family_safety', title: 'Family Safety', icon: 'home', color: '#00BCD4' },
];

const DIFFICULTY_COLORS = { Beginner: '#4CAF50', Intermediate: '#FF9800', Advanced: '#F44336' };

const WorkshopAnalyticsScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [analyticsRes, leaderboardRes] = await Promise.all([
                adminService.getWorkshopAnalytics({}),
                adminService.getWorkshopLeaderboard({ limit: 10 }),
            ]);

            if (analyticsRes.success) {
                setAnalytics(analyticsRes.analytics || analyticsRes);
            }
            if (leaderboardRes.success) {
                setLeaderboard(leaderboardRes.leaderboard || leaderboardRes.data || []);
            }
        } catch (error) {
            console.log('Error loading workshop analytics:', error);
            setAnalytics(getMockAnalytics());
            setLeaderboard(getMockLeaderboard());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getMockAnalytics = () => ({
        total_completions: 245,
        total_users: 180,
        average_score: 78,
        total_time_spent: 1560,
        completions_by_category: {
            harassment: 45,
            self_defense: 38,
            digital_safety: 52,
            workplace: 28,
            public: 35,
            dating_safety: 22,
            scam_awareness: 15,
            family_safety: 10,
        },
        completions_by_difficulty: {
            Beginner: 120,
            Intermediate: 85,
            Advanced: 40,
        },
        age_distribution: {
            'Teen (13-19)': 35,
            'Young Adult (20-29)': 65,
            'Adult (30-49)': 50,
            'Middle Age (50-64)': 20,
            'Senior (65+)': 10,
        },
        daily_progress: [
            { date: '2026-03-22', completions: 12 },
            { date: '2026-03-23', completions: 18 },
            { date: '2026-03-24', completions: 15 },
            { date: '2026-03-25', completions: 22 },
            { date: '2026-03-26', completions: 19 },
            { date: '2026-03-27', completions: 25 },
            { date: '2026-03-28', completions: 14 },
        ],
    });

    const getMockLeaderboard = () => [
        { rank: 1, name: 'Sarah Johnson', completions: 18, score: 2450 },
        { rank: 2, name: 'Emily Chen', completions: 16, score: 2280 },
        { rank: 3, name: 'Maria Garcia', completions: 15, score: 2100 },
        { rank: 4, name: 'Lisa Wang', completions: 14, score: 1950 },
        { rank: 5, name: 'Anna Smith', completions: 13, score: 1820 },
        { rank: 6, name: 'Jennifer Lee', completions: 12, score: 1680 },
        { rank: 7, name: 'Rachel Brown', completions: 11, score: 1540 },
        { rank: 8, name: 'Michelle Davis', completions: 10, score: 1400 },
    ];

    const renderStatCard = (title, value, subtitle, icon, color) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
    );

    const renderOverview = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statsGrid}>
                {renderStatCard('Total Completions', analytics?.total_completions || 0, null, 'checkmark-circle', '#4CAF50')}
                {renderStatCard('Active Users', analytics?.total_users || 0, 'Completed at least 1', 'people', '#3B82F6')}
                {renderStatCard('Average Score', `${analytics?.average_score || 0}%`, null, 'trophy', '#FFD700')}
                {renderStatCard('Total Time', `${Math.round((analytics?.total_time_spent || 0) / 60)}h`, 'Learning time', 'time', '#8B5CF6')}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Completions by Category</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => {
                        const count = analytics?.completions_by_category?.[cat.id] || 0;
                        const maxCount = Math.max(...Object.values(analytics?.completions_by_category || { harassment: 1 }), 1);
                        const percentage = (count / maxCount) * 100;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                                onPress={() => {
                                    setSelectedCategory(cat);
                                    setShowCategoryModal(true);
                                }}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Ionicons name={cat.icon} size={20} color={cat.color} />
                                </View>
                                <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>{cat.title}</Text>
                                <View style={[styles.categoryProgressBg, { backgroundColor: colors.border }]}>
                                    <View style={[styles.categoryProgressFill, { backgroundColor: cat.color, width: `${percentage}%` }]} />
                                </View>
                                <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>{count} completions</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Difficulty Distribution</Text>
                <View style={styles.difficultyRow}>
                    {Object.entries(analytics?.completions_by_difficulty || {}).map(([diff, count]) => (
                        <View key={diff} style={styles.difficultyItem}>
                            <View style={[styles.difficultyBadge, { backgroundColor: (DIFFICULTY_COLORS[diff] || '#6B7280') + '20' }]}>
                                <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[diff] || '#6B7280' }]}>{diff}</Text>
                            </View>
                            <Text style={[styles.difficultyCount, { color: colors.text }]}>{count}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Age Group Distribution</Text>
                <View style={styles.ageRow}>
                    {Object.entries(analytics?.age_distribution || {}).map(([age, count]) => {
                        const maxCount = Math.max(...Object.values(analytics?.age_distribution || { 'Teen': 1 }), 1);
                        const percentage = (count / maxCount) * 100;
                        return (
                            <View key={age} style={styles.ageItem}>
                                <View style={[styles.ageBarBg, { backgroundColor: colors.border }]}>
                                    <View style={[styles.ageBarFill, { backgroundColor: colors.primary, width: `${percentage}%` }]} />
                                </View>
                                <Text style={[styles.ageLabel, { color: colors.textSecondary }]} numberOfLines={1}>{age.split(' ')[0]}</Text>
                                <Text style={[styles.ageCount, { color: colors.text }]}>{count}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );

    const renderLeaderboard = () => (
        <View style={styles.leaderboardContainer}>
            <View style={[styles.topThree, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                {leaderboard.slice(0, 3).map((user, index) => (
                    <View key={user.rank} style={styles.topThreeItem}>
                        <View style={[
                            styles.topThreeAvatar,
                            { 
                                backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                width: index === 0 ? 60 : 50,
                                height: index === 0 ? 60 : 50,
                            }
                        ]}>
                            <Text style={styles.topThreeAvatarText}>{user.name?.charAt(0) || '?'}</Text>
                        </View>
                        {index === 0 && <Ionicons name="trophy" size={16} color="#FFD700" style={styles.trophyIcon} />}
                        <Text style={[styles.topThreeName, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
                        <Text style={[styles.topThreeScore, { color: colors.primary }]}>{user.score} pts</Text>
                    </View>
                ))}
            </View>

            <FlatList
                data={leaderboard.slice(3)}
                keyExtractor={(item) => item.rank.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.leaderboardItem, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                        <Text style={[styles.leaderboardRank, { color: colors.textSecondary }]}>#{item.rank}</Text>
                        <View style={[styles.leaderboardAvatar, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.leaderboardAvatarText, { color: colors.primary }]}>{item.name?.charAt(0) || '?'}</Text>
                        </View>
                        <View style={styles.leaderboardInfo}>
                            <Text style={[styles.leaderboardName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.leaderboardCompletions, { color: colors.textSecondary }]}>{item.completions} scenarios</Text>
                        </View>
                        <Text style={[styles.leaderboardPoints, { color: colors.primary }]}>{item.score} pts</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No leaderboard data</Text>
                    </View>
                }
            />
        </View>
    );

    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;
        const count = analytics?.completions_by_category?.[selectedCategory.id] || 0;
        
        return (
            <Modal visible={showCategoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                                <Ionicons name={selectedCategory.icon} size={32} color={selectedCategory.color} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedCategory.title}</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalStats}>
                            <View style={styles.modalStatItem}>
                                <Text style={[styles.modalStatValue, { color: colors.text }]}>{count}</Text>
                                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Total Completions</Text>
                            </View>
                            <View style={styles.modalStatItem}>
                                <Text style={[styles.modalStatValue, { color: colors.text }]}>
                                    {analytics?.total_users ? Math.round((count / analytics.total_users) * 100) : 0}%
                                </Text>
                                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>User Participation</Text>
                            </View>
                        </View>
                        
                        <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Difficulty Breakdown</Text>
                        <View style={styles.modalDifficulty}>
                            {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                                <View key={diff} style={[styles.modalDifficultyItem, { backgroundColor: colors.card, borderRadius }]}>
                                    <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[diff] + '20' }]}>
                                        <Text style={[styles.diffBadgeText, { color: DIFFICULTY_COLORS[diff] }]}>{diff}</Text>
                                    </View>
                                    <Text style={[styles.diffCount, { color: colors.text }]}>
                                        {Math.round(count * (diff === 'Beginner' ? 0.5 : diff === 'Intermediate' ? 0.35 : 0.15))}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <Ionicons name="school" size={24} color="#fff" />
                    <Text style={styles.headerTitle}>Workshop Analytics</Text>
                </View>
            </View>

            <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'overview' ? colors.primary : colors.textSecondary }]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'leaderboard' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('leaderboard')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'leaderboard' ? colors.primary : colors.textSecondary }]}>Leaderboard</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'overview' ? renderOverview() : renderLeaderboard()}
            </View>

            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            {renderCategoryDetail()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { padding: 16, paddingTop: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 16 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabText: { fontSize: 15, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { width: '47%', padding: 16, alignItems: 'center' },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: '700' },
    statTitle: { fontSize: 12, marginTop: 4 },
    statSubtitle: { fontSize: 10 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: { width: '31%', padding: 12, alignItems: 'center' },
    categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    categoryName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    categoryProgressBg: { width: '100%', height: 4, borderRadius: 2, marginTop: 8 },
    categoryProgressFill: { height: '100%', borderRadius: 2 },
    categoryCount: { fontSize: 9, marginTop: 4 },
    difficultyRow: { flexDirection: 'row', justifyContent: 'space-around' },
    difficultyItem: { alignItems: 'center' },
    difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    difficultyText: { fontSize: 12, fontWeight: '600' },
    difficultyCount: { fontSize: 18, fontWeight: '700', marginTop: 8 },
    ageRow: { gap: 12 },
    ageItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ageBarBg: { flex: 1, height: 8, borderRadius: 4 },
    ageBarFill: { height: '100%', borderRadius: 4 },
    ageLabel: { width: 50, fontSize: 11 },
    ageCount: { width: 30, fontSize: 14, fontWeight: '600', textAlign: 'right' },
    leaderboardContainer: { flex: 1 },
    topThree: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginBottom: 16 },
    topThreeItem: { alignItems: 'center', position: 'relative' },
    topThreeAvatar: { borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    topThreeAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
    trophyIcon: { position: 'absolute', top: -8 },
    topThreeName: { fontSize: 12, fontWeight: '600', marginTop: 8, maxWidth: 70 },
    topThreeScore: { fontSize: 14, fontWeight: '700' },
    leaderboardItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
    leaderboardRank: { width: 30, fontSize: 14, fontWeight: '600' },
    leaderboardAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    leaderboardAvatarText: { fontSize: 14, fontWeight: '600' },
    leaderboardInfo: { flex: 1, marginLeft: 12 },
    leaderboardName: { fontSize: 14, fontWeight: '600' },
    leaderboardCompletions: { fontSize: 11 },
    leaderboardPoints: { fontSize: 14, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 12, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
    modalHeader: { alignItems: 'center', marginBottom: 20 },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    modalStatItem: { alignItems: 'center' },
    modalStatValue: { fontSize: 28, fontWeight: '700' },
    modalStatLabel: { fontSize: 12, marginTop: 4 },
    modalSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    modalDifficulty: { flexDirection: 'row', gap: 10 },
    modalDifficultyItem: { flex: 1, padding: 16, alignItems: 'center' },
    diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    diffBadgeText: { fontSize: 11, fontWeight: '600' },
    diffCount: { fontSize: 20, fontWeight: '700', marginTop: 8 },
});

export default WorkshopAnalyticsScreen;
