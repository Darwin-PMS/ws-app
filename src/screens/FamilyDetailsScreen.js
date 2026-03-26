import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const FamilyDetailsScreen = ({ navigation, route }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();

    const [family, setFamily] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberLocations, setMemberLocations] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Get familyId from route params
    const { familyId } = route.params || {};

    useEffect(() => {
        loadFamilyData();
    }, [familyId]);

    // Format last seen time
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return null;

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

    // Get location info for a member
    const getMemberLocationInfo = (memberId) => {
        const location = memberLocations[memberId];
        if (!location) return null;

        if (location.is_online && location.latitude && location.longitude) {
            return {
                status: 'online',
                text: '📍 Live Location',
                color: colors.success
            };
        } else if (location.latitude != null && location.longitude != null) {
            const locationText = location.address 
                ? `Last Location: ${location.address}` 
                : `Last Location: ${parseFloat(location.latitude).toFixed(4)}, ${parseFloat(location.longitude).toFixed(4)}`;
            return {
                status: 'last',
                text: `📍 ${locationText}`,
                color: colors.warning
            };
        } else if (!location.location_sharing_enabled) {
            return {
                status: 'off',
                text: '🔒 Location off',
                color: colors.gray
            };
        } else if (location.last_seen) {
            return {
                status: 'offline',
                text: `📍 ${formatLastSeen(location.last_seen)}`,
                color: colors.warning
            };
        }
        return null;
    };

    const loadFamilyData = async () => {
        try {
            setIsLoading(true);

            if (!familyId) {
                Alert.alert('Error', 'No family ID provided');
                return;
            }

            // Load family details by ID
            const response = await familyService.getFamilyById(familyId);
            if (response.success && response.family) {
                const f = response.family;
                setFamily({
                    id: f.id,
                    name: f.name,
                    createdBy: f.created_by,
                    createdAt: f.created_at,
                    updatedAt: f.updated_at,
                    memberCount: f.member_count,
                    currentUserRole: f.current_user_role,
                    currentUserId: f.current_user_id,
                });

                // Load family members
                const membersResponse = await familyService.getFamilyMembers(familyId);
                if (membersResponse.success) {
                    console.log('Family Members:', membersResponse);
                    const transformedMembers = (membersResponse.members || []).map(m => ({
                        id: m.id,
                        userId: m.user_id,
                        firstName: m.first_name,
                        lastName: m.last_name,
                        email: m.email,
                        phone: m.phone,
                        role: m.role,
                        nickname: m.nickname,
                        joinedAt: m.joined_at,
                        familyId: m.family_id,
                        userRole: m.user_role,
                        isOnline: m.is_online || false,
                    }));
                    setMembers(transformedMembers);
                }

                // Load family member locations
                const locationsResponse = await familyService.getFamilyLocations(familyId);
                if (locationsResponse.success) {
                    const locationsData = locationsResponse.locations || locationsResponse.data || [];
                    // Create a map of user_id to location data
                    const locationMap = {};
                    locationsData.forEach(loc => {
                        locationMap[loc.user_id] = loc;
                    });
                    setMemberLocations(locationMap);
                }
            } else {
                Alert.alert('Error', 'Family not found');
            }
        } catch (error) {
            console.error('Error loading family details:', error);
            Alert.alert('Error', 'Failed to load family details');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role?.toLowerCase()) {
            case 'father': return 'man';
            case 'mother': return 'woman';
            case 'son': return 'male';
            case 'daughter': return 'female';
            case 'brother': return 'man';
            case 'sister': return 'woman';
            case 'grandfather': return 'man';
            case 'grandmother': return 'woman';
            default: return 'person';
        }
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'father':
            case 'mother':
                return colors.primary;
            case 'son':
            case 'daughter':
                return colors.secondary;
            default:
                return colors.info;
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading family details...</Text>
            </View>
        );
    }

    if (!family) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Family Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted, textAlign: 'center' }]}>
                    You haven't created a family group yet.
                </Text>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 24 }]}
                    onPress={() => navigation.navigate('CreateFamily')}
                >
                    <Ionicons name="add" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Create Family</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Family Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="home" size={40} color="#FFF" />
                    </View>
                    <Text style={styles.familyName}>{family.name}</Text>
                    <Text style={styles.memberCount}>
                        {family.member_count || members.length || 0} members
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={[styles.actionsContainer, { backgroundColor: colors.surface, ...shadows.md }]}>
                <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => family && navigation.navigate('AddMember', { familyId: family.id })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
                        <Ionicons name="person-add" size={24} color={colors.success} />
                    </View>
                    <Text style={[styles.actionText, { color: colors.text }]}>Add Member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => family && navigation.navigate('FamilyLocation', { familyId: family.id })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
                        <Ionicons name="location" size={24} color={colors.info} />
                    </View>
                    <Text style={[styles.actionText, { color: colors.text }]}>Locations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => family && navigation.navigate('RelationshipEditor', { familyId: family.id })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                        <Ionicons name="git-network" size={24} color={colors.warning} />
                    </View>
                    <Text style={[styles.actionText, { color: colors.text }]}>Relations</Text>
                </TouchableOpacity>
            </View>

            {/* Members Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Members</Text>
                    <TouchableOpacity onPress={() => family && navigation.navigate('AddMember', { familyId: family.id })}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {members.map((member, index) => {
                    const locationInfo = getMemberLocationInfo(member.userId || member.id);
                    return (
                        <View
                            key={member.id}
                            style={[
                                styles.memberCard,
                                {
                                    backgroundColor: colors.surface,
                                    borderRadius: borderRadius.lg,
                                    ...shadows.sm,
                                },
                            ]}
                        >
                            <View style={[styles.memberIcon, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                                <Ionicons name={getRoleIcon(member.role)} size={28} color={getRoleColor(member.role)} />
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: colors.text }]}>
                                    {member.firstName} {member.lastName}
                                </Text>
                                <Text style={[styles.memberRole, { color: colors.textMuted }]}>
                                    {member.role}
                                </Text>
                                {member.phone && (
                                    <Text style={[styles.memberPhone, { color: colors.textSecondary }]}>
                                        {member.phone}
                                    </Text>
                                )}
                                {/* Location Info */}
                                {locationInfo && (
                                    <TouchableOpacity
                                        style={[styles.locationBadge, { backgroundColor: locationInfo.color + '15' }]}
                                        onPress={() => family && navigation.navigate('FamilyLocation', { familyId: family.id })}
                                    >
                                        <Ionicons name="location" size={12} color={locationInfo.color} />
                                        <Text style={[styles.locationText, { color: locationInfo.color }]}>
                                            {locationInfo.text}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: member.isOnline ? colors.success + '20' : colors.textMuted + '20' }
                            ]}>
                                <Ionicons
                                    name={member.isOnline ? "wifi" : "wifi-outline"}
                                    size={12}
                                    color={member.isOnline ? colors.success : colors.textMuted}
                                />
                                <Text style={[
                                    styles.statusText,
                                    { color: member.isOnline ? colors.success : colors.textMuted }
                                ]}>
                                    {member.isOnline ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    )
                })}

                {members.length === 0 && (
                    <View style={styles.emptyMembers}>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No members yet. Add your first family member!
                        </Text>
                    </View>
                )}
            </View>

            {/* Family Code Section */}
            {family.inviteCode && (
                <View style={[styles.inviteSection, { backgroundColor: colors.surface, ...shadows.sm }]}>
                    <Text style={[styles.inviteTitle, { color: colors.text }]}>Family Invite Code</Text>
                    <Text style={[styles.inviteCode, { color: colors.primary }]}>{family.inviteCode}</Text>
                    <Text style={[styles.inviteHint, { color: colors.textMuted }]}>
                        Share this code with family members to invite them
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    familyName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    memberCount: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        margin: 16,
        padding: 16,
        borderRadius: 16,
    },
    actionItem: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    memberIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 16,
    },
    memberName: {
        fontSize: 17,
        fontWeight: '600',
    },
    memberRole: {
        fontSize: 14,
        marginTop: 2,
    },
    memberPhone: {
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    locationText: {
        fontSize: 11,
        fontWeight: '500',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyMembers: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    inviteSection: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    inviteTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inviteCode: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginVertical: 8,
    },
    inviteHint: {
        fontSize: 13,
        textAlign: 'center',
    },
});

export default FamilyDetailsScreen;
