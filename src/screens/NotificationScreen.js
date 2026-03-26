import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const NotificationScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const notifications = [
        { id: 1, type: 'emergency', title: 'Emergency Alert', message: 'SOS alert sent to emergency contacts', time: '2 min ago', unread: true },
        { id: 2, type: 'family', title: 'Family Update', message: 'Family location updated successfully', time: '15 min ago', unread: true },
        { id: 3, type: 'system', title: 'Security Alert', message: 'New device login detected', time: '1 hour ago', unread: false },
        { id: 4, type: 'info', title: 'Safety Tip', message: 'Check out our new safety tutorial', time: '2 hours ago', unread: false },
        { id: 5, type: 'family', title: 'Live Share', message: 'Live share session ended', time: '3 hours ago', unread: false },
    ];

    const getIcon = (type) => {
        const icons = { emergency: 'warning', family: 'people', system: 'shield', info: 'information-circle' };
        const colors_map = { emergency: '#EF4444', family: '#10B981', system: '#3B82F6', info: '#8B5CF6' };
        return { icon: icons[type] || 'notifications', color: colors_map[type] || colors.primary };
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerSubtitle}>{notifications.filter(n => n.unread).length} unread</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-outline" size={64} color={colors.gray + '50'} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.gray }]}>You're all caught up!</Text>
                    </View>
                ) : (
                    notifications.map((item) => {
                        const { icon, color } = getIcon(item.type);
                        return (
                            <TouchableOpacity key={item.id} style={[styles.notifCard, { backgroundColor: item.unread ? color + '08' : colors.card, ...shadows.sm }]}>
                                <View style={[styles.notifIcon, { backgroundColor: color + '15' }]}>
                                    <Ionicons name={icon} size={22} color={color} />
                                </View>
                                <View style={styles.notifContent}>
                                    <View style={styles.notifHeader}>
                                        <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                                        {item.unread && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                                    </View>
                                    <Text style={[styles.notifMessage, { color: colors.gray }]}>{item.message}</Text>
                                    <Text style={[styles.notifTime, { color: colors.gray }]}>{item.time}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtitle: { fontSize: 14, marginTop: 4 },
    notifCard: { flexDirection: 'row', padding: 14, borderRadius: 16, marginBottom: 12 },
    notifIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    notifContent: { flex: 1, marginLeft: 14 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    notifTitle: { fontSize: 15, fontWeight: '600' },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    notifMessage: { fontSize: 13, marginTop: 4, lineHeight: 18 },
    notifTime: { fontSize: 11, marginTop: 6 },
    bottomPadding: { height: 30 },
});

export default NotificationScreen;
