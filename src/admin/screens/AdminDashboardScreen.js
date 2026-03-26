import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import adminService from '../services/adminService';

const AdminDashboardScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const { userName } = useApp();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalFamilies: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        totalGrievances: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            const response = await adminService.getDashboardStats();
            if (response.success && response.stats) {
                const s = response.stats;
                setStats({
                    totalUsers: s.totalUsers || 0,
                    activeUsers: s.activeUsers || s.totalUsers || 0,
                    totalFamilies: s.totalFamilies || 0,
                    activeAlerts: s.activeAlerts || 0,
                    resolvedAlerts: s.resolvedAlerts || 0,
                    totalGrievances: s.totalGrievances || 0,
                });
            }
        } catch (error) {
            console.log('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleNavigation = (screen, params = {}) => {
        if (params && Object.keys(params).length > 0) {
            navigation.navigate(screen, params);
        } else {
            navigation.navigate(screen);
        }
    };

    const StatCard = ({ title, value, icon, color, onPress }) => (
        <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </TouchableOpacity>
    );

    const MenuCard = ({ title, subtitle, icon, color, screen, badge }) => (
        <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
            onPress={() => handleNavigation(screen)}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            </View>
            {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Admin Dashboard</Text>
                        <Text style={styles.subGreeting}>Welcome, {userName?.split(' ')[0] || 'Admin'}!</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => handleNavigation('AdminDashboard')}>
                        <Ionicons name="person" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon="people"
                        color="#3B82F6"
                        onPress={() => handleNavigation('UserManagement')}
                    />
                    <StatCard
                        title="Active Users"
                        value={stats.activeUsers}
                        icon="person"
                        color="#10B981"
                        onPress={() => handleNavigation('UserManagement')}
                    />
                    <StatCard
                        title="Families"
                        value={stats.totalFamilies}
                        icon="people-circle"
                        color="#8B5CF6"
                        onPress={() => handleNavigation('FamilyManagement')}
                    />
                    <StatCard
                        title="Active Alerts"
                        value={stats.activeAlerts}
                        icon="warning"
                        color="#EF4444"
                        onPress={() => handleNavigation('SOSManagement')}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
                <View style={styles.menuList}>
                    <MenuCard
                        title="User Management"
                        subtitle="Manage all users & permissions"
                        icon="people-outline"
                        color="#3B82F6"
                        screen="UserManagement"
                    />
                    <MenuCard
                        title="Family Management"
                        subtitle="View & manage families"
                        icon="people-circle-outline"
                        color="#8B5CF6"
                        screen="FamilyManagement"
                    />
                    <MenuCard
                        title="SOS Alerts"
                        subtitle="Monitor emergency alerts"
                        icon="alert-circle-outline"
                        color="#EF4444"
                        screen="SOSManagement"
                        badge={stats.activeAlerts}
                    />
                    <MenuCard
                        title="Live Tracking"
                        subtitle="Track user locations"
                        icon="locate-outline"
                        color="#10B981"
                        screen="AdminLiveTracking"
                    />
                    <MenuCard
                        title="Grievance Reports"
                        subtitle="Handle user complaints"
                        icon="document-text-outline"
                        color="#F59E0B"
                        screen="GrievanceManagement"
                        badge={stats.totalGrievances}
                    />
                    <MenuCard
                        title="Activity Logs"
                        subtitle="View system activity"
                        icon="list-outline"
                        color="#6B7280"
                        screen="ActivityLogs"
                    />
                    <MenuCard
                        title="Notifications"
                        subtitle="Send broadcast messages"
                        icon="notifications-outline"
                        color="#EC4899"
                        screen="NotificationManagement"
                    />
                    <MenuCard
                        title="System Health"
                        subtitle="Monitor system status"
                        icon="server-outline"
                        color="#14B8A6"
                        screen="SystemHealth"
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, marginTop: 8 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { width: '47%', padding: 16, alignItems: 'center' },
    statIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 28, fontWeight: 'bold' },
    statTitle: { fontSize: 12, marginTop: 4 },
    menuList: { gap: 12, marginBottom: 20 },
    menuCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    menuIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuContent: { flex: 1, marginLeft: 12 },
    menuTitle: { fontSize: 16, fontWeight: '600' },
    menuSubtitle: { fontSize: 12, marginTop: 2 },
    badge: { minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default AdminDashboardScreen;
