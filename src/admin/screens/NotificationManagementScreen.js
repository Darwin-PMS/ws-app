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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const NotificationManagementScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [composeType, setComposeType] = useState('broadcast');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadNotifications = useCallback(async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
            };

            const response = await adminService.getAllNotifications(params);
            if (response.success) {
                const newNotifications = response.notifications || response.data || [];
                setNotifications(resetPage ? newNotifications : (prev) => [...prev, ...newNotifications]);
                setHasMore(newNotifications.length === 20);
                setPage(currentPage);
            }
        } catch (error) {
            console.log('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadNotifications(true);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(page + 1);
            loadNotifications(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notificationTitle.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!notificationBody.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return;
        }

        const notification = {
            title: notificationTitle,
            body: notificationBody,
            data: { type: 'admin_notification' },
        };

        setSending(true);
        try {
            let response;
            if (composeType === 'broadcast') {
                response = await adminService.broadcastNotification(notification);
            } else if (selectedUser?.id) {
                response = await adminService.sendNotification(selectedUser.id, notification);
            } else {
                Alert.alert('Error', 'Please select a user');
                setSending(false);
                return;
            }

            if (response.success) {
                Alert.alert('Success', composeType === 'broadcast' ? 'Broadcast sent successfully!' : 'Notification sent successfully!');
                setShowComposeModal(false);
                setNotificationTitle('');
                setNotificationBody('');
                setSelectedUser(null);
                loadNotifications(true);
            } else {
                Alert.alert('Error', response.message || 'Failed to send notification');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send notification');
        }
        setSending(false);
    };

    const renderNotification = ({ item }) => (
        <View style={[styles.notificationCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
            <View style={styles.notificationHeader}>
                <View style={[styles.notificationIcon, { backgroundColor: (item.is_broadcast ? '#8B5CF6' : '#3B82F6') + '20' }]}>
                    <Ionicons 
                        name={item.is_broadcast ? 'megaphone' : 'person'} 
                        size={20} 
                        color={item.is_broadcast ? '#8B5CF6' : '#3B82F6'} 
                    />
                </View>
                <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title || 'Notification'}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: (item.is_broadcast ? '#8B5CF6' : '#3B82F6') + '20' }]}>
                        <Text style={[styles.typeText, { color: item.is_broadcast ? '#8B5CF6' : '#3B82F6' }]}>
                            {item.is_broadcast ? 'Broadcast' : 'Individual'}
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.body || item.message || 'No content'}
            </Text>

            <View style={styles.notificationMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </Text>
                </View>
                {item.user_name && (
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {item.user_name}
                        </Text>
                    </View>
                )}
                {item.sent_count && (
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {item.sent_count} sent
                        </Text>
                    </View>
                )}
            </View>

            {item.read !== undefined && (
                <View style={[styles.readBadge, { backgroundColor: item.read ? '#4CAF5020' : '#FF980020' }]}>
                    <Text style={[styles.readText, { color: item.read ? '#4CAF50' : '#FF9800' }]}>
                        {item.read ? 'Read' : 'Unread'}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderComposeModal = () => (
        <Modal visible={showComposeModal} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.modalContainer, { backgroundColor: colors.background }]}
            >
                <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        Send Notification
                    </Text>
                    <TouchableOpacity onPress={() => setShowComposeModal(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeOption,
                                { 
                                    backgroundColor: composeType === 'broadcast' ? colors.primary : colors.card,
                                    borderColor: composeType === 'broadcast' ? colors.primary : colors.border,
                                }
                            ]}
                            onPress={() => setComposeType('broadcast')}
                        >
                            <Ionicons 
                                name="megaphone" 
                                size={24} 
                                color={composeType === 'broadcast' ? '#fff' : colors.text} 
                            />
                            <Text style={[
                                styles.typeOptionText, 
                                { color: composeType === 'broadcast' ? '#fff' : colors.text }
                            ]}>
                                Broadcast
                            </Text>
                            <Text style={[
                                styles.typeOptionDesc, 
                                { color: composeType === 'broadcast' ? '#fff' : colors.textSecondary }
                            ]}>
                                Send to all users
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeOption,
                                { 
                                    backgroundColor: composeType === 'individual' ? colors.primary : colors.card,
                                    borderColor: composeType === 'individual' ? colors.primary : colors.border,
                                }
                            ]}
                            onPress={() => setComposeType('individual')}
                        >
                            <Ionicons 
                                name="person" 
                                size={24} 
                                color={composeType === 'individual' ? '#fff' : colors.text} 
                            />
                            <Text style={[
                                styles.typeOptionText, 
                                { color: composeType === 'individual' ? '#fff' : colors.text }
                            ]}>
                                Individual
                            </Text>
                            <Text style={[
                                styles.typeOptionDesc, 
                                { color: composeType === 'individual' ? '#fff' : colors.textSecondary }
                            ]}>
                                Send to specific user
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {composeType === 'individual' && (
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>User ID or Email</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter user ID or email"
                                placeholderTextColor={colors.textSecondary}
                                value={selectedUser?.id?.toString() || ''}
                                onChangeText={(text) => {
                                    const userId = parseInt(text);
                                    if (!isNaN(userId)) {
                                        setSelectedUser({ id: userId });
                                    }
                                }}
                            />
                        </View>
                    )}

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter notification title"
                            placeholderTextColor={colors.textSecondary}
                            value={notificationTitle}
                            onChangeText={setNotificationTitle}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter notification message"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={notificationBody}
                            onChangeText={setNotificationBody}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSendNotification}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#fff" />
                                <Text style={styles.sendBtnText}>
                                    {composeType === 'broadcast' ? 'Send Broadcast' : 'Send Notification'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={[styles.templatesCard, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.templatesTitle, { color: colors.text }]}>Quick Templates</Text>
                        <View style={styles.templateButtons}>
                            <TouchableOpacity
                                style={[styles.templateBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                    setNotificationTitle('Safety Reminder');
                                    setNotificationBody('Remember to share your live location with family when traveling.');
                                }}
                            >
                                <Text style={[styles.templateBtnText, { color: colors.primary }]}>Safety Reminder</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.templateBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                    setNotificationTitle('App Update');
                                    setNotificationBody('A new version of the app is available with improved features.');
                                }}
                            >
                                <Text style={[styles.templateBtnText, { color: colors.primary }]}>App Update</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.templateBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                    setNotificationTitle('Emergency Alert');
                                    setNotificationBody('Please check your emergency contacts are up to date.');
                                }}
                            >
                                <Text style={[styles.templateBtnText, { color: colors.error }]}>Emergency</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );

    if (loading && notifications.length === 0) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id?.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications found</Text>
                        </View>
                    }
                    ListFooterComponent={
                        loading && notifications.length > 0 ? (
                            <ActivityIndicator style={styles.footer} color={colors.primary} />
                        ) : null
                    }
                />
            </View>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowComposeModal(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {renderComposeModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    notificationCard: { padding: 14, marginBottom: 12 },
    notificationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    notificationIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    notificationInfo: { flex: 1, marginLeft: 12 },
    notificationTitle: { fontSize: 15, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
    typeText: { fontSize: 10, fontWeight: '600' },
    notificationBody: { fontSize: 13, marginTop: 10, lineHeight: 18 },
    notificationMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12 },
    readBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
    readText: { fontSize: 10, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12 },
    footer: { paddingVertical: 20 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalContent: { padding: 16 },
    typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    typeOption: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    typeOptionText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    typeOptionDesc: { fontSize: 11, marginTop: 4, textAlign: 'center' },
    inputContainer: { padding: 16, marginBottom: 12 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: { fontSize: 15, padding: 12, borderRadius: 8, borderWidth: 1 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    templatesCard: { padding: 16, marginTop: 20 },
    templatesTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    templateButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    templateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    templateBtnText: { fontSize: 12, fontWeight: '500' },
});

export default NotificationManagementScreen;
