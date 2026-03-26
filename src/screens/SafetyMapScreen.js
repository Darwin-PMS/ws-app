// Safety Map Screen
// Community safety map showing incident reports and safe/unsafe zones

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    Modal,
    FlatList,
    Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import safetyService, { INCIDENT_TYPES } from '../services/safetyService';

const { width } = Dimensions.get('window');

const SafetyMapScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const mapRef = useRef(null);

    const [location, setLocation] = useState(null);
    const [incidents, setIncidents] = useState([]);
    const [safeZones, setSafeZones] = useState([]);
    const [selectedTab, setSelectedTab] = useState('incidents');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedIncidentType, setSelectedIncidentType] = useState(null);
    const [reportDescription, setReportDescription] = useState('');
    const [safetyStats, setSafetyStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            let userLocation;

            if (status === 'granted') {
                userLocation = await Location.getCurrentPositionAsync({});
                setLocation(userLocation.coords);
            } else {
                // Default to a central location
                setLocation({ latitude: 28.6139, longitude: 77.209 });
            }

            const incidentsData = await safetyService.getIncidents();
            const zonesData = await safetyService.getSafeZones();

            setIncidents(incidentsData);
            setSafeZones(zonesData);

            if (userLocation) {
                const stats = await safetyService.getAreaSafetyStats(
                    userLocation.coords.latitude,
                    userLocation.coords.longitude,
                    2
                );
                setSafetyStats(stats);
            }
        } catch (error) {
            console.error('Load data error:', error);
            // Default location
            setLocation({ latitude: 28.6139, longitude: 77.209 });
        } finally {
            setLoading(false);
        }
    };

    const centerOnUser = async () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    const handleReportIncident = async () => {
        if (!selectedIncidentType) {
            Alert.alert('Error', 'Please select an incident type');
            return;
        }

        try {
            const newIncident = await safetyService.reportIncident({
                type: selectedIncidentType.id,
                title: selectedIncidentType.label,
                description: reportDescription || `Reported ${selectedIncidentType.label}`,
                latitude: location.latitude,
                longitude: location.longitude,
            });

            setIncidents([newIncident, ...incidents]);
            setShowReportModal(false);
            setSelectedIncidentType(null);
            setReportDescription('');

            Alert.alert('Success', 'Incident reported successfully. Thank you for contributing to community safety!');
        } catch (error) {
            Alert.alert('Error', 'Failed to report incident. Please try again.');
        }
    };

    const getIncidentColor = (type) => {
        return INCIDENT_TYPES[type.toUpperCase()]?.color || '#6B7280';
    };

    const getTimeAgo = (timestamp) => {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    const renderIncidentTypes = () => (
        <View style={styles.typesContainer}>
            {Object.values(INCIDENT_TYPES).map((type) => (
                <TouchableOpacity
                    key={type.id}
                    style={[
                        styles.typeButton,
                        {
                            backgroundColor: selectedIncidentType?.id === type.id ? type.color + '30' : colors.card,
                            borderColor: selectedIncidentType?.id === type.id ? type.color : colors.border,
                        }
                    ]}
                    onPress={() => setSelectedIncidentType(type)}
                >
                    <Ionicons name={type.icon} size={20} color={type.color} />
                    <Text style={[styles.typeLabel, { color: colors.text }]}>{type.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMarkers = () => {
        const markers = [];

        if (selectedTab === 'incidents' || selectedTab === 'all') {
            incidents.forEach((incident) => (
                <Marker
                    key={incident.id}
                    coordinate={{
                        latitude: incident.latitude,
                        longitude: incident.longitude,
                    }}
                    title={incident.title}
                    description={incident.description}
                >
                    <View style={[styles.markerContainer, { backgroundColor: getIncidentColor(incident.type) }]}>
                        <Ionicons name="alert-outline" size={16} color="#fff" />
                    </View>
                </Marker>
            ));
        }

        if (selectedTab === 'safe' || selectedTab === 'all') {
            safeZones.forEach((zone) => (
                <Marker
                    key={zone.id}
                    coordinate={{
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                    }}
                    title={zone.name}
                    description={zone.description}
                >
                    <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
                    </View>
                </Marker>
            ));
        }

        return markers;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: location?.latitude || 28.6139,
                    longitude: location?.longitude || 77.209,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {renderMarkers()}
            </MapView>

            {/* Safety Stats Card */}
            {safetyStats && (
                <View style={[styles.statsCard, { backgroundColor: colors.card, ...shadows.medium }]}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: safetyStats.safetyScore >= 70 ? '#10B981' : safetyStats.safetyScore >= 40 ? '#F59E0B' : '#EF4444' }]}>
                                {safetyStats.safetyScore}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Safety Score</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>{safetyStats.recentIncidents}</Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Recent Incidents</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>{safetyStats.safeZonesCount}</Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Safe Zones</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Tab Selector */}
            <View style={[styles.tabContainer, { backgroundColor: colors.card, ...shadows.medium }]}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'incidents' && { backgroundColor: colors.primary + '20' }]}
                    onPress={() => setSelectedTab('incidents')}
                >
                    <Ionicons name="alert-circle-outline" size={20} color={selectedTab === 'incidents' ? colors.primary : colors.gray} />
                    <Text style={[styles.tabText, { color: selectedTab === 'incidents' ? colors.primary : colors.gray }]}>Incidents</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'safe' && { backgroundColor: colors.primary + '20' }]}
                    onPress={() => setSelectedTab('safe')}
                >
                    <Ionicons name="shield-checkmark-outline" size={20} color={selectedTab === 'safe' ? colors.primary : colors.gray} />
                    <Text style={[styles.tabText, { color: selectedTab === 'safe' ? colors.primary : colors.gray }]}>Safe Zones</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'all' && { backgroundColor: colors.primary + '20' }]}
                    onPress={() => setSelectedTab('all')}
                >
                    <Ionicons name="layers-outline" size={20} color={selectedTab === 'all' ? colors.primary : colors.gray} />
                    <Text style={[styles.tabText, { color: selectedTab === 'all' ? colors.primary : colors.gray }]}>All</Text>
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary, ...shadows.medium }]}
                    onPress={() => setShowReportModal(true)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.secondary, ...shadows.medium }]}
                    onPress={centerOnUser}
                >
                    <Ionicons name="locate-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>My Location</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Incidents List */}
            <View style={[styles.listContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.listTitle, { color: colors.text }]}>
                    {selectedTab === 'incidents' ? 'Recent Incidents' : selectedTab === 'safe' ? 'Safe Zones' : 'All Markers'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(selectedTab === 'incidents' ? incidents : selectedTab === 'safe' ? safeZones : [...incidents, ...safeZones])
                        .slice(0, 10)
                        .map((item, index) => (
                            <TouchableOpacity
                                key={item.id || index}
                                style={[styles.listItem, { backgroundColor: colors.card, ...shadows.small }]}
                                onPress={() => {
                                    if (mapRef.current) {
                                        mapRef.current.animateToRegion({
                                            latitude: item.latitude,
                                            longitude: item.longitude,
                                            latitudeDelta: 0.01,
                                            longitudeDelta: 0.01,
                                        });
                                    }
                                }}
                            >
                                <View style={[styles.listIcon, { backgroundColor: item.rating ? '#10B98120' : getIncidentColor(item.type) + '20' }]}>
                                    <Ionicons
                                        name={item.rating ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                                        size={20}
                                        color={item.rating ? '#10B981' : getIncidentColor(item.type)}
                                    />
                                </View>
                                <View style={styles.listContent}>
                                    <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={1}>
                                        {item.name || item.title}
                                    </Text>
                                    <Text style={[styles.listItemSubtitle, { color: colors.gray }]} numberOfLines={1}>
                                        {item.description || getTimeAgo(item.timestamp)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                </ScrollView>
            </View>

            {/* Report Modal */}
            <Modal visible={showReportModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Report Incident</Text>
                            <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Select Incident Type</Text>
                        <ScrollView style={styles.typesScrollView} showsVerticalScrollIndicator={false}>
                            {renderIncidentTypes()}
                        </ScrollView>

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Describe what happened..."
                            placeholderTextColor={colors.gray}
                            value={reportDescription}
                            onChangeText={setReportDescription}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleReportIncident}
                        >
                            <Text style={styles.submitButtonText}>Submit Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    statsCard: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        borderRadius: 12,
        padding: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    tabContainer: {
        position: 'absolute',
        top: 100,
        left: 10,
        flexDirection: 'column',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginVertical: 2,
    },
    tabText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '500',
    },
    actionButtons: {
        position: 'absolute',
        right: 10,
        bottom: 180,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 24,
        gap: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    listContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 12,
    },
    listItem: {
        width: 160,
        marginLeft: 12,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    listIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flex: 1,
        marginLeft: 8,
    },
    listItemTitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    listItemSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    typesScrollView: {
        maxHeight: 200,
    },
    typesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    typeLabel: {
        fontSize: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SafetyMapScreen;
