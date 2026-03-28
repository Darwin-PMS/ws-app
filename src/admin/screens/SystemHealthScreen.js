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

const SystemHealthScreen = ({ navigation }) => {
    const { colors, borderRadius, shadows } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [healthData, setHealthData] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadHealthData = useCallback(async () => {
        try {
            const response = await adminService.getSystemHealth();
            if (response.success) {
                setHealthData(response.health || response);
                setLastUpdated(new Date());
            } else {
                setHealthData(response);
            }
        } catch (error) {
            console.log('Error loading system health:', error);
            setHealthData({
                status: 'error',
                message: 'Failed to load system health data',
                error: error.message,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHealthData();
    }, [loadHealthData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHealthData();
    };

    const getStatusColor = (status) => {
        const statusColors = {
            healthy: '#4CAF50',
            warning: '#FF9800',
            error: '#EF4444',
            degraded: '#FF9800',
            down: '#EF4444',
            up: '#4CAF50',
        };
        return statusColors[status?.toLowerCase()] || '#6B7280';
    };

    const getStatusIcon = (status) => {
        const icons = {
            healthy: 'checkmark-circle',
            warning: 'warning',
            error: 'close-circle',
            degraded: 'alert-circle',
            down: 'close-circle',
            up: 'checkmark-circle',
        };
        return icons[status?.toLowerCase()] || 'help-circle';
    };

    const renderStatusCard = (title, status, details) => {
        const statusColor = getStatusColor(status);
        return (
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
                <View style={styles.statusHeader}>
                    <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
                        <Ionicons name={getStatusIcon(status)} size={24} color={statusColor} />
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusTitle, { color: colors.text }]}>{title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                {status?.toUpperCase() || 'UNKNOWN'}
                            </Text>
                        </View>
                    </View>
                </View>
                {details && (
                    <View style={styles.statusDetails}>
                        {Object.entries(details).map(([key, value]) => (
                            <View key={key} style={styles.detailRow}>
                                <Text style={[styles.detailKey, { color: colors.textSecondary }]}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {typeof value === 'object' ? JSON.stringify(value) : value?.toString() || 'N/A'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderMetricCard = (title, value, icon, color, subtitle) => (
        <View style={[styles.metricCard, { backgroundColor: colors.card, borderRadius, ...shadows.sm }]}>
            <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle && <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
    );

    const renderServiceList = () => {
        if (!healthData?.services) return null;

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
                {Object.entries(healthData.services).map(([serviceName, serviceData]) => {
                    const serviceStatus = typeof serviceData === 'object' ? serviceData.status : serviceData;
                    const serviceDetails = typeof serviceData === 'object' ? serviceData : null;
                    return renderStatusCard(
                        serviceName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                        serviceStatus,
                        serviceDetails
                    );
                })}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading system health...</Text>
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
                    <Ionicons name="server" size={28} color="#fff" />
                    <Text style={styles.headerTitle}>System Health</Text>
                </View>
                {lastUpdated && (
                    <Text style={styles.lastUpdated}>
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </Text>
                )}
            </View>

            {healthData?.status && (
                <View style={[styles.overallStatus, { backgroundColor: getStatusColor(healthData.status) + '20' }]}>
                    <Ionicons name={getStatusIcon(healthData.status)} size={32} color={getStatusColor(healthData.status)} />
                    <View style={styles.overallStatusInfo}>
                        <Text style={[styles.overallStatusTitle, { color: colors.text }]}>
                            System Status: {healthData.status?.toUpperCase()}
                        </Text>
                        {healthData.message && (
                            <Text style={[styles.overallStatusMessage, { color: colors.textSecondary }]}>
                                {healthData.message}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            <View style={styles.metricsGrid}>
                {renderMetricCard(
                    'Uptime',
                    healthData?.uptime?.days ? `${healthData.uptime.days}d ${healthData.uptime.hours}h` : 'N/A',
                    'time',
                    '#3B82F6',
                    healthData?.uptime?.start_date ? `Since ${new Date(healthData.uptime.start_date).toLocaleDateString()}` : null
                )}
                {renderMetricCard(
                    'CPU Usage',
                    healthData?.cpu?.usage ? `${healthData.cpu.usage}%` : 'N/A',
                    'hardware-chip',
                    healthData?.cpu?.usage > 80 ? '#EF4444' : '#4CAF50',
                    healthData?.cpu?.cores ? `${healthData.cpu.cores} cores` : null
                )}
                {renderMetricCard(
                    'Memory',
                    healthData?.memory?.used ? `${Math.round(healthData.memory.used / 1024 / 1024 / 1024)}GB` : 'N/A',
                    'memory',
                    healthData?.memory?.percent > 80 ? '#EF4444' : '#4CAF50',
                    healthData?.memory?.total ? `of ${Math.round(healthData.memory.total / 1024 / 1024 / 1024)}GB` : null
                )}
                {renderMetricCard(
                    'Database',
                    healthData?.database?.status === 'connected' ? 'Connected' : 'N/A',
                    'server',
                    healthData?.database?.status === 'connected' ? '#4CAF50' : '#EF4444',
                    healthData?.database?.response_time ? `${healthData.database.response_time}ms` : null
                )}
            </View>

            {renderServiceList()}

            {healthData?.database && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Database</Text>
                    {renderStatusCard('Database Connection', healthData.database.status, {
                        host: healthData.database.host,
                        database: healthData.database.database,
                        response_time: healthData.database.response_time ? `${healthData.database.response_time}ms` : null,
                        connections: healthData.database.connections,
                    })}
                </View>
            )}

            {healthData?.api && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>API</Text>
                    {renderStatusCard('API Status', healthData.api.status, {
                        version: healthData.api.version,
                        endpoints: healthData.api.endpoints,
                        avg_response_time: healthData.api.avg_response_time ? `${healthData.api.avg_response_time}ms` : null,
                    })}
                </View>
            )}

            {healthData?.error && (
                <View style={[styles.errorCard, { backgroundColor: '#FEE2E2', borderRadius }]}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    <Text style={[styles.errorText, { color: '#EF4444' }]}>{healthData.error}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
                onPress={onRefresh}
            >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { padding: 20, paddingTop: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    lastUpdated: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
    overallStatus: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, borderRadius: 12 },
    overallStatusInfo: { flex: 1, marginLeft: 14 },
    overallStatusTitle: { fontSize: 16, fontWeight: '600' },
    overallStatusMessage: { fontSize: 13, marginTop: 4 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
    metricCard: { width: '48%', padding: 16, alignItems: 'center', margin: 4 },
    metricIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    metricValue: { fontSize: 20, fontWeight: '700' },
    metricTitle: { fontSize: 12, marginTop: 4 },
    metricSubtitle: { fontSize: 10, marginTop: 2 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    statusCard: { padding: 16, marginBottom: 12 },
    statusHeader: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statusInfo: { flex: 1, marginLeft: 14 },
    statusTitle: { fontSize: 16, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },
    statusDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailKey: { fontSize: 13 },
    detailValue: { fontSize: 13, fontWeight: '500' },
    errorCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, gap: 12 },
    errorText: { flex: 1, fontSize: 14 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 14, borderRadius: 12, gap: 8 },
    refreshBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SystemHealthScreen;
