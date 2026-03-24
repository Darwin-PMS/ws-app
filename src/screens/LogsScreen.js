import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import loggerService from '../services/loggerService';

const LogsScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('error'); // 'error', 'all'

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const loadLogs = async () => {
        try {
            setIsLoading(true);
            let fetchedLogs;
            
            if (filter === 'error') {
                fetchedLogs = await loggerService.getErrorLogs(50);
            } else {
                fetchedLogs = await loggerService.getLogs(50);
            }
            
            setLogs(fetchedLogs);
        } catch (error) {
            Alert.alert('Error', 'Failed to load logs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearLogs = () => {
        Alert.alert(
            'Clear Logs',
            'Are you sure you want to clear all logs?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await loggerService.clearLogs();
                        setLogs([]);
                        Alert.alert('Success', 'Logs cleared');
                    }
                }
            ]
        );
    };

    const handleExportLogs = async () => {
        const logsJson = await loggerService.exportLogs();
        Alert.alert('Export', 'Logs exported to console. Check console for JSON output.');
        console.log('=== EXPORTED LOGS ===');
        console.log(logsJson);
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'error': return colors.error;
            case 'warning': return colors.warning;
            case 'info': return colors.primary;
            default: return colors.gray;
        }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'api': return 'cloud-offline';
            case 'auth': return 'key';
            case 'sos': return 'warning';
            default: return 'information-circle';
        }
    };

    const formatDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch {
            return timestamp;
        }
    };

    const renderLogItem = (log, index) => (
        <View 
            key={log.id || index} 
            style={[styles.logItem, { borderLeftColor: getLevelColor(log.level) }]}
        >
            <View style={styles.logHeader}>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(log.level) + '20' }]}>
                    <Text style={[styles.levelText, { color: getLevelColor(log.level) }]}>
                        {log.level?.toUpperCase()}
                    </Text>
                </View>
                <Ionicons name={getSourceIcon(log.source)} size={14} color={colors.gray} />
                <Text style={[styles.sourceText, { color: colors.gray }]}>
                    {log.source}
                </Text>
            </View>
            <Text style={[styles.logMessage, { color: colors.text }]}>
                {log.message}
            </Text>
            <Text style={[styles.logTime, { color: colors.gray }]}>
                {formatDate(log.timestamp)}
            </Text>
            {log.data && (
                <TouchableOpacity 
                    onPress={() => console.log('Log data:', log.data)}
                    style={styles.dataButton}
                >
                    <Text style={[styles.dataButtonText, { color: colors.primary }]}>
                        View Data
                    </Text>
                </TouchableOpacity>
            )}
            {log.error && (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '10' }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {log.error.message}
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Actions */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <View style={styles.filterButtons}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === 'error' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setFilter('error')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            { color: filter === 'error' ? '#fff' : colors.text }
                        ]}>
                            Errors
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === 'all' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            { color: filter === 'all' ? '#fff' : colors.text }
                        ]}>
                            All Logs
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={loadLogs} style={styles.headerButton}>
                        <Ionicons name="refresh" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleExportLogs} style={styles.headerButton}>
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearLogs} style={styles.headerButton}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logs List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : logs.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color={colors.gray} />
                    <Text style={[styles.emptyText, { color: colors.gray }]}>
                        No logs found
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.logsContainer}>
                    {logs.map((log, index) => renderLogItem(log, index))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#eee',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    logsContainer: {
        flex: 1,
        padding: 12,
    },
    logItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    levelText: {
        fontSize: 10,
        fontWeight: '700',
    },
    sourceText: {
        fontSize: 12,
    },
    logMessage: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    logTime: {
        fontSize: 11,
    },
    dataButton: {
        marginTop: 8,
    },
    dataButtonText: {
        fontSize: 12,
    },
    errorBox: {
        marginTop: 8,
        padding: 8,
        borderRadius: 4,
    },
    errorText: {
        fontSize: 12,
    },
});

export default LogsScreen;
