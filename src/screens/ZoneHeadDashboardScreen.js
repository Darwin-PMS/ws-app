import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import zoneService from '../services/zoneService';

const ZoneHeadDashboardScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const { userId } = useApp();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myZone, setMyZone] = useState(null);
    const [sosAlerts, setSOSAlerts] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        pendingAlerts: 0,
        resolvedAlerts: 0,
    });

    const loadData = useCallback(async () => {
        try {
            const [zoneRes, alertsRes, analyticsRes] = await Promise.all([
                zoneService.getMyPrimaryZone(),
                zoneService.getMyZoneSOSAlerts({ limit: 5 }),
                // We'll get analytics after we have the zone
            ]);

            if (zoneRes.success) {
                const zone = zoneRes.data;
                setMyZone(zone);
                
                // Load analytics for this zone if we have a zone
                if (zone && zone.id) {
                    try {
                        const analyticsData = await zoneService.getZoneAnalytics(zone.id);
                        if (analyticsData.success) {
                            const analytics = analyticsData.analytics || analyticsData;
                            setStats({
                                totalUsers: analytics.total_users || 0,
                                activeUsers: analytics.active_users || 0,
                                pendingAlerts: analytics.pending_sos || 0,
                                resolvedAlerts: analytics.resolved_sos || 0,
                            });
                        }
                    } catch (analyticsError) {
                        console.log('Error loading analytics:', analyticsError);
                        setStats({
                            totalUsers: 0,
                            activeUsers: 0,
                            pendingAlerts: 0,
                            resolvedAlerts: 0,
                        });
                    }
                }
            }
            
            if (alertsRes.success) {
                const alerts = alertsRes.data || [];
                setSOSAlerts(alerts);
                // Only update pending/resolved if we didn't get analytics
                if (!myZone?.id) {
                    const pending = alerts.filter(a => a.status === 'active' || a.status === 'open').length;
                    setStats(prev => ({
                        ...prev,
                        pendingAlerts: prev.pendingAlerts || pending,
                        resolvedAlerts: prev.resolvedAlerts || (alerts.length - pending),
                    }));
                }
            }
        } catch (error) {
            console.log('Error loading zone data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getMockAlerts = () => [
        { id: '1', user_name: 'Sarah J.', type: 'harassment', status: 'active', created_at: '2026-03-28T10:30:00Z', address: 'Main Street, North District' },
        { id: '2', user_name: 'Emily C.', type: 'emergency', status: 'active', created_at: '2026-03-28T09:15:00Z', address: 'Park Avenue' },
        { id: '3', user_name: 'Maria G.', type: 'suspicious', status: 'resolved', created_at: '2026-03-27T18:00:00Z', address: 'Market Road' },
    ];

    const getAlertTypeColor = (type) => {
        const colors = {
            harassment: '#F59E0B',
            emergency: '#EF4444',
            suspicious: '#3B82F6',
            other: '#6B7280',
        };
        return colors[type?.toLowerCase()] || colors.other;
    };

    const getAlertTypeLabel = (type) => {
        const labels = {
            harassment: 'Harassment',
            emergency: 'Emergency',
            suspicious: 'Suspicious Activity',
            other: 'Other',
        };
        return labels[type?.toLowerCase()] || 'Other';
    };

    const renderStatCard = (title, value, subtitle, icon, color) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <Ionicons name="map" size={28} color="#fff" />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>My Zone</Text>
                        <Text style={styles.headerSubtitle}>{myZone?.name || 'Not assigned'}</Text>
                    </View>
                </View>
                {myZone && (
                    <View style={styles.zoneInfo}>
                        <View style={styles.zoneInfoItem}>
                            <Ionicons name="code-slash" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.zoneInfoText}>{myZone.code}</Text>
                        </View>
                        <View style={styles.zoneInfoItem}>
                            <Ionicons name="radio-button-on" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.zoneInfoText}>{myZone.radius_km} km radius</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.statsGrid}>
                {renderStatCard('Total Users', stats.totalUsers, 'In zone', 'people', '#3B82F6')}
                {renderStatCard('Active', stats.activeUsers, 'Online now', 'pulse', '#10B981')}
                {renderStatCard('Pending SOS', stats.pendingAlerts, 'Need attention', 'warning', '#EF4444')}
                {renderStatCard('Resolved', stats.resolvedAlerts, 'This month', 'checkmark-circle', '#4CAF50')}
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent SOS Alerts</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('WomenSafety')}>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                    </TouchableOpacity>
                </View>

                {sosAlerts.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                        <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent alerts</Text>
                    </View>
                ) : (
                    sosAlerts.map((alert) => (
                        <TouchableOpacity
                            key={alert.id}
                            style={[styles.alertCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                            onPress={() => navigation.navigate('WomenSafety')}
                        >
                            <View style={[styles.alertIcon, { backgroundColor: getAlertTypeColor(alert.type) + '20' }]}>
                                <Ionicons
                                    name={alert.status === 'active' ? 'warning' : 'checkmark-circle'}
                                    size={22}
                                    color={alert.status === 'active' ? getAlertTypeColor(alert.type) : '#4CAF50'}
                                />
                            </View>
                            <View style={styles.alertInfo}>
                                <View style={styles.alertHeader}>
                                    <Text style={[styles.alertUser, { color: colors.text }]}>{alert.user_name}</Text>
                                    <View style={[styles.alertBadge, { backgroundColor: getAlertTypeColor(alert.type) + '20' }]}>
                                        <Text style={[styles.alertBadgeText, { color: getAlertTypeColor(alert.type) }]}>
                                            {getAlertTypeLabel(alert.type)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.alertAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {alert.address}
                                </Text>
                                <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
                                    {new Date(alert.created_at).toLocaleString()}
                                </Text>
                            </View>
                            {alert.status === 'active' && (
                                <View style={[styles.activeDot, { backgroundColor: '#EF4444' }]} />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                        onPress={() => navigation.navigate('WomenSafety')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#EF444420' }]}>
                            <Ionicons name="warning" size={24} color="#EF4444" />
                        </View>
                        <Text style={[styles.quickActionText, { color: colors.text }]}>View SOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                        onPress={() => navigation.navigate('Family')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
                            <Ionicons name="people" size={24} color="#3B82F6" />
                        </View>
                        <Text style={[styles.quickActionText, { color: colors.text }]}>Zone Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                        onPress={() => navigation.navigate('Grievance')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
                            <Ionicons name="document-text" size={24} color="#F59E0B" />
                        </View>
                        <Text style={[styles.quickActionText, { color: colors.text }]}>Grievances</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}
                        onPress={() => navigation.navigate('AIChat')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF620' }]}>
                            <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.quickActionText, { color: colors.text }]}>AI Chat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    zoneInfo: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    zoneInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    zoneInfoText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
    statCard: { width: '47%', padding: 16, alignItems: 'center', margin: 4 },
    statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: '700' },
    statTitle: { fontSize: 12, marginTop: 4 },
    statSubtitle: { fontSize: 10 },
    section: { padding: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    alertCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, position: 'relative' },
    alertIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    alertInfo: { flex: 1, marginLeft: 12 },
    alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    alertUser: { fontSize: 15, fontWeight: '600' },
    alertBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    alertBadgeText: { fontSize: 10, fontWeight: '600' },
    alertAddress: { fontSize: 12, marginTop: 4 },
    alertTime: { fontSize: 11, marginTop: 4 },
    activeDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: 14, right: 14 },
    emptyCard: { padding: 32, alignItems: 'center' },
    emptyText: { fontSize: 14, marginTop: 12 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    quickAction: { width: '47%', padding: 16, alignItems: 'center' },
    quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickActionText: { fontSize: 13, fontWeight: '600' },
});

export default ZoneHeadDashboardScreen;
