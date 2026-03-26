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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const STATUS_FILTERS = ['all', 'active', 'resolved', 'cancelled'];

const SOSAlertManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const loadAlerts = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await adminService.getAllSOSAlerts(params);
            if (response.success) {
                const newAlerts = response.alerts || [];
                setAlerts(resetPage ? newAlerts : (prev) => [...prev, ...newAlerts]);
                setHasMore(newAlerts.length === 20);
                setPage(currentPage);
            }
        } catch (error) {
            console.log('Error loading alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadAlerts(true);
    }, [searchQuery, statusFilter, loadAlerts]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAlerts(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadAlerts(false);
        }
    };

    const handleAlertPress = async (alert) => {
        try {
            const response = await adminService.getSOSAlertById(alert.id);
            if (response.success) {
                setSelectedAlert(response.alert);
                setShowDetailModal(true);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load alert details');
        }
    };

    const handleResolveAlert = async (alertId) => {
        Alert.prompt(
            'Resolve Alert',
            'Enter resolution notes:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Resolve',
                    onPress: async (notes) => {
                        try {
                            const response = await adminService.resolveSOSAlert(alertId, { notes });
                            if (response.success) {
                                Alert.alert('Success', 'Alert resolved successfully');
                                setShowDetailModal(false);
                                loadAlerts(true);
                            } else {
                                Alert.alert('Error', response.message || 'Failed to resolve alert');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to resolve alert');
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const getStatusColor = (status) => {
        const colorMap = {
            active: '#EF4444',
            resolved: '#10B981',
            cancelled: '#6B7280',
        };
        return colorMap[status?.toLowerCase()] || colors.primary;
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            active: 'warning',
            resolved: 'checkmark-circle',
            cancelled: 'close-circle',
        };
        return iconMap[status?.toLowerCase()] || 'alert-circle';
    };

    const renderAlert = ({ item }) => {
        const alertStatus = item.status || 'active';
        
        return (
            <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                onPress={() => handleAlertPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.alertHeader}>
                    <View style={[styles.alertIcon, { backgroundColor: getStatusColor(alertStatus) + '20' }]}>
                        <Ionicons name={getStatusIcon(alertStatus)} size={22} color={getStatusColor(alertStatus)} />
                    </View>
                    <View style={styles.alertInfo}>
                        <View style={styles.alertTitleRow}>
                            <Text style={[styles.alertUser, { color: colors.text }]}>
                                {item.user_name || item.userName || 'Unknown User'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alertStatus) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(alertStatus) }]}>
                                    {alertStatus}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>
                            {item.address || item.latitude ? `${item.latitude}, ${item.longitude}` : 'Location not available'}
                        </Text>
                    </View>
                </View>

                <View style={styles.alertDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                        </Text>
                    </View>
                    {item.trigger_method && (
                        <View style={styles.detailItem}>
                            <Ionicons name="flash-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                {item.trigger_method}
                            </Text>
                        </View>
                    )}
                </View>

                {alertStatus === 'active' && (
                    <TouchableOpacity
                        style={[styles.resolveBtn, { backgroundColor: colors.success + '15' }]}
                        onPress={() => handleResolveAlert(item.id)}
                    >
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                        <Text style={[styles.resolveText, { color: colors.success }]}>Resolve Alert</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by user or location..."
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderDetailModal = () => (
        <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Alert Details</Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {selectedAlert && (
                    <View style={styles.modalContent}>
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.alertIconLarge, { backgroundColor: getStatusColor(selectedAlert.status) + '20' }]}>
                                    <Ionicons name={getStatusIcon(selectedAlert.status)} size={32} color={getStatusColor(selectedAlert.status)} />
                                </View>
                                <View style={styles.detailHeaderInfo}>
                                    <Text style={[styles.detailUserName, { color: colors.text }]}>
                                        {selectedAlert.user_name || selectedAlert.userName || 'Unknown User'}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedAlert.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(selectedAlert.status) }]}>
                                            {selectedAlert.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Location</Text>
                            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                                {selectedAlert.address || 'Location not available'}
                            </Text>
                            {(selectedAlert.latitude || selectedAlert.longitude) && (
                                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 4 }]}>
                                    Lat: {selectedAlert.latitude}, Lng: {selectedAlert.longitude}
                                </Text>
                            )}
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline</Text>
                            <View style={styles.timelineItem}>
                                <Ionicons name="warning" size={16} color={colors.error} />
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineTitle, { color: colors.text }]}>Alert Triggered</Text>
                                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                        {selectedAlert.created_at ? new Date(selectedAlert.created_at).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {selectedAlert.resolved_at && (
                                <View style={styles.timelineItem}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineTitle, { color: colors.text }]}>Resolved</Text>
                                        <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                            {new Date(selectedAlert.resolved_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {selectedAlert.status === 'active' && (
                            <TouchableOpacity
                                style={[styles.resolveBtnLarge, { backgroundColor: colors.success }]}
                                onPress={() => handleResolveAlert(selectedAlert.id)}
                            >
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.resolveBtnText}>Resolve This Alert</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );

    if (loading && alerts.length === 0) {
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
                data={alerts}
                renderItem={renderAlert}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No alerts found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && alerts.length > 0 ? (
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
    filterChips: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8 },
    filterChipText: { fontSize: 13, fontWeight: '500' },
    listContent: { padding: 16, paddingTop: 0 },
    alertCard: { padding: 16, marginBottom: 12 },
    alertHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    alertIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    alertInfo: { flex: 1, marginLeft: 12 },
    alertTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    alertUser: { fontSize: 16, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    alertLocation: { fontSize: 13, marginTop: 4 },
    alertDetails: { flexDirection: 'row', gap: 16, marginTop: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 12 },
    contactsNotified: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    contactsLabel: { fontSize: 12 },
    resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, marginTop: 12, gap: 6 },
    resolveText: { fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalContent: { padding: 16, gap: 12 },
    detailCard: { padding: 16 },
    detailHeader: { flexDirection: 'row', alignItems: 'center' },
    alertIconLarge: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    detailHeaderInfo: { flex: 1, marginLeft: 16 },
    detailUserName: { fontSize: 20, fontWeight: '600' },
    cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    cardText: { fontSize: 14 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
    timelineContent: { flex: 1, marginLeft: 12 },
    timelineTitle: { fontSize: 14, fontWeight: '500' },
    timelineTime: { fontSize: 12, marginTop: 2 },
    resolutionNotes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    contactName: { fontSize: 14, fontWeight: '500' },
    contactPhone: { fontSize: 12 },
    resolveBtnLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 8, gap: 8 },
    resolveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SOSAlertManagementScreen;
