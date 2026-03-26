import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { userId, userRole, logout } = useApp();
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
    const profileCache = useRef(null);
    const headerAnim = useRef(new Animated.Value(0)).current;

    const loadProfile = useCallback(async () => {
        if (profileCache.current && !isEditing) {
            setProfile(profileCache.current);
            setIsLoading(false);
            return;
        }
        try {
            const response = await userService.getProfile(userId);
            if (response.success) {
                const userData = response.data || response.user;
                profileCache.current = userData;
                setProfile(userData);
                setEditForm({
                    firstName: userData?.firstName || '',
                    lastName: userData?.lastName || '',
                    phone: userData?.phone || '',
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    }, [userId, isEditing]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const handleSaveProfile = async () => {
        try {
            setIsLoading(true);
            const response = await userService.updateProfile(userId, editForm);
            if (response.success) {
                const userData = response.data || response.user;
                profileCache.current = userData;
                setProfile(userData);
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Error', response.message || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const menuItems = [
        { id: 'edit', title: 'Edit Profile', icon: 'create-outline', color: '#8B5CF6', onPress: () => setIsEditing(true) },
        { id: 'family', title: 'My Family', icon: 'people-outline', color: '#EC4899', onPress: () => navigation.navigate('More', { screen: 'Family' }) },
        { id: 'qr', title: 'QR & Permissions', icon: 'qr-code-outline', color: '#10B981', onPress: () => navigation.navigate('More', { screen: 'QRScreen' }) },
        { id: 'settings', title: 'Settings', icon: 'settings-outline', color: '#3B82F6', onPress: () => navigation.navigate('More', { screen: 'Settings' }) },
        { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', color: '#F59E0B', onPress: () => Alert.alert('Coming Soon', 'Help feature coming soon') },
    ];

    const stats = [
        { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A' },
        { label: 'Role', value: userRole || 'User' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <View style={styles.headerContent}>
                        <View style={[styles.avatarLarge, { backgroundColor: colors.white }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {getInitials(profile?.firstName, profile?.lastName)}
                            </Text>
                        </View>
                        <Text style={styles.userName}>{profile ? `${profile.firstName} ${profile.lastName}` : 'User'}</Text>
                        <Text style={styles.userEmail}>{profile?.email || 'user@example.com'}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: colors.white + '25' }]}>
                            <Ionicons name="star" size={14} color={colors.white} />
                            <Text style={styles.roleText}>{userRole || 'User'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        {stats.map((stat, index) => (
                            <View key={stat.label} style={[styles.statItem, index < stats.length - 1 && { borderRightWidth: 1, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.gray }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
                        <InfoRow icon="call-outline" label="Phone" value={profile?.phone || 'Not set'} colors={colors} />
                        <InfoRow icon="mail-outline" label="Email" value={profile?.email || 'Not set'} colors={colors} />
                        <InfoRow icon="calendar-outline" label="Joined" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'} colors={colors} />
                    </View>

                    <View style={[styles.menuCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, index < menuItems.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }]}
                                onPress={item.onPress}
                            >
                                <View style={[styles.menuIconWrapper, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={[styles.menuText, { color: colors.text }]}>{item.title}</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.logoutButton, { borderColor: colors.error }]}
                        onPress={handleLogout}
                    >
                        <View style={[styles.menuIconWrapper, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        </View>
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>

            <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalAvatarSection}>
                            <View style={[styles.modalAvatar, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.modalAvatarText, { color: colors.primary }]}>
                                    {getInitials(editForm.firstName, editForm.lastName)}
                                </Text>
                            </View>
                            <Text style={[styles.modalAvatarHint, { color: colors.gray }]}>Preview</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>First Name</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="person-outline" size={20} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={editForm.firstName}
                                    onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                                    placeholder="Enter first name"
                                    placeholderTextColor={colors.gray}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Last Name</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="person-outline" size={20} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={editForm.lastName}
                                    onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                                    placeholder="Enter last name"
                                    placeholderTextColor={colors.gray}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Phone</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="call-outline" size={20} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={editForm.phone}
                                    onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                    placeholder="Enter phone number"
                                    placeholderTextColor={colors.gray}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setIsEditing(false)}>
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const InfoRow = ({ icon, label, value, colors }) => (
    <View style={styles.infoRow}>
        <View style={[styles.infoIconWrapper, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.gray }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerContent: { alignItems: 'center', paddingHorizontal: 20 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 36, fontWeight: 'bold' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
    roleText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    content: { padding: 16, marginTop: -20 },
    statsCard: { flexDirection: 'row', borderRadius: 16, padding: 20, marginBottom: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700' },
    statLabel: { fontSize: 12, marginTop: 4 },
    infoCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    infoIconWrapper: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    infoContent: { marginLeft: 14, flex: 1 },
    infoLabel: { fontSize: 12 },
    infoValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
    menuCard: { borderRadius: 16, padding: 8, marginBottom: 16 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12 },
    menuIconWrapper: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1, fontSize: 15, fontWeight: '500', marginLeft: 14 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
    logoutText: { fontSize: 16, fontWeight: '600' },
    bottomPadding: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeButton: { padding: 4 },
    modalAvatarSection: { alignItems: 'center', marginBottom: 24 },
    modalAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    modalAvatarText: { fontSize: 28, fontWeight: 'bold' },
    modalAvatarHint: { fontSize: 12, marginTop: 8 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 12 },
    input: { flex: 1, fontSize: 16 },
    modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
    cancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    cancelButtonText: { fontSize: 15, fontWeight: '600' },
    saveButton: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ProfileScreen;
