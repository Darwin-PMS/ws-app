import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    ScrollView,
    Linking,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const FamilyDetailsScreen = ({ route, navigation }) => {
    const { familyId, family: initialFamily } = route.params;
    const { colors, borderRadius, shadows } = useTheme();
    const [family, setFamily] = useState(initialFamily || {});
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFamilyDetails = useCallback(async () => {
        try {
            const response = await adminService.getFamilyById(familyId);
            if (response.success) {
                setFamily(response.family || {});
                setMembers(response.members || []);
            }
        } catch (error) {
            console.log('Error loading family details:', error);
            Alert.alert('Error', 'Failed to load family details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [familyId]);

    useEffect(() => {
        loadFamilyDetails();
    }, [loadFamilyDetails]);

    const onRefresh = () => {
        setRefreshing(true);
        loadFamilyDetails();
    };

    const handleViewOnMap = (member) => {
        if (member.lastLatitude && member.lastLongitude) {
            const url = `https://www.google.com/maps?q=${member.lastLatitude},${member.lastLongitude}`;
            Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open maps application');
            });
        } else {
            Alert.alert('No Location', 'This member has no location data available');
        }
    };

    const handleViewMemberDetail = (member) => {
        navigation.navigate('UserDetail', { userId: member.user_id, user: member });
    };

    const renderMember = ({ item }) => {
        const memberName = item.name || (item.first_name && item.last_name 
            ? `${item.first_name} ${item.last_name}` 
            : item.email || 'Unknown');
        const hasLocation = item.lastLatitude && item.lastLongitude;
        const lastLocationDate = item.lastLocationTime 
            ? new Date(item.lastLocationTime).toLocaleString() 
            : null;

        return (
            <TouchableOpacity
                style={[styles.memberCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                onPress={() => handleViewMemberDetail(item)}
                activeOpacity={0.7}
            >
                <View style={styles.memberHeader}>
                    <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                            {memberName.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: colors.text }]}>{memberName}</Text>
                        <View style={styles.memberMeta}>
                            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.roleText, { color: colors.primary }]}>
                                    {item.user_role || item.role || 'Member'}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { 
                                backgroundColor: (item.user_status === 'active' || item.is_active) 
                                    ? colors.success + '15' 
                                    : colors.error + '15' 
                            }]}>
                                <Text style={[styles.statusText, { 
                                    color: (item.user_status === 'active' || item.is_active) 
                                        ? colors.success 
                                        : colors.error 
                                }]}>
                                    {(item.user_status === 'active' || item.is_active) ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>

                <View style={styles.memberDetails}>
                    {item.email && (
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.email}</Text>
                        </View>
                    )}
                    {item.phone && (
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.phone}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.locationCount || 0} locations tracked
                        </Text>
                    </View>
                    {item.joinedAt && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                Joined {new Date(item.joinedAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                {hasLocation && (
                    <View style={[styles.locationSection, { borderTopColor: colors.border }]}>
                        <View style={styles.locationInfo}>
                            <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                            <View>
                                <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Last Location</Text>
                                {lastLocationDate && (
                                    <Text style={[styles.locationTime, { color: colors.text }]}>
                                        {lastLocationDate}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.mapBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleViewOnMap(item)}
                        >
                            <Ionicons name="map" size={16} color="#fff" />
                            <Text style={styles.mapBtnText}>View</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity 
                style={[styles.backBtn, { backgroundColor: colors.card }]} 
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            
            <View style={[styles.familyHeader, { backgroundColor: colors.card, borderRadius, ...shadows.md }]}>
                <View style={[styles.familyAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.familyName, { color: colors.text }]}>{family.name}</Text>
                {family.code && (
                    <Text style={[styles.familyCode, { color: colors.textSecondary }]}>
                        Code: {family.code}
                    </Text>
                )}
                {family.description && (
                    <Text style={[styles.familyDesc, { color: colors.textSecondary }]}>
                        {family.description}
                    </Text>
                )}

                <View style={[styles.familyMeta, { borderTopColor: colors.border }]}>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Created By</Text>
                        <Text style={[styles.metaValue, { color: colors.text }]}>
                            {family.creatorName || 'Unknown'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Created</Text>
                        <Text style={[styles.metaValue, { color: colors.text }]}>
                            {family.createdAt ? new Date(family.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Status</Text>
                        <View style={[styles.statusChip, { 
                            backgroundColor: family.status === 'active' ? colors.success + '15' : colors.error + '15' 
                        }]}>
                            <Text style={[styles.statusChipText, { 
                                color: family.status === 'active' ? colors.success : colors.error 
                            }]}>
                                {family.status || 'active'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Ionicons name="people" size={20} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{members.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Ionicons name="location" size={20} color={colors.success} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {members.filter(m => m.lastLatitude && m.lastLongitude).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>With Location</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Ionicons name="navigate" size={20} color={colors.secondary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {members.reduce((sum, m) => sum + (m.locationCount || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Locations</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Members</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id || item.user_id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No members in this family
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    header: { marginBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    familyHeader: { padding: 20, alignItems: 'center' },
    familyAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    familyName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
    familyCode: { fontSize: 13, marginBottom: 8 },
    familyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
    familyMeta: { flexDirection: 'row', gap: 16, paddingTop: 16, borderTopWidth: 1, width: '100%', justifyContent: 'center' },
    metaItem: { alignItems: 'center' },
    metaLabel: { fontSize: 11, marginBottom: 4 },
    metaValue: { fontSize: 13, fontWeight: '600' },
    statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusChipText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    statCard: { flex: 1, padding: 12, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', marginTop: 6 },
    statLabel: { fontSize: 11, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '600' },
    memberCard: { padding: 16, marginBottom: 12 },
    memberHeader: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    memberAvatarText: { fontSize: 18, fontWeight: '600' },
    memberInfo: { flex: 1, marginLeft: 12 },
    memberName: { fontSize: 15, fontWeight: '600' },
    memberMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    roleText: { fontSize: 11, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '500' },
    memberDetails: { marginTop: 12, gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13 },
    locationSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    locationDot: { width: 8, height: 8, borderRadius: 4 },
    locationLabel: { fontSize: 11 },
    locationTime: { fontSize: 13, fontWeight: '500' },
    mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    mapBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 15, marginTop: 8 },
});

export default FamilyDetailsScreen;
