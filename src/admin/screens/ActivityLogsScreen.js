import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const ACTION_TYPES = [
    'all',
    'login',
    'logout',
    'sos_triggered',
    'sos_resolved',
    'location_update',
    'profile_update',
    'family_created',
    'family_joined',
    'grievance_submitted',
    'notification_sent',
    'user_created',
    'user_deleted',
    'role_changed',
];

const actionColors = {
    login: '#4CAF50',
    logout: '#6B7280',
    sos_triggered: '#EF4444',
    sos_resolved: '#10B981',
    location_update: '#3B82F6',
    profile_update: '#8B5CF6',
    family_created: '#F59E0B',
    family_joined: '#EC4899',
    grievance_submitted: '#FF9800',
    notification_sent: '#14B8A6',
    user_created: '#22C55E',
    user_deleted: '#EF4444',
    role_changed: '#6366F1',
};

const actionIcons = {
    login: 'log-in',
    logout: 'log-out',
    sos_triggered: 'warning',
    sos_resolved: 'checkmark-circle',
    location_update: 'locate',
    profile_update: 'person',
    family_created: 'people',
    family_joined: 'person-add',
    grievance_submitted: 'document-text',
    notification_sent: 'notifications',
    user_created: 'person-add',
    user_deleted: 'trash',
    role_changed: 'swap-horizontal',
};

const ActivityLogsScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [stats, setStats] = useState(null);

    const loadLogs = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 30,
            };
            if (searchQuery) params.search = searchQuery;
            if (actionFilter !== 'all') params.action = actionFilter;

            const response = await adminService.getActivityLogs(params);
            if (response.success) {
                const newLogs = response.logs || response.data || [];
                setLogs(resetPage ? newLogs : (prev) => [...prev, ...newLogs]);
                setHasMore(newLogs.length === 30);
                setPage(currentPage);

                if (resetPage && response.stats) {
                    setStats(response.stats);
                }
            }
        } catch (error) {
            console.log('Error loading activity logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, actionFilter]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadLogs(true);
    }, [actionFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            setLoading(true);
            setPage(1);
            loadLogs(true);
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        loadLogs(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadLogs(false);
        }
    };

    const handleLogPress = (log) => {
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    const getActionLabel = (action) => {
        const labels = {
            login: 'User Login',
            logout: 'User Logout',
            sos_triggered: 'SOS Triggered',
            sos_resolved: 'SOS Resolved',
            location_update: 'Location Update',
            profile_update: 'Profile Updated',
            family_created: 'Family Created',
            family_joined: 'Family Joined',
            grievance_submitted: 'Grievance Submitted',
            notification_sent: 'Notification Sent',
            user_created: 'User Created',
            user_deleted: 'User Deleted',
            role_changed: 'Role Changed',
        };
        return labels[action] || action;
    };

    const getUserDisplayName = (log) => {
        return log.user_name || log.user?.name || log.email || 'System';
    };

    const renderLog = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.logCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => handleLogPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.logHeader}>
                <View style={[styles.logIcon, { backgroundColor: (actionColors[item.action] || '#6B7280') + '20' }]}>
                    <Ionicons 
                        name={actionIcons[item.action] || 'ellipse'} 
                        size={20} 
                        color={actionColors[item.action] || '#6B7280'} 
                    />
                </View>
                <View style={styles.logInfo}>
                    <View style={styles.logTitleRow}>
                        <Text style={[styles.logAction, { color: colors.text }]}>
                            {getActionLabel(item.action)}
                        </Text>
                        <View style={[styles.actionBadge, { backgroundColor: (actionColors[item.action] || '#6B7280') + '20' }]}>
                            <Text style={[styles.actionBadgeText, { color: actionColors[item.action] || '#6B7280' }]}>
                                {item.action}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.logUser, { color: colors.textSecondary }]}>
                        {getUserDisplayName(item)}
                    </Text>
                </View>
            </View>

            {item.description && (
                <Text style={[styles.logDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View style={styles.logMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </Text>
                </View>
                {item.ip_address && (
                    <View style={styles.metaItem}>
                        <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {item.ip_address}
                        </Text>
                    </View>
                )}
                {item.device && (
                    <View style={styles.metaItem}>
                        <Ionicons name="phone-portrait-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.device}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderStats = () => {
        if (!stats) return null;
        return (
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                <Text style={[styles.statsTitle, { color: colors.text }]}>Today's Summary</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total_actions || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Actions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.logins || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Logins</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.sos_triggered || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SOS</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search logs..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection}>
                <View style={styles.filterChips}>
                    {ACTION_TYPES.map((action) => (
                        <TouchableOpacity
                            key={action}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: actionFilter === action ? (actionColors[action] || colors.primary) : colors.card,
                                    borderRadius,
                                },
                            ]}
                            onPress={() => setActionFilter(action)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    { color: actionFilter === action ? '#fff' : colors.text },
                                ]}
                            >
                                {action === 'all' ? 'All' : getActionLabel(action)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderDetailModal = () => (
        <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Activity Details</Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {selectedLog && (
                    <ScrollView style={styles.modalContent}>
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.detailIcon, { backgroundColor: (actionColors[selectedLog.action] || '#6B7280') + '20' }]}>
                                    <Ionicons 
                                        name={actionIcons[selectedLog.action] || 'ellipse'} 
                                        size={28} 
                                        color={actionColors[selectedLog.action] || '#6B7280'} 
                                    />
                                </View>
                                <View style={styles.detailHeaderInfo}>
                                    <Text style={[styles.detailTitle, { color: colors.text }]}>
                                        {getActionLabel(selectedLog.action)}
                                    </Text>
                                    <View style={[styles.actionBadge, { backgroundColor: (actionColors[selectedLog.action] || '#6B7280') + '20' }]}>
                                        <Text style={[styles.actionBadgeText, { color: actionColors[selectedLog.action] || '#6B7280' }]}>
                                            {selectedLog.action}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>User</Text>
                            <View style={styles.userInfo}>
                                <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                                        {getUserDisplayName(selectedLog).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                        {getUserDisplayName(selectedLog)}
                                    </Text>
                                    {selectedLog.user_id && (
                                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                            ID: {selectedLog.user_id}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {selectedLog.description && (
                            <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Description</Text>
                                <Text style={[styles.cardValue, { color: colors.textSecondary }]}>
                                    {selectedLog.description}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline</Text>
                            <View style={styles.timelineItem}>
                                <Ionicons name="time-outline" size={16} color={colors.primary} />
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineTitle, { color: colors.text }]}>Created At</Text>
                                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                        {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {selectedLog.updated_at && (
                                <View style={styles.timelineItem}>
                                    <Ionicons name="sync-outline" size={16} color={colors.warning} />
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineTitle, { color: colors.text }]}>Updated At</Text>
                                        <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                            {new Date(selectedLog.updated_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Technical Details</Text>
                            {selectedLog.ip_address && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>IP Address</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedLog.ip_address}</Text>
                                </View>
                            )}
                            {selectedLog.device && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Device</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedLog.device}</Text>
                                </View>
                            )}
                            {selectedLog.user_agent && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>User Agent</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                                        {selectedLog.user_agent}
                                    </Text>
                                </View>
                            )}
                            {selectedLog.id && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Log ID</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedLog.id}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );

    if (loading && logs.length === 0) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderStats()}
            {renderFilters()}
            <FlatList
                data={logs}
                renderItem={renderLog}
                keyExtractor={(item) => item.id?.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activity logs found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && logs.length > 0 ? (
                        <ActivityIndicator style={styles.footer} color={colors.primary} />
                    ) : null
                }
            />
            {renderDetailModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    statsCard: { margin: 16, marginBottom: 0, padding: 16 },
    statsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700' },
    statLabel: { fontSize: 11, marginTop: 2 },
    filtersContainer: { padding: 16, paddingTop: 8, gap: 12 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    filterSection: { flexGrow: 0 },
    filterChips: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6 },
    filterChipText: { fontSize: 11, fontWeight: '500' },
    listContent: { padding: 16, paddingTop: 8 },
    logCard: { padding: 14, marginBottom: 12 },
    logHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    logIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    logInfo: { flex: 1, marginLeft: 12 },
    logTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logAction: { fontSize: 14, fontWeight: '600', flex: 1 },
    actionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    actionBadgeText: { fontSize: 9, fontWeight: '600' },
    logUser: { fontSize: 12, marginTop: 4 },
    logDescription: { fontSize: 12, marginTop: 8, lineHeight: 16 },
    logMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalContent: { padding: 16 },
    detailCard: { padding: 16, marginBottom: 12 },
    detailHeader: { flexDirection: 'row', alignItems: 'center' },
    detailIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    detailHeaderInfo: { flex: 1, marginLeft: 14 },
    detailTitle: { fontSize: 18, fontWeight: '600' },
    cardTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    cardValue: { fontSize: 14, lineHeight: 20 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { fontSize: 18, fontWeight: '600' },
    userName: { fontSize: 15, fontWeight: '600' },
    userEmail: { fontSize: 12, marginTop: 2 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
    timelineContent: { flex: 1, marginLeft: 12 },
    timelineTitle: { fontSize: 14, fontWeight: '500' },
    timelineTime: { fontSize: 12, marginTop: 2 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    detailLabel: { fontSize: 13 },
    detailValue: { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 },
});

export default ActivityLogsScreen;
