import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services';

const ProfileScreen = ({ navigation }) => {
    const { userId, userRole, logout } = useApp();
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });

    // Cache profile data in memory
    const profileCache = React.useRef(null);

    const loadProfile = useCallback(async () => {
        // Return cached data if available and not forced refresh
        if (profileCache.current && !isEditing) {
            setProfile(profileCache.current);
            setIsLoading(false);
            return;
        }

        try {
            const response = await userService.getProfile(userId);
            if (response.success) {
                const userData = response.data || response.user;
                profileCache.current = userData; // Cache the data
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
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    const handleEditPress = () => {
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        try {
            setIsLoading(true);
            const response = await userService.updateProfile(userId, editForm);
            if (response.success) {
                const userData = response.data || response.user;
                profileCache.current = userData; // Update cache
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

    const handleCancelEdit = () => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
            });
        }
        setIsEditing(false);
    };

    const menuItems = [
        { id: 'edit', title: 'Edit Profile', icon: 'create-outline', onPress: handleEditPress },
        { id: 'family', title: 'My Family', icon: 'people-outline', onPress: () => navigation.navigate('More', { screen: 'Family' }) },
        { id: 'qr', title: 'QR & Permissions', icon: 'qr-code-outline', onPress: () => navigation.navigate('More', { screen: 'QRScreen' }) },
        { id: 'settings', title: 'Settings', icon: 'settings-outline', onPress: () => navigation.navigate('More', { screen: 'Settings' }) },
        { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', onPress: () => Alert.alert('Coming Soon', 'Help feature coming soon') },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView>
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                        <Ionicons name="person" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.name, { color: colors.white }]}>
                        {profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
                    </Text>
                    <Text style={[styles.email, { color: colors.white + 'CC' }]}>
                        {profile?.email || 'user@example.com'}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.white + '30' }]}>
                        <Text style={[styles.roleText, { color: colors.white }]}>{userRole || 'User'}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                        <InfoRow icon="call-outline" label="Phone" value={profile?.phone || 'Not set'} colors={colors} />
                        <InfoRow icon="mail-outline" label="Email" value={profile?.email || 'Not set'} colors={colors} />
                        <InfoRow icon="calendar-outline" label="Joined" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'} colors={colors} />
                    </View>

                    <View style={[styles.menuCard, { backgroundColor: colors.card, borderRadius, ...shadows.small, marginTop: spacing.md }]}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, index < menuItems.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }]}
                                onPress={item.onPress}
                            >
                                <Ionicons name={item.icon} size={22} color={colors.primary} />
                                <Text style={[styles.menuText, { color: colors.text }]}>{item.title}</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditing}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleCancelEdit}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>First Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={editForm.firstName}
                                onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                                placeholder="Enter first name"
                                placeholderTextColor={colors.gray}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Last Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={editForm.lastName}
                                onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                                placeholder="Enter last name"
                                placeholderTextColor={colors.gray}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Phone</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                placeholder="Enter phone number"
                                placeholderTextColor={colors.gray}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: colors.border }]}
                                onPress={handleCancelEdit}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveProfile}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={[styles.saveButtonText, { color: colors.white }]}>Save</Text>
                                )}
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
        <Ionicons name={icon} size={20} color={colors.gray} />
        <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.gray }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 14,
        marginTop: 4,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 8,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    infoCard: {
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 2,
    },
    menuCard: {
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
