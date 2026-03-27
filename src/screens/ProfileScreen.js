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
    RefreshControl,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { userId, userRole, logout } = useApp();
    const { colors, shadows } = useTheme();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
    const profileCache = useRef(null);

    const loadProfile = useCallback(async () => {
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
            setIsRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const onRefresh = () => {
        setIsRefreshing(true);
        profileCache.current = null;
        loadProfile();
    };

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

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my SafeHer profile! I'm ${profile?.firstName} ${profile?.lastName}. Download SafeHer for your safety.`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
    };

    const getDaysSinceJoin = () => {
        if (!profile?.createdAt) return 0;
        const joinDate = new Date(profile.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - joinDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getSafetyScore = () => {
        let score = 60;
        if (profile?.phone) score += 10;
        if (profile?.firstName && profile?.lastName) score += 15;
        if (userRole === 'admin') score += 15;
        return Math.min(score, 100);
    };

    if (isLoading && !profile) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>Loading profile...</Text>
                </View>
            </View>
        );
    }

    const safetyScore = getSafetyScore();

    const quickActions = [
        { id: 'edit', icon: 'create-outline', color: '#8B5CF6', bg: '#8B5CF615', onPress: () => setIsEditing(true), label: 'Edit' },
        { id: 'family', icon: 'people-outline', color: '#EC4899', bg: '#EC489915', onPress: () => navigation.navigate('More', { screen: 'Family' }), label: 'Family' },
        { id: 'share', icon: 'share-social-outline', color: '#10B981', bg: '#10B98115', onPress: handleShare, label: 'Share' },
        { id: 'settings', icon: 'settings-outline', color: '#3B82F6', bg: '#3B82F615', onPress: () => navigation.navigate('More', { screen: 'Settings' }), label: 'Settings' },
    ];

    const menuItems = [
        { id: 'privacy', title: 'Privacy & Security', icon: 'shield-checkmark-outline', color: '#6366F1', description: 'Manage your privacy settings', badge: null, onPress: () => navigation.navigate('More', { screen: 'PrivacyPolicy' }) },
        { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', color: '#F59E0B', description: 'Configure alerts & sounds', badge: '3', onPress: () => navigation.navigate('More', { screen: 'Settings' }) },
        { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', color: '#14B8A6', description: 'FAQs and contact us', badge: null, onPress: () => navigation.navigate('More', { screen: 'HelpScreen' }) },
        { id: 'emergency', title: 'Emergency Contacts', icon: 'call-outline', color: '#EF4444', description: 'Manage emergency contacts', badge: null, onPress: () => navigation.navigate('More', { screen: 'Family' }) },
        { id: 'about', title: 'About App', icon: 'information-circle-outline', color: '#64748B', description: 'Version and info', badge: 'v1.0', onPress: () => navigation.navigate('More', { screen: 'AboutApp' }) },
    ];

    const achievements = [
        { icon: 'ribbon', label: 'Safety Aware', unlocked: true, color: '#FFD700' },
        { icon: 'shield', label: 'Verified', unlocked: profile?.phone ? true : false, color: '#10B981' },
        { icon: 'people', label: 'Family Added', unlocked: false, color: '#EC4899' },
        { icon: 'star', label: 'Pro User', unlocked: userRole === 'admin', color: '#8B5CF6' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                                <Ionicons name="share-social-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerButton}>
                                <Ionicons name="create-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.profileMain}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.4)' }]}>
                                <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                                        {getInitials(profile?.firstName, profile?.lastName)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editAvatarBtn}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{profile ? `${profile.firstName} ${profile.lastName}` : 'User'}</Text>
                        <Text style={styles.userEmail}>{profile?.email || 'user@example.com'}</Text>

                        <View style={styles.roleContainer}>
                            <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="star" size={12} color="#FCD34D" />
                                <Text style={styles.roleText}>{userRole || 'User'}</Text>
                            </View>
                            {profile?.phone && (
                                <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Ionicons name="call" size={12} color="#fff" />
                                    <Text style={styles.roleText}>{profile.phone}</Text>
                                </View>
                            )}
                            <View style={[styles.roleBadge, { backgroundColor: safetyScore === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name={safetyScore === 100 ? "checkmark-circle" : "shield-outline"} size={12} color={safetyScore === 100 ? '#34D399' : '#fff'} />
                                <Text style={[styles.roleText, { color: safetyScore === 100 ? '#34D399' : '#fff' }]}>{safetyScore}% Secure</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.quickActionsRow}>
                        {quickActions.map((action) => (
                            <TouchableOpacity key={action.id} style={styles.quickActionItem} onPress={action.onPress}>
                                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={24} color={action.color} />
                                </View>
                                <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.statsCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.statsHeader}>
                            <Text style={[styles.statsTitle, { color: colors.text }]}>Profile Stats</Text>
                            <TouchableOpacity onPress={onRefresh}>
                                <Ionicons name="refresh" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
                                    <Ionicons name="calendar" size={20} color="#10B981" />
                                </View>
                                <Text style={[styles.statNumber, { color: colors.text }]}>{getDaysSinceJoin()}</Text>
                                <Text style={[styles.statLabel, { color: colors.gray }]}>Days Active</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <View style={[styles.statIconBox, { backgroundColor: '#3B82F615' }]}>
                                    <Ionicons name="time" size={20} color="#3B82F6" />
                                </View>
                                <Text style={[styles.statNumber, { color: colors.text }]}>
                                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.gray }]}>Member Since</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <View style={[styles.statIconBox, { backgroundColor: '#8B5CF615' }]}>
                                    <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={[styles.statNumber, { color: colors.text }]}>{safetyScore}%</Text>
                                <Text style={[styles.statLabel, { color: colors.gray }]}>Safety Score</Text>
                            </View>
                        </View>

                        <View style={styles.safetyProgressContainer}>
                            <View style={styles.safetyProgressBg}>
                                <View style={[styles.safetyProgressFill, { width: `${safetyScore}%`, backgroundColor: safetyScore === 100 ? '#10B981' : '#F59E0B' }]} />
                            </View>
                            <Text style={[styles.safetyProgressText, { color: colors.gray }]}>
                                {safetyScore === 100 ? 'Fully secured!' : 'Complete your profile for 100%'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.achievementsCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.achievementsHeader}>
                            <Text style={[styles.statsTitle, { color: colors.text }]}>Achievements</Text>
                            <View style={styles.achievementsBadge}>
                                <Text style={[styles.achievementsBadgeText, { color: colors.primary }]}>{achievements.filter(a => a.unlocked).length}/{achievements.length}</Text>
                            </View>
                        </View>
                        <View style={styles.achievementsGrid}>
                            {achievements.map((item, index) => (
                                <View key={index} style={styles.achievementItem}>
                                    <View style={[styles.achievementIconContainer, { backgroundColor: item.unlocked ? item.color + '20' : colors.gray + '15' }]}>
                                        <Ionicons name={item.icon} size={22} color={item.unlocked ? item.color : colors.gray} />
                                    </View>
                                    <Text style={[styles.achievementLabel, { color: item.unlocked ? colors.text : colors.gray }]}>{item.label}</Text>
                                    {item.unlocked && <View style={styles.achievementCheck}><Ionicons name="checkmark-circle" size={12} color="#10B981" /></View>}
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.infoHeader}>
                            <Text style={[styles.statsTitle, { color: colors.text }]}>Account Information</Text>
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBox, { backgroundColor: '#8B5CF615' }]}>
                                <Ionicons name="person" size={18} color="#8B5CF6" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>Full Name</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.firstName} {profile?.lastName}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBox, { backgroundColor: '#EC489915' }]}>
                                <Ionicons name="mail" size={18} color="#EC4899" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>Email</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.email || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBox, { backgroundColor: '#10B98115' }]}>
                                <Ionicons name="call" size={18} color="#10B981" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>Phone</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.phone || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBox, { backgroundColor: '#3B82F615' }]}>
                                <Ionicons name="key" size={18} color="#3B82F6" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>User ID</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>#{userId?.slice(-8).toUpperCase() || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
                    <View style={[styles.menuCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, index < menuItems.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }]}
                                onPress={item.onPress}
                            >
                                <View style={[styles.menuIconWrapper, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                    <Text style={[styles.menuDescription, { color: colors.gray }]}>{item.description}</Text>
                                </View>
                                {item.badge && (
                                    <View style={[styles.menuBadge, { backgroundColor: item.color + '20' }]}>
                                        <Text style={[styles.menuBadgeText, { color: item.color }]}>{item.badge}</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.logoutButton, { borderColor: colors.error }]}
                        onPress={handleLogout}
                    >
                        <View style={[styles.logoutIcon, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        </View>
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                        <Ionicons name="arrow-forward" size={20} color={colors.error} style={styles.logoutArrow} />
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.gray }]}>Made with</Text>
                        <Ionicons name="heart" size={14} color="#EF4444" />
                        <Text style={[styles.footerText, { color: colors.gray }]}>for Women Safety</Text>
                    </View>

                    <View style={styles.versionInfo}>
                        <Text style={[styles.versionText, { color: colors.gray }]}>SafeHer v1.0.0</Text>
                        <Text style={[styles.versionDot, { color: colors.gray }]}> • </Text>
                        <Text style={[styles.versionText, { color: colors.gray }]}>Build 2024.1</Text>
                    </View>

                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>

            <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 28 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalAvatarSection}>
                            <View style={[styles.modalAvatarRing, { borderColor: colors.primary }]}>
                                <View style={[styles.modalAvatar, { backgroundColor: colors.primary + '15' }]}>
                                    <Text style={[styles.modalAvatarText, { color: colors.primary }]}>
                                        {getInitials(editForm.firstName, editForm.lastName)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="camera" size={16} color={colors.primary} />
                                <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
                            </TouchableOpacity>
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
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Phone Number</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingContent: { alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14 },
    header: { paddingTop: 60, paddingBottom: 35, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    headerActions: { flexDirection: 'row', gap: 12 },
    headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    profileMain: { alignItems: 'center', paddingHorizontal: 20 },
    avatarContainer: { position: 'relative', marginBottom: 18 },
    avatarRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
    avatar: { width: 108, height: 108, borderRadius: 54, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, fontWeight: 'bold' },
    editAvatarBtn: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    userName: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
    userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
    roleContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    roleText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    content: { padding: 16, marginTop: -20 },
    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 16, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    quickActionItem: { alignItems: 'center', gap: 8 },
    quickActionIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    quickActionLabel: { fontSize: 12, fontWeight: '600' },
    statsCard: { borderRadius: 22, padding: 20, marginBottom: 16 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    statsTitle: { fontSize: 17, fontWeight: '700' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 18 },
    statBox: { alignItems: 'center', flex: 1 },
    statIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statNumber: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 11 },
    statDivider: { width: 1, height: 55, backgroundColor: '#E5E7EB' },
    safetyProgressContainer: { paddingTop: 4 },
    safetyProgressBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    safetyProgressFill: { height: '100%', borderRadius: 4 },
    safetyProgressText: { fontSize: 12, textAlign: 'center' },
    achievementsCard: { borderRadius: 22, padding: 20, marginBottom: 16 },
    achievementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    achievementsBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.primary + '15' },
    achievementsBadgeText: { fontSize: 12, fontWeight: '600' },
    achievementsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    achievementItem: { alignItems: 'center', position: 'relative' },
    achievementIconContainer: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    achievementLabel: { fontSize: 11, fontWeight: '500' },
    achievementCheck: { position: 'absolute', top: 0, right: 8 },
    infoCard: { borderRadius: 22, padding: 20, marginBottom: 20 },
    infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    editLink: { fontSize: 14, fontWeight: '600' },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    infoIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoContent: { marginLeft: 14, flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, marginLeft: 4 },
    menuCard: { borderRadius: 22, marginBottom: 20, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    menuIconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    menuContent: { flex: 1, marginLeft: 14 },
    menuTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    menuDescription: { fontSize: 12 },
    menuBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
    menuBadgeText: { fontSize: 11, fontWeight: '600' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, borderWidth: 1.5, marginBottom: 20 },
    logoutIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    logoutText: { flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 14 },
    logoutArrow: { marginLeft: 'auto' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 8 },
    footerText: { fontSize: 12 },
    versionInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    versionText: { fontSize: 12 },
    versionDot: { fontSize: 12 },
    bottomPadding: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '700' },
    closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    modalAvatarSection: { alignItems: 'center', marginBottom: 28 },
    modalAvatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    modalAvatar: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
    modalAvatarText: { fontSize: 32, fontWeight: 'bold' },
    changePhotoBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    changePhotoText: { fontSize: 13, fontWeight: '600' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8, color: '#666' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 54, gap: 12 },
    input: { flex: 1, fontSize: 16 },
    modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
    cancelButton: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    cancelButtonText: { fontSize: 15, fontWeight: '600' },
    saveButton: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center' },
    saveButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ProfileScreen;
