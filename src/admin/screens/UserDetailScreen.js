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
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const ROLES = ['woman', 'parent', 'guardian', 'friend', 'admin'];

const UserDetailScreen = ({ navigation, route }) => {
    const { userId, user: initialUser } = route.params || {};
    const { colors, borderRadius, shadows } = useTheme();
    const [user, setUser] = useState(initialUser ? {
        ...initialUser,
        name: initialUser.name || `${initialUser.first_name || ''} ${initialUser.last_name || ''}`.trim() || initialUser.email || 'Unknown',
        status: initialUser.status || (initialUser.is_active !== undefined ? (initialUser.is_active ? 'active' : 'inactive') : 'active'),
        role: initialUser.role || initialUser.user_role || 'user',
    } : {});
    const [loading, setLoading] = useState(!initialUser);
    const [dependents, setDependents] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [locationHistory, setLocationHistory] = useState([]);

    useEffect(() => {
        if (!initialUser && userId) {
            loadUserDetails();
        }
        if (userId) {
            loadAdditionalData();
        }
    }, [userId]);

    const loadUserDetails = async () => {
        try {
            const response = await adminService.getUserById(userId);
            if (response.success && response.user) {
                const u = response.user;
                setUser({
                    ...u,
                    name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
                    status: u.isActive ? 'active' : 'inactive',
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const loadAdditionalData = async () => {
        try {
            const [depResponse, famResponse, locResponse] = await Promise.all([
                adminService.getUserDependents(userId).catch(() => ({ success: false })),
                adminService.getUserFamilyMembers(userId).catch(() => ({ success: false })),
                adminService.getUserLocationHistory(userId).catch(() => ({ success: false })),
            ]);

            if (depResponse.success) setDependents(depResponse.dependents || []);
            if (famResponse.success) setFamilyMembers(famResponse.members || []);
            if (locResponse.success) setLocationHistory(locResponse.history?.slice(0, 5) || []);
        } catch (error) {
            console.log('Error loading additional data:', error);
        }
    };

    const handleUpdateRole = async (newRole) => {
        Alert.alert(
            'Update Role',
            `Change ${user.name}'s role to "${newRole}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            const response = await adminService.updateUserRole(userId, newRole);
                            if (response.success) {
                                Alert.alert('Success', 'Role updated successfully');
                                loadUserDetails();
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

    const handleUpdateStatus = async (newStatus) => {
        Alert.alert(
            'Update Status',
            `Change ${user.name}'s status to "${newStatus}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            const response = await adminService.updateUserStatus(userId, newStatus);
                            if (response.success) {
                                Alert.alert('Success', 'Status updated successfully');
                                loadUserDetails();
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

    const handleForceLogout = async () => {
        Alert.alert(
            'Force Logout',
            `Force logout ${user.name}? They will be logged out from all devices.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await adminService.forceLogoutUser(userId);
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

    const handleSendNotification = () => {
        Alert.prompt(
            'Send Notification',
            'Enter notification message:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async (message) => {
                        if (message) {
                            try {
                                const response = await adminService.sendNotification(userId, { message });
                                if (response.success) {
                                    Alert.alert('Success', 'Notification sent');
                                } else {
                                    Alert.alert('Error', response.message || 'Failed to send notification');
                                }
                            } catch (error) {
                                Alert.alert('Error', 'Failed to send notification');
                            }
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'default'
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const getRoleColor = (role) => {
        const colorMap = {
            admin: '#EF4444',
            parent: '#8B5CF6',
            guardian: '#F59E0B',
            woman: '#EC4899',
            friend: '#10B981',
        };
        return colorMap[role?.toLowerCase()] || colors.primary;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={[styles.avatarLarge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.avatarTextLarge}>
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) + '30' }]}>
                        <Text style={[styles.badgeText, { color: getRoleColor(user.role) }]}>
                            {user.role || 'user'}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: (user.status === 'active' ? colors.success : colors.error) + '30' }]}>
                        <Text style={[styles.badgeText, { color: user.status === 'active' ? colors.success : colors.error }]}>
                            {user.status || 'active'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>User Information</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{user.phone || 'Not provided'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Role</Text>
                    <View style={styles.roleButtons}>
                        {ROLES.map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[
                                    styles.roleButton,
                                    {
                                        backgroundColor: user.role === role ? getRoleColor(role) : colors.background,
                                        borderColor: getRoleColor(role),
                                    },
                                ]}
                                onPress={() => handleUpdateRole(role)}
                            >
                                <Text
                                    style={[
                                        styles.roleButtonText,
                                        { color: user.role === role ? '#fff' : getRoleColor(role) },
                                    ]}
                                >
                                    {role}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Status</Text>
                    <View style={styles.statusButtons}>
                        {['active', 'inactive', 'suspended'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusButton,
                                    {
                                        backgroundColor: user.status === status ? colors.primary : colors.background,
                                    },
                                ]}
                                onPress={() => handleUpdateStatus(status)}
                            >
                                <Text
                                    style={[styles.statusButtonText, { color: user.status === status ? '#fff' : colors.text }]}
                                >
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Members</Text>
                    {familyMembers.length > 0 ? (
                        familyMembers.map((member, index) => (
                            <View key={member.id || index} style={styles.memberRow}>
                                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                                        {member.name?.charAt(0)?.toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No family members</Text>
                    )}
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Locations</Text>
                    {locationHistory.length > 0 ? (
                        locationHistory.map((loc, index) => (
                            <View key={loc.id || index} style={styles.locationRow}>
                                <Ionicons name="location" size={16} color={colors.textSecondary} />
                                <View style={styles.locationInfo}>
                                    <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={1}>
                                        {loc.address || 'Location not available'}
                                    </Text>
                                    <Text style={[styles.locationTime, { color: colors.textSecondary }]}>
                                        {new Date(loc.timestamp).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No location history</Text>
                    )}
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
                        onPress={handleSendNotification}
                    >
                        <Ionicons name="notifications-outline" size={20} color={colors.success} />
                        <Text style={[styles.actionButtonText, { color: colors.success }]}>Send Notification</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
                        onPress={handleForceLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Force Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 30, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarTextLarge: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    content: { padding: 16, gap: 16 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    infoText: { fontSize: 14 },
    roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    roleButtonText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    statusButtons: { flexDirection: 'row', gap: 8 },
    statusButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    statusButtonText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    memberAvatarText: { fontSize: 14, fontWeight: '600' },
    memberInfo: { flex: 1, marginLeft: 12 },
    memberName: { fontSize: 14, fontWeight: '500' },
    memberRole: { fontSize: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
    locationInfo: { flex: 1 },
    locationAddress: { fontSize: 13 },
    locationTime: { fontSize: 11, marginTop: 2 },
    emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginBottom: 10, gap: 8 },
    actionButtonText: { fontSize: 14, fontWeight: '600' },
});

export default UserDetailScreen;
