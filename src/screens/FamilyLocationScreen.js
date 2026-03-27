import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import familyService from '../services/familyService';

const FamilyLocationScreen = ({ navigation, route }) => {
    const { colors, shadows } = useTheme();
    const passedFamilyId = route?.params?.familyId;
    
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentFamilyId, setCurrentFamilyId] = useState(passedFamilyId);
    const [families, setFamilies] = useState([]);
    const [showFamilySelector, setShowFamilySelector] = useState(false);
    const [error, setError] = useState(null);
    
    const refreshIntervalRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        initializeData();
        startAutoRefresh();
        
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    const initializeData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Get families first
            const familiesResponse = await familyService.getMyFamilies();
            const familiesList = familiesResponse?.data || familiesResponse || [];
            setFamilies(familiesList);
            
            // Determine which family to use
            let familyIdToUse = passedFamilyId;
            
            if (!familyIdToUse && familiesList.length > 0) {
                familyIdToUse = familiesList[0].id;
            }
            
            if (familyIdToUse) {
                setCurrentFamilyId(familyIdToUse);
                await loadFamilyLocations(familyIdToUse, false);
            } else {
                setLocations([]);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error initializing data:', error);
            setError('Failed to load family data');
            setIsLoading(false);
        }
    };

    const startAutoRefresh = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = setInterval(() => {
            if (currentFamilyId) {
                loadFamilyLocations(currentFamilyId, false);
            }
        }, 30000);
    };

    const loadFamilyLocations = async (familyId, showLoader = true) => {
        if (showLoader) {
            setIsLoading(true);
            setError(null);
        }
        
        try {
            const response = await familyService.getFamilyLocations(familyId);
            
            let locationData = [];
            
            if (response) {
                // Handle different response formats
                if (Array.isArray(response)) {
                    locationData = response;
                } else if (response.locations) {
                    locationData = response.locations;
                } else if (response.data) {
                    locationData = Array.isArray(response.data) ? response.data : [];
                } else if (response.members) {
                    locationData = response.members;
                } else if (typeof response === 'object') {
                    // Try to find array in response
                    const keys = Object.keys(response);
                    for (const key of keys) {
                        if (Array.isArray(response[key])) {
                            locationData = response[key];
                            break;
                        }
                    }
                }
            }
            
            setLocations(locationData);
            setLastUpdated(new Date());
            
            // Auto-select first member with location
            if (locationData.length > 0) {
                const memberWithLocation = locationData.find(m => m.latitude && m.longitude);
                if (memberWithLocation) {
                    setSelectedMember(memberWithLocation);
                    setTimeout(() => {
                        if (mapRef.current && memberWithLocation.latitude) {
                            mapRef.current.animateToRegion({
                                latitude: parseFloat(memberWithLocation.latitude),
                                longitude: parseFloat(memberWithLocation.longitude),
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05
                            }, 500);
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error loading family locations:', error);
            setError('Failed to load locations');
            setLocations([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        if (currentFamilyId) {
            loadFamilyLocations(currentFamilyId, false);
        } else {
            setRefreshing(false);
        }
    };

    const handleFamilySelect = (familyId) => {
        setCurrentFamilyId(familyId);
        setShowFamilySelector(false);
        setIsLoading(true);
        loadFamilyLocations(familyId, true);
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
            return {
                latitude: parseFloat(selectedMember.latitude),
                longitude: parseFloat(selectedMember.longitude),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            };
        }
        
        // Find any member with location
        const memberWithLocation = locations.find(m => m.latitude && m.longitude);
        if (memberWithLocation) {
            return {
                latitude: parseFloat(memberWithLocation.latitude),
                longitude: parseFloat(memberWithLocation.longitude),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            };
        }
        
        return { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.5, longitudeDelta: 0.5 };
    };

    const handleMemberSelect = (member) => {
        setSelectedMember(member);
        if (member.latitude && member.longitude && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: parseFloat(member.latitude),
                longitude: parseFloat(member.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            }, 500);
        }
    };

    const getMemberStatus = (member) => {
        if (member.is_online) return 'Online';
        if (member.last_seen) return `Last seen ${formatLastSeen(member.last_seen)}`;
        if (!member.location_sharing_enabled) return 'Location off';
        return 'No location data';
    };

    const getStatusColor = (member) => {
        if (member.is_online) return '#10B981';
        if (member.last_seen) return '#F59E0B';
        if (!member.location_sharing_enabled) return '#9CA3AF';
        return '#EF4444';
    };

    const getAvatarColor = (member) => {
        const colors_arr = ['#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
        const id = member.user_id || member.id || member.member_id || 0;
        return colors_arr[id % colors_arr.length];
    };

    const getMemberName = (member) => {
        if (member.nickname) return member.nickname;
        if (member.first_name || member.last_name) {
            return `${member.first_name || ''} ${member.last_name || ''}`.trim();
        }
        if (member.name) return member.name;
        return 'Unknown';
    };

    const getMemberInitials = (member) => {
        const name = getMemberName(member);
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const currentFamily = families.find(f => f.id === currentFamilyId);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color="#EC4899" />
                <Text style={[styles.loadingText, { color: colors.gray }]}>Loading family locations...</Text>
            </View>
        );
    }

    const membersWithLocation = locations.filter(m => m.latitude && m.longitude);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {membersWithLocation.map((member, index) => {
                    const memberId = member.user_id || member.id || member.member_id || index;
                    return (
                        <Marker
                            key={memberId}
                            coordinate={{
                                latitude: parseFloat(member.latitude),
                                longitude: parseFloat(member.longitude)
                            }}
                            onPress={() => handleMemberSelect(member)}
                        >
                            <View style={[
                                styles.markerContainer,
                                { backgroundColor: getAvatarColor(member) },
                                selectedMember?.user_id === memberId && styles.markerSelected
                            ]}>
                                <Text style={styles.markerText}>{getMemberInitials(member)}</Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            <View style={[styles.header, { backgroundColor: '#EC4899' }]}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.headerContent} 
                    onPress={() => families.length > 1 ? setShowFamilySelector(true) : null}
                    disabled={families.length <= 1}
                >
                    <Ionicons name="people" size={24} color="#fff" />
                    <Text style={styles.headerTitle}>
                        {currentFamily?.name || 'Family Locations'}
                    </Text>
                    {families.length > 1 && (
                        <Ionicons name="chevron-down" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerRefreshBtn} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {error && (
                <View style={[styles.errorBanner, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="alert-circle" size={18} color="#fff" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={handleRefresh}>
                        <Text style={styles.errorRetry}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {selectedMember && (
                <View style={[styles.selectedCard, { backgroundColor: colors.card, ...shadows.large }]}>
                    <View style={[styles.selectedAvatar, { backgroundColor: getAvatarColor(selectedMember) + '20' }]}>
                        <Text style={[styles.selectedAvatarText, { color: getAvatarColor(selectedMember) }]}>
                            {getMemberInitials(selectedMember)}
                        </Text>
                    </View>
                    <View style={styles.selectedInfo}>
                        <Text style={[styles.selectedName, { color: colors.text }]}>
                            {getMemberName(selectedMember)}
                        </Text>
                        <View style={styles.selectedStatusRow}>
                            <View style={[styles.selectedStatusDot, { backgroundColor: getStatusColor(selectedMember) }]} />
                            <Text style={[styles.selectedStatus, { color: getStatusColor(selectedMember) }]}>
                                {getMemberStatus(selectedMember)}
                            </Text>
                        </View>
                    </View>
                    {selectedMember.is_online && (
                        <View style={[styles.liveBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={[styles.membersPanel, { backgroundColor: colors.card, ...shadows.large }]}>
                <View style={styles.panelHeader}>
                    <View style={styles.panelTitleRow}>
                        <Text style={[styles.panelTitle, { color: colors.text }]}>Family Members</Text>
                        <View style={[styles.countBadge, { backgroundColor: '#EC489915' }]}>
                            <Text style={[styles.countText, { color: '#EC4899' }]}>{locations.length}</Text>
                        </View>
                    </View>
                    {lastUpdated && (
                        <Text style={[styles.lastUpdated, { color: colors.gray }]}>
                            {formatLastSeen(lastUpdated)}
                        </Text>
                    )}
                </View>

                <ScrollView
                    style={styles.membersList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#EC4899']}
                            tintColor="#EC4899"
                        />
                    }
                >
                    {locations.map((member, index) => {
                        const memberId = member.user_id || member.id || member.member_id || index;
                        return (
                            <TouchableOpacity
                                key={memberId}
                                style={[
                                    styles.memberItem,
                                    selectedMember?.user_id === memberId && { backgroundColor: '#EC489915' }
                                ]}
                                onPress={() => handleMemberSelect(member)}
                            >
                                <View style={[styles.avatar, { backgroundColor: getAvatarColor(member) + '20' }]}>
                                    <Text style={[styles.avatarText, { color: getAvatarColor(member) }]}>
                                        {getMemberInitials(member)}
                                    </Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>
                                        {getMemberName(member)}
                                    </Text>
                                    <View style={styles.memberStatusRow}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(member) }]} />
                                        <Text style={[styles.memberStatus, { color: getStatusColor(member) }]}>
                                            {getMemberStatus(member)}
                                        </Text>
                                    </View>
                                </View>
                                {member.is_online && (
                                    <View style={[styles.onlineBadge, { backgroundColor: '#10B981' }]}>
                                        <Text style={styles.onlineText}>LIVE</Text>
                                    </View>
                                )}
                                {member.latitude && (
                                    <Ionicons name="location" size={18} color="#EC4899" />
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {locations.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={colors.gray} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Family Members</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
                                Add members to see their locations
                            </Text>
                            <TouchableOpacity
                                style={[styles.createFamilyBtn, { backgroundColor: '#EC4899' }]}
                                onPress={() => navigation.navigate('Family')}
                            >
                                <Ionicons name="people-add" size={20} color="#fff" />
                                <Text style={styles.createFamilyText}>Go to Family</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>

            {showFamilySelector && (
                <TouchableOpacity 
                    style={styles.selectorOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowFamilySelector(false)}
                >
                    <View style={[styles.selectorModal, { backgroundColor: colors.card, ...shadows.large }]}>
                        <Text style={[styles.selectorTitle, { color: colors.text }]}>Select Family</Text>
                        {families.map((family) => (
                            <TouchableOpacity
                                key={family.id}
                                style={[
                                    styles.selectorItem,
                                    family.id === currentFamilyId && { backgroundColor: '#EC489915' }
                                ]}
                                onPress={() => handleFamilySelect(family.id)}
                            >
                                <Ionicons name="people" size={24} color={family.id === currentFamilyId ? '#EC4899' : colors.gray} />
                                <Text style={[styles.selectorItemText, { color: colors.text }]}>{family.name || 'Family'}</Text>
                                {family.id === currentFamilyId && (
                                    <Ionicons name="checkmark-circle" size={24} color="#EC4899" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, zIndex: 10 },
    headerBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    headerRefreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    map: { flex: 1 },
    markerContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    markerSelected: { width: 44, height: 44, borderRadius: 22, borderWidth: 3 },
    markerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    selectedCard: { position: 'absolute', top: 120, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, zIndex: 5 },
    selectedAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    selectedAvatarText: { fontSize: 18, fontWeight: '700' },
    selectedInfo: { flex: 1, marginLeft: 12 },
    selectedName: { fontSize: 16, fontWeight: '600' },
    selectedStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    selectedStatusDot: { width: 8, height: 8, borderRadius: 4 },
    selectedStatus: { fontSize: 12 },
    liveBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    membersPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: 320, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    panelTitle: { fontSize: 18, fontWeight: '700' },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    countText: { fontSize: 12, fontWeight: '700' },
    lastUpdated: { fontSize: 11 },
    membersList: { maxHeight: 220 },
    memberItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, gap: 12 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600' },
    memberStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    memberStatus: { fontSize: 12 },
    onlineBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 },
    onlineText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 30 },
    emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
    emptySubtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
    createFamilyBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 16, gap: 8 },
    createFamilyText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    errorBanner: { position: 'absolute', top: 110, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, zIndex: 15 },
    errorText: { flex: 1, color: '#fff', fontSize: 13 },
    errorRetry: { color: '#fff', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
    selectorOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    selectorModal: { width: '80%', borderRadius: 20, padding: 20 },
    selectorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    selectorItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 12, marginBottom: 8 },
    selectorItemText: { flex: 1, fontSize: 15, fontWeight: '500' },
});

export default FamilyLocationScreen;
