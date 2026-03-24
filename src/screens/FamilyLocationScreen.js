import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const FamilyLocationScreen = ({ navigation, route }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();

    // Get familyId from route params (passed from FamilyDetailsScreen) or use first family
    const passedFamilyId = route?.params?.familyId;

    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Auto-refresh interval (30 seconds)
    const refreshIntervalRef = useRef(null);
    const REFRESH_INTERVAL = 30000; // 30 seconds

    useEffect(() => {
        loadFamilyLocations();
        // Start auto-refresh
        startAutoRefresh();

        return () => {
            // Cleanup on unmount
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // Auto-refresh function
    const startAutoRefresh = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        refreshIntervalRef.current = setInterval(() => {
            console.log('🔄 Auto-refreshing family locations...');
            loadFamilyLocations(false); // Don't show loading indicator during auto-refresh
        }, REFRESH_INTERVAL);
    };

    const loadFamilyLocations = async (showLoader = true) => {
        try {
            if (showLoader) {
                setIsLoading(true);
            }

            let familyIdToUse = passedFamilyId;

            // If no familyId passed, get user's families
            if (!familyIdToUse) {
                const familiesResponse = await familyService.getMyFamilies();
                if (familiesResponse.success && familiesResponse.data?.length > 0) {
                    familyIdToUse = familiesResponse.data[0].id;
                }
            }

            if (familyIdToUse) {
                // Get family locations for the specific family
                const response = await familyService.getFamilyLocations(familyIdToUse);
                if (response.success) {
                    // Handle both 'data' and 'locations' response formats
                    const locationData = response.locations || response.data || [];
                    setLocations(locationData);
                    setLastUpdated(new Date());

                    // Auto-select first member with location if none selected
                    if (!selectedMember && locationData.length > 0) {
                        const memberWithLocation = locationData.find(m => m.latitude && m.longitude);
                        if (memberWithLocation) {
                            setSelectedMember(memberWithLocation);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading family locations:', error);
            if (showLoader) {
                Alert.alert('Error', 'Failed to load family locations');
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadFamilyLocations(false);
    };

    // Format last seen time
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'No location data';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const getInitialRegion = () => {
        // Try to get selected member's location first
        if (selectedMember?.latitude && selectedMember?.longitude) {
            return {
                latitude: parseFloat(selectedMember.latitude),
                longitude: parseFloat(selectedMember.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // Otherwise try to find any member with location
        const memberWithLocation = locations.find(m => m.latitude && m.longitude);
        if (memberWithLocation) {
            return {
                latitude: parseFloat(memberWithLocation.latitude),
                longitude: parseFloat(memberWithLocation.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // Default location
        return {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
    };

    // Get status text for member
    const getMemberStatus = (member) => {
        if (member.is_online) return '🟢 Online';
        if (member.last_seen) return `📍 Last seen ${formatLastSeen(member.last_seen)}`;
        if (!member.location_sharing_enabled) return '🔒 Location sharing off';
        return '❌ No location data';
    };

    // Get status color for member
    const getStatusColor = (member) => {
        if (member.is_online) return colors.success;
        if (member.last_seen) return colors.warning;
        if (!member.location_sharing_enabled) return colors.gray;
        return colors.error;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.gray, marginTop: 10 }]}>
                    Loading family locations...
                </Text>
            </View>
        );
    }

    // Filter members with valid coordinates for map
    const membersWithLocation = locations.filter(m => m.latitude && m.longitude);

    // Convert string coordinates to numbers for MapView
    const getCoordinate = (member) => ({
        latitude: parseFloat(member.latitude),
        longitude: parseFloat(member.longitude),
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Map showing members with location */}
            <MapView
                style={styles.map}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {membersWithLocation.map((member) => (
                    <Marker
                        key={member.user_id}
                        coordinate={getCoordinate(member)}
                        title={`${member.first_name} ${member.last_name}`}
                        description={getMemberStatus(member)}
                        onPress={() => setSelectedMember(member)}
                        pinColor={member.is_online ? colors.success : colors.warning}
                    />
                ))}
            </MapView>

            {/* Auto-refresh indicator */}
            {lastUpdated && (
                <View style={[styles.refreshIndicator, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Ionicons name="refresh" size={14} color={colors.primary} />
                    <Text style={[styles.refreshText, { color: colors.gray }]}>
                        Updated {formatLastSeen(lastUpdated)}
                    </Text>
                </View>
            )}

            {/* Family Members List */}
            <View style={[styles.membersList, { backgroundColor: colors.card, ...shadows.medium }]}>
                <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>
                        Family Members ({locations.length})
                    </Text>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={[styles.refreshBtn, { backgroundColor: colors.primary + '20' }]}
                    >
                        <Ionicons name="refresh" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />

                {locations.map((member) => (
                    <TouchableOpacity
                        key={member.user_id}
                        style={[
                            styles.memberItem,
                            selectedMember?.user_id === member.user_id && { backgroundColor: colors.primary + '20' },
                        ]}
                        onPress={() => setSelectedMember(member)}
                    >
                        <View style={[styles.memberAvatar, {
                            backgroundColor: member.is_online ? colors.success : member.latitude ? colors.warning : colors.gray
                        }]}>
                            <Text style={[styles.memberInitial, { color: colors.white }]}>
                                {member.first_name?.[0]}{member.last_name?.[0]}
                            </Text>
                        </View>
                        <View style={styles.memberInfo}>
                            <Text style={[styles.memberName, { color: colors.text }]}>
                                {member.nickname || `${member.first_name} ${member.last_name}`}
                            </Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member) }]} />
                                <Text style={[styles.memberStatus, { color: getStatusColor(member) }]}>
                                    {getMemberStatus(member)}
                                </Text>
                            </View>
                            {member.last_seen && !member.is_online && (
                                <Text style={[styles.lastSeen, { color: colors.gray }]}>
                                    {formatLastSeen(member.last_seen)}
                                </Text>
                            )}
                        </View>
                        {member.is_online && (
                            <View style={[styles.onlineBadge, { backgroundColor: colors.success }]}>
                                <Text style={styles.onlineBadgeText}>LIVE</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {locations.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={colors.gray} />
                        <Text style={[styles.emptyText, { color: colors.gray }]}>
                            No family members found
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.gray }]}>
                            Create a family to see member locations
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loadingText: {
        fontSize: 14,
    },
    refreshIndicator: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignSelf: 'center',
    },
    refreshText: {
        fontSize: 12,
        marginLeft: 6,
    },
    membersList: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: 300,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberInitial: {
        fontSize: 16,
        fontWeight: '600',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    memberStatus: {
        fontSize: 12,
    },
    lastSeen: {
        fontSize: 11,
        marginTop: 2,
    },
    onlineBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    onlineBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 10,
    },
    emptySubtext: {
        fontSize: 13,
        marginTop: 4,
    },
});

export default FamilyLocationScreen;
