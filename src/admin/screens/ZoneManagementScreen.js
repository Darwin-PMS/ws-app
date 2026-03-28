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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const ZONE_TYPES = ['all', 'zone', 'district', 'city', 'ward', 'village'];

const typeColors = {
    zone: '#8B5CF6',
    district: '#3B82F6',
    city: '#10B981',
    ward: '#F59E0B',
    village: '#EC4899',
    country: '#6366F1',
};

const ZoneManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [zoneName, setZoneName] = useState('');
    const [zoneType, setZoneType] = useState('zone');
    const [zoneCode, setZoneCode] = useState('');
    const [zoneLat, setZoneLat] = useState('');
    const [zoneLng, setZoneLng] = useState('');
    const [zoneRadius, setZoneRadius] = useState('5');

    const loadZones = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;
            if (typeFilter !== 'all') params.type = typeFilter;

            const response = await adminService.getAllZones(params);
            if (response.success) {
                const newZones = response.data || [];
                setZones(resetPage ? newZones : (prev) => [...prev, ...newZones]);
                setHasMore(newZones.length === 20);
                setPage(currentPage);
            } else {
                console.log('API returned error:', response.message);
            }
        } catch (error) {
            console.log('Error loading zones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, typeFilter]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadZones(true);
    }, [typeFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            setLoading(true);
            setPage(1);
            loadZones(true);
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        loadZones(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadZones(false);
        }
    };

    const handleZonePress = (zone) => {
        setSelectedZone(zone);
        setShowDetailModal(true);
    };

    const handleCreateZone = async () => {
        if (!zoneName.trim()) {
            Alert.alert('Error', 'Please enter a zone name');
            return;
        }
        if (!zoneLat || !zoneLng) {
            Alert.alert('Error', 'Please enter latitude and longitude');
            return;
        }

        setCreating(true);
        try {
            const zoneData = {
                name: zoneName,
                type: zoneType,
                code: zoneCode || undefined,
                latitude: parseFloat(zoneLat),
                longitude: parseFloat(zoneLng),
                radius_km: parseFloat(zoneRadius) || 5,
            };

            const response = await adminService.createZone(zoneData);
            if (response.success) {
                Alert.alert('Success', 'Zone created successfully');
                setShowCreateModal(false);
                resetForm();
                loadZones(true);
            } else {
                Alert.alert('Error', response.message || 'Failed to create zone');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create zone');
        }
        setCreating(false);
    };

    const handleDeleteZone = async (zoneId) => {
        Alert.alert(
            'Delete Zone',
            'Are you sure you want to delete this zone? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await adminService.deleteZone(zoneId);
                            if (response.success) {
                                Alert.alert('Success', 'Zone deleted successfully');
                                loadZones(true);
                                setShowDetailModal(false);
                            } else {
                                Alert.alert('Error', response.message || 'Failed to delete zone');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete zone');
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setZoneName('');
        setZoneType('zone');
        setZoneCode('');
        setZoneLat('');
        setZoneLng('');
        setZoneRadius('5');
    };

    const getMockZones = () => [
        { id: '1', name: 'North District', type: 'district', code: 'ND-001', latitude: 28.6139, longitude: 77.2090, radius_km: 10, user_count: 45, active: true },
        { id: '2', name: 'South Zone', type: 'zone', code: 'SZ-001', latitude: 28.5744, longitude: 77.2656, radius_km: 5, user_count: 32, active: true },
        { id: '3', name: 'East Village', type: 'village', code: 'EV-001', latitude: 28.6548, longitude: 77.2885, radius_km: 3, user_count: 18, active: true },
        { id: '4', name: 'West Ward', type: 'ward', code: 'WW-001', latitude: 28.5355, longitude: 77.2100, radius_km: 2, user_count: 25, active: true },
    ];

    const getTypeColor = (type) => typeColors[type?.toLowerCase()] || colors.primary;

    const getTypeLabel = (type) => {
        const labels = {
            zone: 'Zone',
            district: 'District',
            city: 'City',
            ward: 'Ward',
            village: 'Village',
            country: 'Country',
        };
        return labels[type?.toLowerCase()] || type;
    };

    const renderZone = ({ item }) => (
        <TouchableOpacity
            style={[styles.zoneCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => handleZonePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.zoneHeader}>
                <View style={[styles.zoneIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Ionicons name="map" size={22} color={getTypeColor(item.type)} />
                </View>
                <View style={styles.zoneInfo}>
                    <View style={styles.zoneTitleRow}>
                        <Text style={[styles.zoneName, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                                {getTypeLabel(item.type)}
                            </Text>
                        </View>
                    </View>
                    {item.code && (
                        <Text style={[styles.zoneCode, { color: colors.textSecondary }]}>
                            Code: {item.code}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.zoneDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="radio-button-on" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {item.radius_km || 5} km radius
                    </Text>
                </View>
            </View>

            <View style={styles.zoneStats}>
                <View style={[styles.statBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people" size={14} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.primary }]}>
                        {item.user_count || 0} users
                    </Text>
                </View>
                <View style={[styles.statBadge, { backgroundColor: (item.active ? '#4CAF50' : '#6B7280') + '15' }]}>
                    <Text style={[styles.statText, { color: item.active ? '#4CAF50' : '#6B7280' }]}>
                        {item.active ? 'Active' : 'Inactive'}
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
                    placeholder="Search zones..."
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
                    {ZONE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: typeFilter === type ? (typeColors[type] || colors.primary) : colors.card,
                                    borderRadius,
                                },
                            ]}
                            onPress={() => setTypeFilter(type)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    { color: typeFilter === type ? '#fff' : colors.text },
                                ]}
                            >
                                {type === 'all' ? 'All Types' : getTypeLabel(type)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderCreateModal = () => (
        <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.modalContainer, { backgroundColor: colors.background }]}
            >
                <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Zone</Text>
                    <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Zone Name *</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter zone name"
                            placeholderTextColor={colors.textSecondary}
                            value={zoneName}
                            onChangeText={setZoneName}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Zone Type</Text>
                        <View style={styles.typeSelector}>
                            {['zone', 'district', 'city', 'ward', 'village'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeOption,
                                        {
                                            backgroundColor: zoneType === type ? typeColors[type] : colors.background,
                                            borderColor: typeColors[type],
                                        },
                                    ]}
                                    onPress={() => setZoneType(type)}
                                >
                                    <Text
                                        style={[
                                            styles.typeOptionText,
                                            { color: zoneType === type ? '#fff' : typeColors[type] },
                                        ]}
                                    >
                                        {getTypeLabel(type)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Zone Code (Optional)</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g., ND-001"
                            placeholderTextColor={colors.textSecondary}
                            value={zoneCode}
                            onChangeText={setZoneCode}
                        />
                    </View>

                    <View style={styles.coordRow}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius, flex: 1 }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Latitude *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="28.6139"
                                placeholderTextColor={colors.textSecondary}
                                value={zoneLat}
                                onChangeText={setZoneLat}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius, flex: 1 }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Longitude *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="77.2090"
                                placeholderTextColor={colors.textSecondary}
                                value={zoneLng}
                                onChangeText={setZoneLng}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Radius (km)</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="5"
                            placeholderTextColor={colors.textSecondary}
                            value={zoneRadius}
                            onChangeText={setZoneRadius}
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: colors.primary }]}
                        onPress={handleCreateZone}
                        disabled={creating}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add-circle" size={20} color="#fff" />
                                <Text style={styles.createBtnText}>Create Zone</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );

    const renderDetailModal = () => (
        <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Zone Details</Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {selectedZone && (
                    <ScrollView style={styles.modalContent}>
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.detailIcon, { backgroundColor: getTypeColor(selectedZone.type) + '20' }]}>
                                    <Ionicons name="map" size={32} color={getTypeColor(selectedZone.type)} />
                                </View>
                                <View style={styles.detailHeaderInfo}>
                                    <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedZone.name}</Text>
                                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedZone.type) + '20' }]}>
                                        <Text style={[styles.typeText, { color: getTypeColor(selectedZone.type) }]}>
                                            {getTypeLabel(selectedZone.type)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Location</Text>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Coordinates</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {selectedZone.latitude}, {selectedZone.longitude}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Radius</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedZone.radius_km || 5} km</Text>
                            </View>
                            {selectedZone.code && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Code</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedZone.code}</Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Statistics</Text>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Assigned Users</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedZone.user_count || 0}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                                <Text style={[styles.detailValue, { color: selectedZone.active ? '#4CAF50' : '#6B7280' }]}>
                                    {selectedZone.active ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    setShowDetailModal(false);
                                    navigation.navigate('ZoneDetails', { zoneId: selectedZone.id, zone: selectedZone });
                                }}
                            >
                                <Ionicons name="people" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>View Users</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                                onPress={() => handleDeleteZone(selectedZone.id)}
                            >
                                <Ionicons name="trash" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );

    if (loading && zones.length === 0) {
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
                data={zones}
                renderItem={renderZone}
                keyExtractor={(item) => item.id?.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No zones found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && zones.length > 0 ? (
                        <ActivityIndicator style={styles.footer} color={colors.primary} />
                    ) : null
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreateModal(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {renderCreateModal()}
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
    filterChips: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8 },
    filterChipText: { fontSize: 13, fontWeight: '500' },
    listContent: { padding: 16, paddingTop: 0, paddingBottom: 80 },
    zoneCard: { padding: 14, marginBottom: 12 },
    zoneHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    zoneIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    zoneInfo: { flex: 1, marginLeft: 12 },
    zoneTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    zoneName: { fontSize: 16, fontWeight: '600', flex: 1 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    typeText: { fontSize: 10, fontWeight: '600' },
    zoneCode: { fontSize: 12, marginTop: 4 },
    zoneDetails: { flexDirection: 'row', gap: 16, marginTop: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 12 },
    zoneStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
    statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    statText: { fontSize: 12, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalContent: { padding: 16 },
    inputContainer: { padding: 16, marginBottom: 12 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: { fontSize: 15, padding: 12, borderRadius: 8, borderWidth: 1 },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    typeOptionText: { fontSize: 12, fontWeight: '600' },
    coordRow: { flexDirection: 'row', gap: 12 },
    createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    detailCard: { padding: 16, marginBottom: 12 },
    detailHeader: { flexDirection: 'row', alignItems: 'center' },
    detailIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    detailHeaderInfo: { flex: 1, marginLeft: 14 },
    detailTitle: { fontSize: 20, fontWeight: '600' },
    cardTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, fontWeight: '600' },
    actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default ZoneManagementScreen;
