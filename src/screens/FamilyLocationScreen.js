import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const FamilyLocationScreen = ({ navigation, route }) => {
    const { colors, shadows } = useTheme();
    const { userId } = useApp();
    const passedFamilyId = route?.params?.familyId;
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const refreshIntervalRef = useRef(null);
    const REFRESH_INTERVAL = 30000;

    useEffect(() => {
        loadFamilyLocations();
        startAutoRefresh();
        return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
    }, []);

    const startAutoRefresh = () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(() => loadFamilyLocations(false), REFRESH_INTERVAL);
    };

    const loadFamilyLocations = async (showLoader = true) => {
        try {
            if (showLoader) setIsLoading(true);
            let familyIdToUse = passedFamilyId;
            if (!familyIdToUse) {
                const familiesResponse = await familyService.getMyFamilies();
                if (familiesResponse.success && familiesResponse.data?.length > 0) {
                    familyIdToUse = familiesResponse.data[0].id;
                }
            }
            if (familyIdToUse) {
                const response = await familyService.getFamilyLocations(familyIdToUse);
                if (response.success) {
                    const locationData = response.locations || response.data || [];
                    setLocations(locationData);
                    setLastUpdated(new Date());
                    if (!selectedMember && locationData.length > 0) {
                        const memberWithLocation = locationData.find(m => m.latitude && m.longitude);
                        if (memberWithLocation) setSelectedMember(memberWithLocation);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading family locations:', error);
            if (showLoader) Alert.alert('Error', 'Failed to load family locations');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'No location data';
        const date = new Date(lastSeen);
        const diffMins = Math.floor((new Date() - date) / 60000);
        const diffHours = Math.floor((new Date() - date) / 3600000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const getInitialRegion = () => {
        if (selectedMember?.latitude && selectedMember?.longitude) {
            return { latitude: parseFloat(selectedMember.latitude), longitude: parseFloat(selectedMember.longitude), latitudeDelta: 0.01, longitudeDelta: 0.01 };
        }
        const memberWithLocation = locations.find(m => m.latitude && m.longitude);
        if (memberWithLocation) {
            return { latitude: parseFloat(memberWithLocation.latitude), longitude: parseFloat(memberWithLocation.longitude), latitudeDelta: 0.01, longitudeDelta: 0.01 };
        }
        return { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
    };

    const getMemberStatus = (member) => {
        if (member.is_online) return 'Online';
        if (member.last_seen) return `Last seen ${formatLastSeen(member.last_seen)}`;
        if (!member.location_sharing_enabled) return 'Location off';
        return 'No location data';
    };

    const getStatusColor = (member) => {
        if (member.is_online) return colors.success;
        if (member.last_seen) return colors.warning;
        if (!member.location_sharing_enabled) return colors.gray;
        return colors.error;
    };

    const getAvatarColor = (member) => {
        const colors_arr = ['#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
        return colors_arr[member.user_id % colors_arr.length];
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.gray }]}>Loading family locations...</Text>
            </View>
        );
    }

    const membersWithLocation = locations.filter(m => m.latitude && m.longitude);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView style={styles.map} initialRegion={getInitialRegion()} showsUserLocation showsMyLocationButton>
                {membersWithLocation.map((member) => (
                    <Marker key={member.user_id} coordinate={{ latitude: parseFloat(member.latitude), longitude: parseFloat(member.longitude) }} onPress={() => setSelectedMember(member)} pinColor={member.is_online ? colors.success : colors.warning} />
                ))}
            </MapView>

            {lastUpdated && (
                <View style={[styles.updateBadge, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Ionicons name="refresh" size={14} color={colors.primary} />
                    <Text style={[styles.updateText, { color: colors.gray }]}>Updated {formatLastSeen(lastUpdated)}</Text>
                </View>
            )}

            <View style={[styles.membersPanel, { backgroundColor: colors.card, ...shadows.large }]}>
                <View style={styles.panelHeader}>
                    <View style={styles.panelTitleRow}>
                        <View style={[styles.panelIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="people" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.panelTitle, { color: colors.text }]}>Family Members</Text>
                        <View style={[styles.countBadge, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={[styles.countText, { color: colors.primary }]}>{locations.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: colors.primary + '15' }]} onPress={() => { setRefreshing(true); loadFamilyLocations(false); }}>
                        <Ionicons name="refresh" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFamilyLocations(false); }} colors={[colors.primary]} tintColor={colors.primary} />

                {locations.map((member) => (
                    <TouchableOpacity key={member.user_id} style={[styles.memberItem, selectedMember?.user_id === member.user_id && { backgroundColor: colors.primary + '12' }]} onPress={() => setSelectedMember(member)}>
                        <View style={[styles.avatar, { backgroundColor: getAvatarColor(member) + '20' }]}>
                            <Text style={[styles.avatarText, { color: getAvatarColor(member) }]}>{member.first_name?.[0]}{member.last_name?.[0]}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                            <Text style={[styles.memberName, { color: colors.text }]}>{member.nickname || `${member.first_name} ${member.last_name}`}</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member) }]} />
                                <Text style={[styles.memberStatus, { color: getStatusColor(member) }]}>{getMemberStatus(member)}</Text>
                            </View>
                        </View>
                        {member.is_online && <View style={[styles.onlineBadge, { backgroundColor: colors.success }]}><Text style={styles.onlineText}>LIVE</Text></View>}
                        {member.latitude && <Ionicons name="location" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                ))}

                {locations.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={colors.gray + '50'} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Family Members</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Create a family to see member locations</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    map: { flex: 1 },
    updateBadge: { position: 'absolute', top: 60, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'center' },
    updateText: { fontSize: 12, marginLeft: 6 },
    membersPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: 320, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    panelIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    panelTitle: { fontSize: 18, fontWeight: '700' },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    countText: { fontSize: 12, fontWeight: '700' },
    refreshBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    memberItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, gap: 12 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    memberStatus: { fontSize: 12 },
    onlineBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 },
    onlineText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 30 },
    emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
    emptySubtitle: { fontSize: 13, marginTop: 4 },
});

export default FamilyLocationScreen;
