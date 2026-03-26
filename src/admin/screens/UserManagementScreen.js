import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const ROLES = ['all', 'woman', 'parent', 'guardian', 'friend', 'admin'];
const STATUS_FILTERS = ['all', 'active', 'inactive', 'suspended'];

const UserManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadUsers = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await adminService.getAllUsers(params);
            if (response.success) {
                const newUsers = response.users || [];
                setUsers(resetPage ? newUsers : (prev) => [...prev, ...newUsers]);
                setHasMore(newUsers.length === 20);
                setPage(currentPage);
            }
        } catch (error) {
            console.log('Error loading users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadUsers(true);
    }, [searchQuery, roleFilter, statusFilter, loadUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadUsers(false);
        }
    };

    const handleUserPress = (user) => {
        navigation.navigate('UserDetail', { userId: user.id, user });
    };

    const getUserDisplayName = (user) => {
        return user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown';
    };

    const handleUpdateRole = async (user, newRole) => {
        Alert.alert(
            'Update Role',
            `Change ${getUserDisplayName(user)}'s role to "${newRole}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            const response = await adminService.updateUserRole(user.id, newRole);
                            if (response.success) {
                                Alert.alert('Success', 'Role updated successfully');
                                loadUsers(true);
                            } else {
                                Alert.alert('Error', response.message || 'Failed to update role');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update role');
                        }
                    },
                },
            ]
        );
    };

    const handleUpdateStatus = async (user, newStatus) => {
        Alert.alert(
            'Update Status',
            `Change ${getUserDisplayName(user)}'s status to "${newStatus}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            const response = await adminService.updateUserStatus(user.id, newStatus);
                            if (response.success) {
                                Alert.alert('Success', 'Status updated successfully');
                                loadUsers(true);
                            } else {
                                Alert.alert('Error', response.message || 'Failed to update status');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status');
                        }
                    },
                },
            ]
        );
    };

    const handleForceLogout = async (user) => {
        Alert.alert(
            'Force Logout',
            `Force logout ${getUserDisplayName(user)}? They will be logged out from all devices.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await adminService.forceLogoutUser(user.id);
                            if (response.success) {
                                Alert.alert('Success', 'User has been logged out');
                            } else {
                                Alert.alert('Error', response.message || 'Failed to logout user');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout user');
                        }
                    },
                },
            ]
        );
    };

    const getRoleColor = (role) => {
        const colorMap = {
            admin: '#EF4444',
            parent: '#8B5CF6',
            guardian: '#F59E0B',
            woman: '#EC4899',
            friend: '#10B981',
            other: '#6B7280',
        };
        return colorMap[role?.toLowerCase()] || colors.primary;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            active: '#10B981',
            inactive: '#6B7280',
            suspended: '#EF4444',
        };
        return colorMap[status?.toLowerCase()] || colors.primary;
    };

    const renderUser = ({ item }) => {
        const userName = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Unknown';
        const userRole = item.role || 'user';
        const userStatus = item.status || (item.is_active !== undefined ? (item.is_active ? 'active' : 'inactive') : 'active');
        
        return (
            <TouchableOpacity
                style={[styles.userCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                onPress={() => handleUserPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.userHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {userName.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email || 'No email'}</Text>
                        <Text style={[styles.userPhone, { color: colors.textSecondary }]}>
                            {item.phone || 'No phone'}
                        </Text>
                    </View>
                </View>

                <View style={styles.userMeta}>
                    <View style={[styles.badge, { backgroundColor: getRoleColor(userRole) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getRoleColor(userRole) }]}>
                            {userRole}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(userStatus) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(userStatus) }]}>
                            {userStatus}
                        </Text>
                    </View>
                </View>

                <View style={styles.userStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                            Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={styles.userActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => handleUserPress(item)}
                    >
                        <Ionicons name="eye-outline" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.warning + '15' }]}
                        onPress={() => handleUpdateRole(item, 'admin')}
                    >
                        <Ionicons name="shield-outline" size={16} color={colors.warning} />
                        <Text style={[styles.actionText, { color: colors.warning }]}>Role</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                        onPress={() => handleForceLogout(item)}
                    >
                        <Ionicons name="log-out-outline" size={16} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderRadius }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search users..."
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <View style={styles.filterGroup}>
                    {ROLES.map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: roleFilter === role ? colors.primary : colors.card,
                                    borderRadius,
                                },
                            ]}
                            onPress={() => setRoleFilter(role)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    { color: roleFilter === role ? '#fff' : colors.text },
                                ]}
                            >
                                {role === 'all' ? 'All Roles' : role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    if (loading && users.length === 0) {
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
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && users.length > 0 ? (
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
    filterChips: { flexGrow: 0 },
    filterGroup: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8 },
    filterChipText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
    listContent: { padding: 16, paddingTop: 0 },
    userCard: { padding: 16, marginBottom: 12 },
    userHeader: { flexDirection: 'row', alignItems: 'center' },
    userAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 16, fontWeight: '600' },
    userEmail: { fontSize: 13, marginTop: 2 },
    userPhone: { fontSize: 12, marginTop: 2 },
    userMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    userStats: { flexDirection: 'row', gap: 16, marginTop: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12 },
    userActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 4 },
    actionText: { fontSize: 12, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
});

export default UserManagementScreen;
