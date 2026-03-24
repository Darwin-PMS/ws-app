// Behavior Pattern Screen
// AI-powered behavioral pattern analysis and anomaly detection for women safety
// Monitors user routines and detects anomalies

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    ActivityIndicator,
    FlatList,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import behaviorAnalysisService, { ANOMALY_TYPES } from '../services/behaviorAnalysisService';

const BehaviorPatternScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [settings, setSettings] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [routines, setRoutines] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load settings
            const settingsData = await behaviorAnalysisService.getSettings();
            setSettings(settingsData);
            setIsMonitoring(settingsData.monitoringEnabled);

            // Load summary
            const summaryData = await behaviorAnalysisService.getBehaviorSummary();
            setSummary(summaryData);

            // Load recent anomalies
            const anomaliesData = await behaviorAnalysisService.getAnomalies(20);
            setAnomalies(anomaliesData);

            // Load routines
            const routinesData = behaviorAnalysisService.getUserRoutines();
            setRoutines(routinesData);
        } catch (error) {
            console.error('Load data error:', error);
            Alert.alert('Error', 'Failed to load behavior data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    // Toggle monitoring
    const toggleMonitoring = async () => {
        try {
            if (isMonitoring) {
                await behaviorAnalysisService.stopMonitoring();
                setIsMonitoring(false);
            } else {
                const result = await behaviorAnalysisService.startMonitoring();
                if (result.success) {
                    setIsMonitoring(true);
                } else {
                    Alert.alert('Error', result.message);
                    return;
                }
            }

            // Update settings
            await behaviorAnalysisService.updateSettings({ monitoringEnabled: !isMonitoring });
            setSettings((prev) => ({ ...prev, monitoringEnabled: !isMonitoring }));

            // Reload summary
            const summaryData = await behaviorAnalysisService.getBehaviorSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error('Toggle monitoring error:', error);
            Alert.alert('Error', 'Failed to toggle monitoring');
        }
    };

    // Learn routine
    const handleLearnRoutine = async () => {
        Alert.alert(
            'Learn Routine',
            'This will analyze your movement patterns to learn your daily routines. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Learn',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const result = await behaviorAnalysisService.learnRoutine();
                            if (result.success) {
                                Alert.alert('Success', 'Routine learning completed!');
                                setRoutines(result.routines);
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        } catch (error) {
                            console.error('Learn routine error:', error);
                            Alert.alert('Error', 'Failed to learn routine');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // Clear anomalies
    const handleClearAnomalies = async () => {
        Alert.alert(
            'Clear Anomalies',
            'Are you sure you want to clear all anomaly history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await behaviorAnalysisService.clearAnomalies();
                        setAnomalies([]);
                        const summaryData = await behaviorAnalysisService.getBehaviorSummary();
                        setSummary(summaryData);
                    },
                },
            ]
        );
    };

    // Update settings
    const updateSetting = async (key, value) => {
        try {
            await behaviorAnalysisService.updateSettings({ [key]: value });
            setSettings((prev) => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Update setting error:', error);
        }
    };

    // Render risk badge
    const renderRiskBadge = (level) => {
        const badges = {
            low: { color: '#10B981', label: 'Low Risk' },
            medium: { color: '#F59E0B', label: 'Medium Risk' },
            high: { color: '#EF4444', label: 'High Risk' },
        };

        const badge = badges[level] || badges.low;

        return (
            <View style={[styles.riskBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.riskBadgeText}>{badge.label}</Text>
            </View>
        );
    };

    // Render anomaly item
    const renderAnomalyItem = ({ item }) => {
        const anomalyType = item.type;

        return (
            <View style={[styles.anomalyCard, { backgroundColor: colors.card }]}>
                <View style={styles.anomalyHeader}>
                    <View
                        style={[
                            styles.anomalyIcon,
                            { backgroundColor: anomalyType.color + '20' },
                        ]}
                    >
                        <Ionicons
                            name={anomalyType.icon}
                            size={24}
                            color={anomalyType.color}
                        />
                    </View>
                    <View style={styles.anomalyInfo}>
                        <Text style={[styles.anomalyTitle, { color: colors.text }]}>
                            {anomalyType.label}
                        </Text>
                        <Text style={[styles.anomalyTime, { color: colors.textSecondary }]}>
                            {new Date(item.timestamp).toLocaleString()}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.anomalyDescription, { color: colors.textSecondary }]}>
                    {anomalyType.description}
                </Text>
                {item.location && (
                    <View style={styles.locationInfo}>
                        <Ionicons name="location" size={14} color={colors.textSecondary} />
                        <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                            {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Tab buttons
    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'analytics' },
        { id: 'anomalies', label: 'Anomalies', icon: 'warning' },
        { id: 'routines', label: 'Routines', icon: 'git-network' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading behavior data...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Behavior Analysis</Text>
                    <Text style={styles.headerSubtitle}>AI-Powered Safety Monitoring</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.monitorButton,
                        { backgroundColor: isMonitoring ? '#EF4444' : '#10B981' },
                    ]}
                    onPress={toggleMonitoring}
                >
                    <Ionicons
                        name={isMonitoring ? 'pause' : 'play'}
                        size={20}
                        color="#FFFFFF"
                    />
                    <Text style={styles.monitorButtonText}>
                        {isMonitoring ? 'Stop' : 'Start'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tabButton,
                                activeTab === tab.id && {
                                    borderBottomColor: colors.primary,
                                    borderBottomWidth: 2,
                                },
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={18}
                                color={activeTab === tab.id ? colors.primary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    {
                                        color:
                                            activeTab === tab.id ? colors.primary : colors.textSecondary,
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <View style={styles.tabContent}>
                        {/* Status Card */}
                        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
                            <View style={styles.statusHeader}>
                                <Text style={[styles.statusTitle, { color: colors.text }]}>
                                    Safety Status
                                </Text>
                                {summary && renderRiskBadge(summary.riskLevel)}
                            </View>
                            <View style={styles.statusRow}>
                                <View style={styles.statusItem}>
                                    <Text style={[styles.statusValue, { color: colors.primary }]}>
                                        {summary?.riskScore || 0}
                                    </Text>
                                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                                        Risk Score
                                    </Text>
                                </View>
                                <View style={styles.statusItem}>
                                    <Text style={[styles.statusValue, { color: colors.primary }]}>
                                        {summary?.anomalyCount || 0}
                                    </Text>
                                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                                        Anomalies (24h)
                                    </Text>
                                </View>
                                <View style={styles.statusItem}>
                                    <Ionicons
                                        name={summary?.isMonitoring ? 'radio-button-on' : 'radio-button-off'}
                                        size={24}
                                        color={summary?.isMonitoring ? '#10B981' : colors.textSecondary}
                                    />
                                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                                        {summary?.isMonitoring ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <Ionicons name="git-branch" size={24} color="#EF4444" />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {summary?.routeDeviations || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Route Deviations
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <Ionicons name="pause-circle" size={24} color="#F59E0B" />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {summary?.unexpectedStops || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Unexpected Stops
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <Ionicons name="bed" size={24} color="#8B5CF6" />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {summary?.inactivityEvents || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Inactivity Events
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <Ionicons
                                    name={summary?.routinesLearned ? 'checkmark-circle' : 'help-circle'}
                                    size={24}
                                    color={summary?.routinesLearned ? '#10B981' : colors.textSecondary}
                                />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {summary?.routinesLearned ? 'Yes' : 'No'}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Routines Learned
                                </Text>
                            </View>
                        </View>

                        {/* Learn Routine Button */}
                        <TouchableOpacity
                            style={[styles.learnButton, { backgroundColor: colors.primary }]}
                            onPress={handleLearnRoutine}
                        >
                            <Ionicons name="school" size={20} color="#FFFFFF" />
                            <Text style={styles.learnButtonText}>Learn My Routines</Text>
                        </TouchableOpacity>

                        {/* Info Card */}
                        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                            <Ionicons name="information-circle" size={20} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                Behavior analysis monitors your movement patterns to detect anomalies
                                like unexpected stops, route deviations, and unusual inactivity for
                                enhanced safety.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Anomalies Tab */}
                {activeTab === 'anomalies' && (
                    <View style={styles.tabContent}>
                        <View style={styles.anomaliesHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Recent Anomalies
                            </Text>
                            <TouchableOpacity onPress={handleClearAnomalies}>
                                <Text style={[styles.clearText, { color: colors.primary }]}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {anomalies.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    No Anomalies Detected
                                </Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Your behavior patterns appear normal
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={anomalies}
                                renderItem={renderAnomalyItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        )}
                    </View>
                )}

                {/* Routines Tab */}
                {activeTab === 'routines' && (
                    <View style={styles.tabContent}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Learned Routines
                        </Text>

                        {routines?.commonLocations?.length > 0 ? (
                            <View style={styles.routinesSection}>
                                <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                                    Common Locations ({routines.commonLocations.length})
                                </Text>
                                {routines.commonLocations.slice(0, 5).map((location, index) => (
                                    <View
                                        key={index}
                                        style={[styles.routineCard, { backgroundColor: colors.card }]}
                                    >
                                        <View style={styles.routineIcon}>
                                            <Ionicons name="location" size={20} color={colors.primary} />
                                        </View>
                                        <View style={styles.routineInfo}>
                                            <Text style={[styles.routineTitle, { color: colors.text }]}>
                                                Location #{index + 1}
                                            </Text>
                                            <Text
                                                style={[styles.routineText, { color: colors.textSecondary }]}
                                            >
                                                Visits: {location.visitCount} | Lat: {location.latitude.toFixed(4)}, Lng:{' '}
                                                {location.longitude.toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                                <Ionicons name="school" size={48} color={colors.primary} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    No Routines Learned
                                </Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Start monitoring to learn your routines
                                </Text>
                                <TouchableOpacity
                                    style={[styles.learnButton, { backgroundColor: colors.primary }]}
                                    onPress={handleLearnRoutine}
                                >
                                    <Text style={styles.learnButtonText}>Learn Routines</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {routines?.activeHours && (
                            <View style={styles.routinesSection}>
                                <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                                    Active Hours
                                </Text>
                                <View style={[styles.activeHoursCard, { backgroundColor: colors.card }]}>
                                    <Ionicons name="time" size={24} color={colors.primary} />
                                    <Text style={[styles.activeHoursText, { color: colors.text }]}>
                                        {routines.activeHours.start}:00 - {routines.activeHours.end}:00
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && settings && (
                    <View style={styles.tabContent}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Detection Settings
                        </Text>

                        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Stop Detection
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                        Detect unexpected long stops
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.stopDetectionEnabled}
                                    onValueChange={(value) => updateSetting('stopDetectionEnabled', value)}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Route Deviation
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                        Detect route deviations from routine
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.routeDeviationEnabled}
                                    onValueChange={(value) => updateSetting('routeDeviationEnabled', value)}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Inactivity Detection
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                        Detect unusual inactivity periods
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.inactivityDetectionEnabled}
                                    onValueChange={(value) => updateSetting('inactivityDetectionEnabled', value)}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Sensitivity
                        </Text>

                        <View style={styles.sensitivityButtons}>
                            {['low', 'medium', 'high'].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.sensitivityButton,
                                        {
                                            backgroundColor:
                                                settings.sensitivity === level
                                                    ? colors.primary
                                                    : colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => updateSetting('sensitivity', level)}
                                >
                                    <Text
                                        style={[
                                            styles.sensitivityText,
                                            {
                                                color:
                                                    settings.sensitivity === level
                                                        ? '#FFFFFF'
                                                        : colors.text,
                                            },
                                        ]}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Data Management
                        </Text>

                        <TouchableOpacity
                            style={[styles.dangerButton, { backgroundColor: colors.card }]}
                            onPress={() => {
                                Alert.alert(
                                    'Reset Data',
                                    'This will clear all behavior data and learned routines. Continue?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Reset',
                                            style: 'destructive',
                                            onPress: async () => {
                                                await behaviorAnalysisService.resetData();
                                                await loadData();
                                                Alert.alert('Success', 'All data has been reset');
                                            },
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash" size={20} color="#EF4444" />
                            <Text style={[styles.dangerButtonText, { color: '#EF4444' }]}>
                                Reset All Data
                            </Text>
                        </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    monitorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    monitorButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tabBar: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        gap: 6,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    statusCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    riskBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    riskBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statusItem: {
        alignItems: 'center',
    },
    statusValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statusLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    learnButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    learnButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    anomaliesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '500',
    },
    anomalyCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    anomalyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    anomalyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    anomalyInfo: {
        flex: 1,
    },
    anomalyTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    anomalyTime: {
        fontSize: 12,
        marginTop: 2,
    },
    anomalyDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    locationText: {
        fontSize: 12,
    },
    emptyState: {
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    routinesSection: {
        marginBottom: 20,
    },
    routineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    routineIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    routineInfo: {
        flex: 1,
    },
    routineTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    routineText: {
        fontSize: 12,
        marginTop: 2,
    },
    activeHoursCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    activeHoursText: {
        fontSize: 18,
        fontWeight: '600',
    },
    settingsCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    sensitivityButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    sensitivityButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    sensitivityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default BehaviorPatternScreen;
