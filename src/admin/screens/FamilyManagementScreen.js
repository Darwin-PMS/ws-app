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

const FamilyManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadFamilies = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;

            const response = await adminService.getAllFamilies(params);
            if (response.success) {
                const newFamilies = response.families || [];
                setFamilies(resetPage ? newFamilies : (prev) => [...prev, ...newFamilies]);
                setHasMore(newFamilies.length === 20);
                setPage(currentPage);
            }
        } catch (error) {
            console.log('Error loading families:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadFamilies(true);
    }, [searchQuery, loadFamilies]);

    const onRefresh = () => {
        setRefreshing(true);
        loadFamilies(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadFamilies(false);
        }
    };

    const handleFamilyPress = (family) => {
        navigation.navigate('FamilyDetail', { familyId: family.id, family });
    };

    const handleDeleteFamily = async (family) => {
        Alert.alert(
            'Delete Family',
            `Are you sure you want to delete "${family.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await adminService.deleteFamily(family.id);
                            if (response.success) {
                                Alert.alert('Success', 'Family deleted successfully');
                                loadFamilies(true);
                            } else {
                                Alert.alert('Error', response.message || 'Failed to delete family');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete family');
                        }
                    },
                },
            ]
        );
    };

    const handleViewMembers = async (family) => {
        try {
            const response = await adminService.getFamilyById(family.id);
            if (response.success) {
                navigation.navigate('FamilyDetail', { familyId: family.id, family: response.family });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load family details');
        }
    };

    const renderFamily = ({ item }) => (
        <TouchableOpacity
            style={[styles.familyCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => handleFamilyPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.familyHeader}>
                <View style={[styles.familyAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                </View>
                <View style={styles.familyInfo}>
                    <Text style={[styles.familyName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.familyCode, { color: colors.textSecondary }]}>
                        Code: {item.code || 'N/A'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.menuBtn, { backgroundColor: colors.background }]}
                    onPress={() => handleViewMembers(item)}
                >
                    <Ionicons name="people-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.familyStats}>
                <View style={styles.statItem}>
                    <Ionicons name="person" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {item.memberCount || item.member_count || 0} members
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {item.locationCount || item.location_count || 0} locations
                    </Text>
                </View>
            </View>

            <View style={styles.familyMeta}>
                <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Created</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                        {item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Head</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                        {item.creatorName || item.headName || item.head_name || 'Not assigned'}
                    </Text>
                </View>
            </View>

            <View style={styles.familyActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => handleViewMembers(item)}
                >
                    <Ionicons name="people-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}
                    onPress={() => navigation.navigate('FamilyDetail', { familyId: item.id, family: item })}
                >
                    <Ionicons name="location-outline" size={16} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Locations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={() => handleDeleteFamily(item)}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>

            {item.members && item.members.length > 0 && (
                <View style={styles.membersPreview}>
                    <Text style={[styles.membersLabel, { color: colors.textSecondary }]}>Members:</Text>
                    <View style={styles.memberAvatars}>
                        {item.members.slice(0, 4).map((member, index) => {
                            const memberName = member.name || (member.first_name && member.last_name 
                                ? `${member.first_name} ${member.last_name}` 
                                : member.email || 'Unknown');
                            return (
                                <View
                                    key={member.id || member.user_id || index}
                                    style={[styles.memberAvatar, { backgroundColor: colors.primary + '20', marginLeft: index > 0 ? -10 : 0 }]}
                                >
                                    <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                                        {memberName.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            );
                        })}
                        {item.members.length > 4 && (
                            <View style={[styles.memberAvatar, { backgroundColor: colors.secondary + '20', marginLeft: -10 }]}>
                                <Text style={[styles.memberAvatarText, { color: colors.secondary }]}>
                                    +{item.members.length - 4}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search families..."
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
        </View>
    );

    if (loading && families.length === 0) {
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
                data={families}
                renderItem={renderFamily}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-circle-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No families found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && families.length > 0 ? (
                        <ActivityIndicator style={styles.footer} color={colors.primary} />
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    filtersContainer: { padding: 16, gap: 12 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    listContent: { padding: 16, paddingTop: 0 },
    familyCard: { padding: 16, marginBottom: 12 },
    familyHeader: { flexDirection: 'row', alignItems: 'center' },
    familyAvatar: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    familyInfo: { flex: 1, marginLeft: 12 },
    familyName: { fontSize: 17, fontWeight: '600' },
    familyCode: { fontSize: 12, marginTop: 2 },
    menuBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    familyStats: { flexDirection: 'row', gap: 20, marginTop: 14 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 13 },
    familyMeta: { flexDirection: 'row', gap: 20, marginTop: 12 },
    metaItem: {},
    metaLabel: { fontSize: 11, marginBottom: 2 },
    metaValue: { fontSize: 13, fontWeight: '500' },
    familyActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 4 },
    actionText: { fontSize: 12, fontWeight: '600' },
    membersPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    membersLabel: { fontSize: 12 },
    memberAvatars: { flexDirection: 'row', marginLeft: 8 },
    memberAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    memberAvatarText: { fontSize: 11, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
});

export default FamilyManagementScreen;
