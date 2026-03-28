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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';
import zoneService from '../../services/zoneService';

const ROLE_OPTIONS = ['member', 'zone_head', 'supervisor', 'guardian', 'police', 'admin'];

const typeColors = {
    zone: '#8B5CF6',
    district: '#3B82F6',
    city: '#10B981',
    ward: '#F59E0B',
    village: '#EC4899',
};

const roleColors = {
    admin: '#EF4444',
    zone_head: '#8B5CF6',
    supervisor: '#F59E0B',
    police: '#3B82F6',
    guardian: '#EC4899',
    member: '#6B7280',
};

const ZoneDetailsScreen = ({ route, navigation }) => {
    const { zoneId, zone: initialZone } = route.params || {};
    const { colors, borderRadius, shadows } = useTheme();
    const [zone, setZone] = useState(initialZone || {});
    const [users, setUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [userIdInput, setUserIdInput] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const loadZoneDetails = useCallback(async () => {
        try {
            const [zoneRes, usersRes] = await Promise.all([
                adminService.getZoneById(zoneId),
                adminService.getZoneUsers(zoneId, { page: 1, limit: 20, search: searchQuery, role: roleFilter !== 'all' ? roleFilter : undefined }),
            ]);

            if (zoneRes.success) {
                setZone(zoneRes.data);
            }
            if (usersRes.success) {
                setUsers(usersRes.data || []);
                setHasMore((usersRes.data || []).length === 20);
            }
        } catch (error) {
            console.log('Error loading zone details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [zoneId, searchQuery, roleFilter]);

    useEffect(() => {
        setLoading(true);
        loadZoneDetails();
    }, [roleFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            setLoading(true);
            loadZoneDetails();
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        loadZoneDetails();
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadZoneDetails();
        }
    };

    const handleAssignUser = async () => {
        if (!userIdInput.trim()) {
            Alert.alert('Error', 'Please enter a user ID');
            return;
        }

        setAssigning(true);
        try {
            const response = await adminService.assignUserToZone(zoneId, parseInt(userIdInput), selectedRole);
            if (response.success) {
                Alert.alert('Success', 'User assigned to zone successfully');
                setShowAssignModal(false);
                setUserIdInput('');
                loadZoneDetails();
            } else {
                Alert.alert('Error', response.message || 'Failed to assign user');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to assign user');
        }
        setAssigning(false);
    };

    const handleSearchAvailableUsers = async (query) => {
        try {
            const response = await adminService.searchUsers(query);
            if (response.success) {
                const assignedIds = users.map(u => u.id);
                const filtered = (response.users || response.data || []).filter(u => !assignedIds.includes(u.id));
                setAvailableUsers(filtered);
            }
        } catch (error) {
            console.log('Error searching users:', error);
        }
    };

    const handleToggleUserSelection = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleBulkAssign = async () => {
        if (selectedUserIds.length === 0) {
            Alert.alert('Error', 'Please select at least one user');
            return;
        }

        setAssigning(true);
        try {
            const response = await zoneService.bulkAssignUsersToZone(zoneId, selectedUserIds, selectedRole);
            if (response.success) {
                Alert.alert('Success', response.message || `${selectedUserIds.length} users assigned successfully`);
                setShowBulkAssignModal(false);
                setSelectedUserIds([]);
                loadZoneDetails();
            } else {
                Alert.alert('Error', response.message || 'Failed to assign users');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to assign users');
        }
        setAssigning(false);
    };

    const handleRemoveUser = async (userId) => {
        Alert.alert(
            'Remove User',
            'Are you sure you want to remove this user from the zone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await adminService.removeUserFromZone(zoneId, userId);
                            if (response.success) {
                                Alert.alert('Success', 'User removed from zone');
                                loadZoneDetails();
                            } else {
                                Alert.alert('Error', response.message || 'Failed to remove user');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove user');
                        }
                    },
                },
            ]
        );
    };

    const getMockUsers = () => [
        { id: '1', name: 'John Doe', email: 'john@example.com', role_in_area: 'zone_head', is_primary: true, assigned_at: '2026-01-15' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role_in_area: 'supervisor', is_primary: false, assigned_at: '2026-02-01' },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role_in_area: 'member', is_primary: false, assigned_at: '2026-02-10' },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', role_in_area: 'member', is_primary: false, assigned_at: '2026-03-05' },
    ];

    const getRoleLabel = (role) => {
        const labels = {
            admin: 'Zone Admin',
            zone_head: 'Zone Head',
            supervisor: 'Supervisor',
            police: 'Police',
            guardian: 'Guardian',
            member: 'Member',
        };
        return labels[role?.toLowerCase()] || role;
    };

    const renderUser = ({ item }) => (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => {
                setSelectedUser(item);
                setShowUserModal(true);
            }}
            activeOpacity={0.7}
        >
            <View style={[styles.userAvatar, { backgroundColor: (roleColors[item.role_in_area] || colors.primary) + '20' }]}>
                <Text style={[styles.userAvatarText, { color: roleColors[item.role_in_area] || colors.primary }]}>
                    {item.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                    {item.is_primary && (
                        <View style={[styles.primaryBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.primaryBadgeText, { color: colors.primary }]}>Primary</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: (roleColors[item.role_in_area] || '#6B7280') + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: roleColors[item.role_in_area] || '#6B7280' }]}>
                        {getRoleLabel(item.role_in_area)}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.error + '15' }]}
                onPress={() => handleRemoveUser(item.id)}
            >
                <Ionicons name="close" size={18} color={colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

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
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterChips}>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: roleFilter === 'all' ? colors.primary : colors.card, borderRadius },
                        ]}
                        onPress={() => setRoleFilter('all')}
                    >
                        <Text style={[styles.filterChipText, { color: roleFilter === 'all' ? '#fff' : colors.text }]}>All</Text>
                    </TouchableOpacity>
                    {ROLE_OPTIONS.map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.filterChip,
                                { backgroundColor: roleFilter === role ? roleColors[role] : colors.card, borderRadius },
                            ]}
                            onPress={() => setRoleFilter(role)}
                        >
                            <Text style={[styles.filterChipText, { color: roleFilter === role ? '#fff' : colors.text }]}>
                                {getRoleLabel(role)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderAssignModal = () => (
        <Modal visible={showAssignModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Assign User to Zone</Text>
                        <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>User ID</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter user ID"
                            placeholderTextColor={colors.textSecondary}
                            value={userIdInput}
                            onChangeText={setUserIdInput}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Role in Zone</Text>
                        <View style={styles.roleSelector}>
                            {ROLE_OPTIONS.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleOption,
                                        {
                                            backgroundColor: selectedRole === role ? roleColors[role] : colors.background,
                                            borderColor: roleColors[role],
                                        },
                                    ]}
                                    onPress={() => setSelectedRole(role)}
                                >
                                    <Text
                                        style={[
                                            styles.roleOptionText,
                                            { color: selectedRole === role ? '#fff' : roleColors[role] },
                                        ]}
                                    >
                                        {getRoleLabel(role)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.assignBtn, { backgroundColor: colors.primary }]}
                        onPress={handleAssignUser}
                        disabled={assigning}
                    >
                        {assigning ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="person-add" size={18} color="#fff" />
                                <Text style={styles.assignBtnText}>Assign User</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderBulkAssignModal = () => (
        <Modal visible={showBulkAssignModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '80%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Assign Multiple Users ({selectedUserIds.length} selected)
                        </Text>
                        <TouchableOpacity onPress={() => setShowBulkAssignModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Search Users</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Search by name or email..."
                            placeholderTextColor={colors.textSecondary}
                            onChangeText={handleSearchAvailableUsers}
                        />
                    </View>

                    <ScrollView style={styles.userListContainer}>
                        {availableUsers.map(user => (
                            <TouchableOpacity
                                key={user.id}
                                style={[styles.userSelectItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => handleToggleUserSelection(user.id)}
                            >
                                <View style={styles.userSelectInfo}>
                                    <Text style={[styles.userSelectName, { color: colors.text }]}>
                                        {user.first_name} {user.last_name}
                                    </Text>
                                    <Text style={[styles.userSelectEmail, { color: colors.textSecondary }]}>
                                        {user.email}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={selectedUserIds.includes(user.id) ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={selectedUserIds.includes(user.id) ? colors.primary : colors.textSecondary}
                                />
                            </TouchableOpacity>
                        ))}
                        {availableUsers.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Search for users above
                            </Text>
                        )}
                    </ScrollView>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Role in Zone</Text>
                        <View style={styles.roleSelector}>
                            {ROLE_OPTIONS.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleChip,
                                        { backgroundColor: selectedRole === role ? colors.primary : colors.card, borderColor: colors.border }
                                    ]}
                                    onPress={() => setSelectedRole(role)}
                                >
                                    <Text style={[styles.roleChipText, { color: selectedRole === role ? '#fff' : colors.text }]}>
                                        {getRoleLabel(role)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.assignBtn, { backgroundColor: colors.primary }]}
                        onPress={handleBulkAssign}
                        disabled={assigning || selectedUserIds.length === 0}
                    >
                        {assigning ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="people" size={18} color="#fff" />
                                <Text style={styles.assignBtnText}>
                                    Assign {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''} Users
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderUserModal = () => (
        <Modal visible={showUserModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>User Details</Text>
                        <TouchableOpacity onPress={() => setShowUserModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {selectedUser && (
                        <ScrollView>
                            <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                                <View style={styles.detailHeader}>
                                    <View style={[styles.detailAvatar, { backgroundColor: (roleColors[selectedUser.role_in_area] || colors.primary) + '20' }]}>
                                        <Text style={[styles.detailAvatarText, { color: roleColors[selectedUser.role_in_area] || colors.primary }]}>
                                            {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.detailName, { color: colors.text }]}>{selectedUser.name}</Text>
                                        <Text style={[styles.detailEmail, { color: colors.textSecondary }]}>{selectedUser.email}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.detailCard, { backgroundColor: colors.card, borderRadius }]}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Role</Text>
                                    <View style={[styles.roleBadge, { backgroundColor: (roleColors[selectedUser.role_in_area] || '#6B7280') + '20' }]}>
                                        <Text style={[styles.roleBadgeText, { color: roleColors[selectedUser.role_in_area] || '#6B7280' }]}>
                                            {getRoleLabel(selectedUser.role_in_area)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Primary Zone</Text>
                                    <Text style={[styles.detailValue, { color: selectedUser.is_primary ? colors.primary : colors.text }]}>
                                        {selectedUser.is_primary ? 'Yes' : 'No'}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Assigned Date</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>
                                        {selectedUser.assigned_at || 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.removeBtnLarge, { backgroundColor: colors.error }]}
                                onPress={() => {
                                    setShowUserModal(false);
                                    handleRemoveUser(selectedUser.id);
                                }}
                            >
                                <Ionicons name="person-remove" size={18} color="#fff" />
                                <Text style={styles.removeBtnText}>Remove from Zone</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
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
            <View style={[styles.header, { backgroundColor: typeColors[zone.type] || colors.primary }]}>
                <View style={styles.headerContent}>
                    <Ionicons name="map" size={24} color="#fff" />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{zone.name || 'Zone Details'}</Text>
                        <Text style={styles.headerSubtitle}>
                            {users.length} users assigned
                        </Text>
                    </View>
                </View>
            </View>

            {renderFilters()}
            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id?.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users in this zone</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowAssignModal(true)}
            >
                <Ionicons name="person-add" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.fab2, { backgroundColor: colors.secondary }]}
                onPress={() => {
                    setSelectedUserIds([]);
                    setAvailableUsers([]);
                    setShowBulkAssignModal(true);
                }}
            >
                <Ionicons name="people" size={24} color="#fff" />
            </TouchableOpacity>

            {renderAssignModal()}
            {renderBulkAssignModal()}
            {renderUserModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    filtersContainer: { padding: 16, gap: 12 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    filterChips: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6 },
    filterChipText: { fontSize: 12, fontWeight: '500' },
    listContent: { padding: 16, paddingTop: 0, paddingBottom: 80 },
    userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { fontSize: 18, fontWeight: '600' },
    userInfo: { flex: 1, marginLeft: 12 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { fontSize: 15, fontWeight: '600' },
    primaryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    primaryBadgeText: { fontSize: 9, fontWeight: '600' },
    userEmail: { fontSize: 12, marginTop: 2 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    roleBadgeText: { fontSize: 10, fontWeight: '600' },
    removeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    inputContainer: { padding: 16, marginBottom: 12 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: { fontSize: 15, padding: 12, borderRadius: 8, borderWidth: 1 },
    roleSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    roleOptionText: { fontSize: 12, fontWeight: '600' },
    assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
    assignBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    detailCard: { padding: 16, marginBottom: 12 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    detailAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    detailAvatarText: { fontSize: 22, fontWeight: '600' },
    detailName: { fontSize: 18, fontWeight: '600' },
    detailEmail: { fontSize: 13, marginTop: 2 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, fontWeight: '600' },
    removeBtnLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8, marginTop: 8 },
    removeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    fab2: { position: 'absolute', right: 20, bottom: 86, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    userListContainer: { maxHeight: 200, marginBottom: 12 },
    userSelectItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 8, borderWidth: 1 },
    userSelectInfo: { flex: 1 },
    userSelectName: { fontSize: 14, fontWeight: '600' },
    userSelectEmail: { fontSize: 12, marginTop: 2 },
    roleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    roleChipText: { fontSize: 11, fontWeight: '500' },
});

export default ZoneDetailsScreen;
