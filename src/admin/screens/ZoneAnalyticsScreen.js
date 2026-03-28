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
import { useTheme } from '../../context/ThemeContext';
import adminService from '../services/adminService';

const ZoneAnalyticsScreen = ({ route, navigation }) => {
    const { zoneId, zone: initialZone } = route.params || {};
    const { colors, borderRadius, shadows } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [zone, setZone] = useState(initialZone || {});

    const loadAnalytics = useCallback(async () => {
        try {
            const response = await adminService.getZoneAnalytics(zoneId);
            if (response.success) {
                setAnalytics(response.analytics || response.data);
            }
        } catch (error) {
            console.log('Error loading zone analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [zoneId]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAnalytics();
    };

    const getMockAnalytics = () => ({
        total_users: 45,
        active_users: 32,
        total_sos_alerts: 12,
        resolved_sos: 10,
        pending_sos: 2,
        total_grievances: 8,
        resolved_grievances: 6,
        daily_active_users: [
            { date: '2026-03-22', count: 28 },
            { date: '2026-03-23', count: 32 },
            { date: '2026-03-24', count: 30 },
            { date: '2026-03-25', count: 35 },
            { date: '2026-03-26', count: 31 },
            { date: '2026-03-27', count: 33 },
            { date: '2026-03-28', count: 32 },
        ],
        sos_by_type: {
            harassment: 4,
            emergency: 3,
            suspicious: 3,
            other: 2,
        },
        user_distribution: {
            women: 20,
            parents: 10,
            guardians: 8,
            zone_head: 2,
            supervisors: 5,
        },
    });

    const renderStatCard = (title, value, subtitle, icon, color) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
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
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
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
                    <Ionicons name="stats-chart" size={24} color="#fff" />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{zone.name || 'Zone'} Analytics</Text>
                        <Text style={styles.headerSubtitle}>Performance overview</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsGrid}>
                {renderStatCard('Total Users', analytics?.total_users || 0, 'Registered', 'people', '#3B82F6')}
                {renderStatCard('Active Users', analytics?.active_users || 0, 'This week', 'pulse', '#10B981')}
                {renderStatCard('SOS Alerts', analytics?.total_sos_alerts || 0, 'All time', 'warning', '#EF4444')}
                {(() => {
                    const total = analytics?.total_sos_alerts || 1;
                    const resolved = analytics?.resolved_sos || 0;
                    const pct = Math.round((resolved / total) * 100);
                    return renderStatCard('Resolved', resolved, pct + '%', 'checkmark-circle', '#4CAF50');
                })()}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>User Distribution</Text>
                <View style={[styles.distributionCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    {Object.entries(analytics?.user_distribution || {}).map(([key, value]) => {
                        const maxValue = Math.max(...Object.values(analytics?.user_distribution || { a: 1 }), 1);
                        const percentage = (value / maxValue) * 100;
                        return (
                            <View key={key} style={styles.distributionItem}>
                                <View style={styles.distributionLabelRow}>
                                    <Text style={[styles.distributionLabel, { color: colors.text }]}>
                                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Text>
                                    <Text style={[styles.distributionValue, { color: colors.text }]}>{value}</Text>
                                </View>
                                <View style={[styles.distributionBarBg, { backgroundColor: colors.border }]}>
                                    <View style={[styles.distributionBarFill, { backgroundColor: colors.primary, width: `${percentage}%` }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>SOS Alerts by Type</Text>
                <View style={[styles.sosCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    {Object.entries(analytics?.sos_by_type || {}).map(([key, value]) => {
                        const maxValue = Math.max(...Object.values(analytics?.sos_by_type || { a: 1 }), 1);
                        const percentage = (value / maxValue) * 100;
                        const color = key === 'emergency' ? '#EF4444' : key === 'harassment' ? '#F59E0B' : '#3B82F6';
                        return (
                            <View key={key} style={styles.sosItem}>
                                <View style={[styles.sosIcon, { backgroundColor: color + '20' }]}>
                                    <Ionicons name={key === 'emergency' ? 'warning' : key === 'harassment' ? 'shield' : 'alert-circle'} size={18} color={color} />
                                </View>
                                <View style={styles.sosInfo}>
                                    <Text style={[styles.sosLabel, { color: colors.text }]}>
                                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Text>
                                    <View style={[styles.sosBarBg, { backgroundColor: colors.border }]}>
                                        <View style={[styles.sosBarFill, { backgroundColor: color, width: `${percentage}%` }]} />
                                    </View>
                                </View>
                                <Text style={[styles.sosCount, { color: colors.text }]}>{value}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Grievances</Text>
                <View style={styles.grievanceRow}>
                    <View style={[styles.grievanceCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                        <Ionicons name="document-text" size={24} color={colors.warning} />
                        <Text style={[styles.grievanceValue, { color: colors.text }]}>{analytics?.total_grievances || 0}</Text>
                        <Text style={[styles.grievanceLabel, { color: colors.textSecondary }]}>Total</Text>
                    </View>
                    <View style={[styles.grievanceCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        <Text style={[styles.grievanceValue, { color: colors.text }]}>{analytics?.resolved_grievances || 0}</Text>
                        <Text style={[styles.grievanceLabel, { color: colors.textSecondary }]}>Resolved</Text>
                    </View>
                    <View style={[styles.grievanceCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                        <Ionicons name="time" size={24} color={colors.warning} />
                        <Text style={[styles.grievanceValue, { color: colors.text }]}>
                            {(analytics?.total_grievances || 0) - (analytics?.resolved_grievances || 0)}
                        </Text>
                        <Text style={[styles.grievanceLabel, { color: colors.textSecondary }]}>Pending</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Active Users</Text>
                <View style={[styles.chartCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                    {(analytics?.daily_active_users || []).map((item, index) => {
                        const maxCount = Math.max(...(analytics?.daily_active_users || [{ count: 1 }]).map(d => d.count), 1);
                        const height = (item.count / maxCount) * 100;
                        return (
                            <View key={index} style={styles.chartBar}>
                                <View style={[styles.barContainer, { height: 100 }]}>
                                    <View style={[styles.barFill, { backgroundColor: colors.primary, height: `${height}%` }]} />
                                </View>
                                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                                    {new Date(item.date).toLocaleDateString('en', { weekday: 'short' })}
                                </Text>
                                <Text style={[styles.barValue, { color: colors.text }]}>{item.count}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { padding: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
    statCard: { width: '47%', padding: 16, alignItems: 'center', margin: 4 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: '700' },
    statTitle: { fontSize: 12, marginTop: 4 },
    statSubtitle: { fontSize: 10 },
    section: { padding: 16, paddingTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    distributionCard: { padding: 16 },
    distributionItem: { marginBottom: 12 },
    distributionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    distributionLabel: { fontSize: 13, fontWeight: '500' },
    distributionValue: { fontSize: 13, fontWeight: '600' },
    distributionBarBg: { height: 6, borderRadius: 3 },
    distributionBarFill: { height: '100%', borderRadius: 3 },
    sosCard: { padding: 16 },
    sosItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    sosIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    sosInfo: { flex: 1, marginLeft: 12 },
    sosLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
    sosBarBg: { height: 6, borderRadius: 3 },
    sosBarFill: { height: '100%', borderRadius: 3 },
    sosCount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
    grievanceRow: { flexDirection: 'row', gap: 12 },
    grievanceCard: { flex: 1, padding: 16, alignItems: 'center' },
    grievanceValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
    grievanceLabel: { fontSize: 11, marginTop: 4 },
    chartCard: { padding: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    chartBar: { flex: 1, alignItems: 'center' },
    barContainer: { width: 24, justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 4 },
    barLabel: { fontSize: 10, marginTop: 8 },
    barValue: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});

export default ZoneAnalyticsScreen;
