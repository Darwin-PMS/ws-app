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
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'rejected'];
const PRIORITY_FILTERS = ['all', 'low', 'medium', 'high', 'urgent'];

const priorityColors = {
    low: '#4CAF50',
    medium: '#2196F3',
    high: '#FF9800',
    urgent: '#F44336',
};

const statusColors = {
    pending: '#FF9800',
    in_progress: '#2196F3',
    resolved: '#4CAF50',
    rejected: '#6B7280',
};

const GrievanceManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const loadGrievances = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (priorityFilter !== 'all') params.priority = priorityFilter;

            const response = await adminService.getGrievanceReports(params);
            if (response.success) {
                const newGrievances = response.grievances || response.data || [];
                setGrievances(resetPage ? newGrievances : (prev) => [...prev, ...newGrievances]);
                setHasMore(newGrievances.length === 20);
                setPage(currentPage);
            }
        } catch (error) {
            console.log('Error loading grievances:', error);
            Alert.alert('Error', 'Failed to load grievances');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, statusFilter, priorityFilter]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadGrievances(true);
    }, [searchQuery, statusFilter, priorityFilter, loadGrievances]);

    const onRefresh = () => {
        setRefreshing(true);
        loadGrievances(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadGrievances(false);
        }
    };

    const handleGrievancePress = async (grievance) => {
        setSelectedGrievance(grievance);
        setShowDetailModal(true);
    };

    const handleUpdateStatus = async (grievanceId, newStatus) => {
        setUpdating(true);
        try {
            const response = await adminService.updateGrievanceStatus(grievanceId, { status: newStatus });
            if (response.success) {
                Alert.alert('Success', `Grievance marked as ${newStatus}`);
                loadGrievances(true);
                setShowDetailModal(false);
            } else {
                Alert.alert('Error', response.message || 'Failed to update status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
        setUpdating(false);
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pending',
            in_progress: 'In Progress',
            resolved: 'Resolved',
            rejected: 'Rejected',
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            urgent: 'Urgent',
        };
        return labels[priority] || priority || 'Medium';
    };

    const getComplaintTypeLabel = (type) => {
        const labels = {
            data_privacy: 'Data Privacy',
            harassment: 'Harassment/Abuse',
            content: 'Inappropriate Content',
            account: 'Account Issue',
            safety: 'Safety Concern',
            general: 'General',
            technical: 'Technical Issue',
            other: 'Other',
        };
        return labels[type] || type;
    };

    const renderGrievance = ({ item }) => (
        <TouchableOpacity
            style={[styles.grievanceCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => handleGrievancePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.grievanceHeader}>
                <View style={[styles.grievanceIcon, { backgroundColor: (priorityColors[item.priority] || colors.primary) + '20' }]}>
                    <Ionicons name="document-text" size={22} color={priorityColors[item.priority] || colors.primary} />
                </View>
                <View style={styles.grievanceInfo}>
                    <View style={styles.grievanceTitleRow}>
                        <Text style={[styles.grievanceTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title || 'Grievance'}
                        </Text>
                        <View style={[styles.priorityBadge, { backgroundColor: (priorityColors[item.priority] || '#6B7280') + '20' }]}>
                            <Text style={[styles.priorityText, { color: priorityColors[item.priority] || '#6B7280' }]}>
                                {getPriorityLabel(item.priority)}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.grievanceType, { color: colors.textSecondary }]}>
                        {getComplaintTypeLabel(item.complaint_type)}
                    </Text>
                </View>
            </View>

            <Text style={[styles.grievanceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description || item.message || 'No description'}
            </Text>

            <View style={styles.grievanceMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.user_name || item.User?.name || 'Unknown'}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
            </View>

            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#6B7280') + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status] || '#6B7280' }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search grievances..."
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
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status:</Text>
                <View style={styles.filterChips}>
                    {STATUS_FILTERS.map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: statusFilter === status ? colors.primary : colors.card,
                                    borderRadius,
                                },
                            ]}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    { color: statusFilter === status ? '#fff' : colors.text },
                                ]}
                            >
                                {status === 'all' ? 'All' : getStatusLabel(status)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Priority:</Text>
                <View style={styles.filterChips}>
                    {PRIORITY_FILTERS.map((priority) => (
                        <TouchableOpacity
                            key={priority}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: priorityFilter === priority ? (priorityColors[priority] || colors.primary) : colors.card,
                                    borderRadius,
                                },
                            ]}
                            onPress={() => setPriorityFilter(priority)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    { color: priorityFilter === priority ? '#fff' : colors.text },
                                ]}
                            >
                                {priority === 'all' ? 'All' : getPriorityLabel(priority)}
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
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Grievance Details</Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {selectedGrievance && (
                    <ScrollView style={styles.modalContent}>
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.detailIcon, { backgroundColor: (priorityColors[selectedGrievance.priority] || colors.primary) + '20' }]}>
                                    <Ionicons name="document-text" size={28} color={priorityColors[selectedGrievance.priority] || colors.primary} />
                                </View>
                                <View style={styles.detailHeaderInfo}>
                                    <Text style={[styles.detailTitle, { color: colors.text }]}>
                                        {selectedGrievance.title || 'Grievance'}
                                    </Text>
                                    <View style={[styles.priorityBadge, { backgroundColor: (priorityColors[selectedGrievance.priority] || '#6B7280') + '20' }]}>
                                        <Text style={[styles.priorityText, { color: priorityColors[selectedGrievance.priority] || '#6B7280' }]}>
                                            {getPriorityLabel(selectedGrievance.priority)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Complaint Type</Text>
                            <Text style={[styles.cardValue, { color: colors.textSecondary }]}>
                                {getComplaintTypeLabel(selectedGrievance.complaint_type)}
                            </Text>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Description</Text>
                            <Text style={[styles.cardValue, { color: colors.textSecondary }]}>
                                {selectedGrievance.description || selectedGrievance.message || 'No description'}
                            </Text>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Status</Text>
                            <View style={[styles.statusBadgeLarge, { backgroundColor: (statusColors[selectedGrievance.status] || '#6B7280') + '20' }]}>
                                <Text style={[styles.statusTextLarge, { color: statusColors[selectedGrievance.status] || '#6B7280' }]}>
                                    {getStatusLabel(selectedGrievance.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Submitted By</Text>
                            <View style={styles.userInfo}>
                                <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                                        {(selectedGrievance.user_name || selectedGrievance.User?.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                        {selectedGrievance.user_name || selectedGrievance.User?.name || 'Unknown User'}
                                    </Text>
                                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                        {selectedGrievance.email || selectedGrievance.User?.email || 'No email'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline</Text>
                            <View style={styles.timelineItem}>
                                <Ionicons name="time-outline" size={16} color={colors.primary} />
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineTitle, { color: colors.text }]}>Submitted</Text>
                                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                        {selectedGrievance.created_at ? new Date(selectedGrievance.created_at).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {selectedGrievance.updated_at && (
                                <View style={styles.timelineItem}>
                                    <Ionicons name="sync-outline" size={16} color={colors.warning} />
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineTitle, { color: colors.text }]}>Last Updated</Text>
                                        <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                            {new Date(selectedGrievance.updated_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.actionButtons}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Update Status</Text>
                            <View style={styles.actionButtonsRow}>
                                {selectedGrievance.status !== 'in_progress' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
                                        onPress={() => handleUpdateStatus(selectedGrievance.id, 'in_progress')}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="sync" size={16} color="#fff" />
                                                <Text style={styles.actionBtnText}>In Progress</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                                {selectedGrievance.status !== 'resolved' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                        onPress={() => handleUpdateStatus(selectedGrievance.id, 'resolved')}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                                <Text style={styles.actionBtnText}>Resolve</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                                {selectedGrievance.status !== 'rejected' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#6B7280' }]}
                                        onPress={() => handleUpdateStatus(selectedGrievance.id, 'rejected')}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="close-circle" size={16} color="#fff" />
                                                <Text style={styles.actionBtnText}>Reject</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );

    if (loading && grievances.length === 0) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderFilters()}
            <FlatList
                data={grievances}
                renderItem={renderGrievance}
                keyExtractor={(item) => item.id?.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No grievances found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && grievances.length > 0 ? (
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
    filtersContainer: { padding: 16, gap: 12 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    filterSection: { flexGrow: 0 },
    filterLabel: { fontSize: 13, marginRight: 8, alignSelf: 'center' },
    filterChips: { flexDirection: 'row', gap: 8, flexGrow: 0 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6 },
    filterChipText: { fontSize: 12, fontWeight: '500' },
    listContent: { padding: 16, paddingTop: 0 },
    grievanceCard: { padding: 14, marginBottom: 12 },
    grievanceHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    grievanceIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    grievanceInfo: { flex: 1, marginLeft: 12 },
    grievanceTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    grievanceTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    priorityText: { fontSize: 10, fontWeight: '600' },
    grievanceType: { fontSize: 12, marginTop: 4 },
    grievanceDescription: { fontSize: 13, marginTop: 10, lineHeight: 18 },
    grievanceMeta: { flexDirection: 'row', gap: 16, marginTop: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12 },
    statusRow: { flexDirection: 'row', marginTop: 10 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
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
    statusBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
    statusTextLarge: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { fontSize: 18, fontWeight: '600' },
    userName: { fontSize: 15, fontWeight: '600' },
    userEmail: { fontSize: 12, marginTop: 2 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
    timelineContent: { flex: 1, marginLeft: 12 },
    timelineTitle: { fontSize: 14, fontWeight: '500' },
    timelineTime: { fontSize: 12, marginTop: 2 },
    actionButtons: { marginTop: 8 },
    actionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    actionButtonsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default GrievanceManagementScreen;
