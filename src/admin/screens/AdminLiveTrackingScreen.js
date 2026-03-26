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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const AdminLiveTrackingScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadLocations = useCallback(async () => {
        try {
            const response = await adminService.getActiveLocations();
            if (response.success) {
                setLocations(response.locations || []);
            }
        } catch (error) {
            console.log('Error loading locations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const onRefresh = () => {
        setRefreshing(true);
        loadLocations();
    };

    const handleUserPress = async (user) => {
        setSelectedUser(user);
        setLoadingHistory(true);
        try {
            const response = await adminService.getUserLocationHistory(user.user_id || user.id);
            if (response.success) {
                setUserHistory(response.history || []);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load location history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const filteredLocations = searchQuery
        ? locations.filter(
              (loc) =>
                  loc.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : locations;

    const renderLocation = ({ item }) => {
        const userName = item.name || item.userName || 'Unknown User';
        const isActive = item.status === 'safe' || item.status === 'active';
        
        return (
            <TouchableOpacity
                style={[styles.locationCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                onPress={() => handleUserPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.locationHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {userName.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                        <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                            Last update: {item.last_updated ? new Date(item.last_updated).toLocaleString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.textSecondary }]} />
                </View>

                <View style={styles.locationDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.address || 'Location not available'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="navigate" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
                        </Text>
                    </View>
                    {item.status && (
                        <View style={styles.detailRow}>
                            <Ionicons name="shield-checkmark" size={16} color={item.status === 'safe' ? colors.success : colors.error} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                Status: {item.status}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.locationActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => handleUserPress(item)}
                    >
                        <Ionicons name="time-outline" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}
                        onPress={() => navigation.navigate('SOSManagement')}
                    >
                        <Ionicons name="warning-outline" size={16} color={colors.success} />
                        <Text style={[styles.actionText, { color: colors.success }]}>Track</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderUserHistory = () => {
        const userName = selectedUser?.name || selectedUser?.userName || 'Unknown';
        
        return (
            <View style={[styles.historyPanel, { backgroundColor: colors.card, borderRadius }]}>
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>
                        Location History - {userName}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedUser(null)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {loadingHistory ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.historyLoader} />
                ) : userHistory.length > 0 ? (
                    <FlatList
                        data={userHistory}
                        keyExtractor={(item, index) => `${item.id || index}`}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
                                <View style={styles.historyContent}>
                                    <Text style={[styles.historyAddress, { color: colors.text }]}>
                                        {item.address || 'Location not available'}
                                    </Text>
                                    <Text style={[styles.historyCoords, { color: colors.textSecondary }]}>
                                        {item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}
                                    </Text>
                                    <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        )}
                        style={styles.historyList}
                    />
                ) : (
                    <Text style={[styles.noHistory, { color: colors.textSecondary }]}>No location history available</Text>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search users..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{locations.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                        {locations.filter((l) => l.status === 'safe' || l.status === 'active').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Safe</Text>
                </View>
            </View>

            {selectedUser && renderUserHistory()}

            <FlatList
                data={filteredLocations}
                renderItem={renderLocation}
                keyExtractor={(item) => item.user_id || item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active locations</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
    statCard: { flex: 1, padding: 14, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    listContent: { padding: 16, paddingTop: 8 },
    locationCard: { padding: 16, marginBottom: 12 },
    locationHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold' },
    locationInfo: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 16, fontWeight: '600' },
    lastUpdate: { fontSize: 12, marginTop: 2 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    locationDetails: { marginTop: 12, gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    detailText: { flex: 1, fontSize: 13 },
    locationActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 4 },
    actionText: { fontSize: 12, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    historyPanel: { margin: 16, padding: 16, maxHeight: 300 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyTitle: { fontSize: 16, fontWeight: '600' },
    historyLoader: { padding: 20 },
    historyList: { maxHeight: 220 },
    historyItem: { flexDirection: 'row', marginBottom: 12 },
    historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    historyContent: { flex: 1, marginLeft: 12 },
    historyAddress: { fontSize: 13 },
    historyCoords: { fontSize: 11, marginTop: 2 },
    historyTime: { fontSize: 11, marginTop: 2 },
    noHistory: { textAlign: 'center', padding: 20, fontSize: 14 },
});

export default AdminLiveTrackingScreen;
