import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import databaseService from '../services/databaseService';

const NotificationScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();

    const [notifications, setNotifications] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await databaseService.getNotifications(userId);
            if (response.success) {
                setNotifications(response.data || []);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await loadNotifications();
        setIsRefreshing(false);
    };

    const markAsRead = async (notificationId) => {
        try {
            await databaseService.markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await databaseService.deleteNotification(notificationId);
                            setNotifications(prev => prev.filter(n => n.id !== notificationId));
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                        }
                    },
                },
            ]
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'emergency': return { name: 'warning', color: colors.error };
            case 'family': return { name: 'people', color: colors.success };
            case 'system': return { name: 'information-circle', color: colors.info };
            default: return { name: 'notifications', color: colors.primary };
        }
    };

    const renderNotification = (notification) => {
        const icon = getNotificationIcon(notification.type);
        return (
            <TouchableOpacity
                key={notification.id}
                style={[
                    styles.notificationCard,
                    {
                        backgroundColor: notification.isRead ? colors.card : colors.primary + '10',
                        borderRadius,
                        ...shadows.small,
                    },
                ]}
                onPress={() => markAsRead(notification.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
                    <Text style={[styles.message, { color: colors.gray }]}>{notification.message}</Text>
                    <Text style={[styles.timestamp, { color: colors.gray }]}>
                        {new Date(notification.timestamp).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={[styles.headerTitle, { color: colors.white }]}>Notifications</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                {notifications.length > 0 ? (
                    <View style={styles.notificationsList}>
                        {notifications.map(renderNotification)}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.gray} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
                            You don't have any notifications yet
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 48,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    notificationsList: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    message: {
        fontSize: 14,
        marginTop: 4,
    },
    timestamp: {
        fontSize: 12,
        marginTop: 8,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        marginTop: 48,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default NotificationScreen;
