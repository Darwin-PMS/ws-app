// Smart Location Screen
// Integrates all 5 smart location & environmental features

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Switch,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import geofencingService from '../services/geofencingService';
import dynamicRouteService from '../services/dynamicRouteService';
import darknessReminderService from '../services/darknessReminderService';
import arNavigationService from '../services/arNavigationService';
import parkedCarService from '../services/parkedCarService';
import * as Location from 'expo-location';

const SmartLocationScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const cameraRef = useRef(null);

    // Feature states
    const [activeFeature, setActiveFeature] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    // Geofencing states
    const [safeZones, setSafeZones] = useState([]);
    const [geofenceMonitoring, setGeofenceMonitoring] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneRadius, setNewZoneRadius] = useState('100');
    const [showAddZoneModal, setShowAddZoneModal] = useState(false);

    // Dynamic Route states
    const [routeActive, setRouteActive] = useState(false);
    const [currentRoute, setCurrentRoute] = useState(null);
    const [routeDestination, setRouteDestination] = useState('');
    const [rerouteSuggestion, setRerouteSuggestion] = useState(null);

    // Darkness Reminder states
    const [darknessEnabled, setDarknessEnabled] = useState(true);
    const [journeyActive, setJourneyActive] = useState(false);
    const [sunStatus, setSunStatus] = useState(null);

    // AR Navigation states
    const [showARView, setShowARView] = useState(false);
    const [arPoints, setArPoints] = useState([]);
    const [cameraPermission, setCameraPermission] = useState(null);

    // Parked Car states
    const [parkingLocation, setParkingLocation] = useState(null);
    const [trustedContacts, setTrustedContacts] = useState([]);
    const [showParkingModal, setShowParkingModal] = useState(false);
    const [parkingNotes, setParkingNotes] = useState('');

    // ==================== INITIALIZATION ====================

    useEffect(() => {
        initializeServices();
        requestPermissions();
    }, []);

    useEffect(() => {
        if (activeFeature === 'geofencing') {
            loadSafeZones();
        } else if (activeFeature === 'parking') {
            loadParkingData();
        } else if (activeFeature === 'darkness') {
            checkSunStatus();
        }
    }, [activeFeature]);

    const initializeServices = async () => {
        await geofencingService.initialize();
        await darknessReminderService.initialize();
        await arNavigationService.initialize();
        await parkedCarService.initialize();
    };

    const requestPermissions = async () => {
        try {
            // Location
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            
            // Background location for geofencing
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            // Camera for AR
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(cameraStatus === 'granted');

            if (locationStatus === 'granted') {
                getCurrentLocation();
            }
        } catch (error) {
            console.error('Permission error:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        } catch (error) {
            console.error('Location error:', error);
            setLocation({ latitude: 28.6139, longitude: 77.209 });
        }
    };

    // ==================== GEOFENCING FEATURE ====================

    const loadSafeZones = async () => {
        const zones = geofencingService.getSafeZones();
        setSafeZones(zones);
    };

    const handleAddSafeZone = async () => {
        if (!newZoneName.trim()) {
            Alert.alert('Error', 'Please enter a zone name');
            return;
        }

        setLoading(true);
        try {
            const result = await geofencingService.markCurrentLocationAsSafe(
                newZoneName,
                parseInt(newZoneRadius) || 100
            );

            if (result.success) {
                await loadSafeZones();
                setShowAddZoneModal(false);
                setNewZoneName('');
                setNewZoneRadius('100');
                Alert.alert('Success', `${newZoneName} added as a safe zone!`);
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSafeZone = async (zoneId) => {
        Alert.alert(
            'Remove Safe Zone',
            'Are you sure you want to remove this safe zone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await geofencingService.removeSafeZone(zoneId);
                        await loadSafeZones();
                    },
                },
            ]
        );
    };

    const toggleGeofenceMonitoring = async () => {
        setLoading(true);
        try {
            if (geofenceMonitoring) {
                await geofencingService.stopMonitoring();
                setGeofenceMonitoring(false);
            } else {
                const result = await geofencingService.startMonitoring((breaches) => {
                    breaches.forEach(breach => {
                        Alert.alert(
                            breach.type === 'enter' ? '✅ Safe Zone Entered' : '⚠️ Safe Zone Left',
                            breach.zone.name
                        );
                    });
                });

                if (result.success) {
                    setGeofenceMonitoring(true);
                } else {
                    Alert.alert('Error', result.message);
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== DYNAMIC ROUTE FEATURE ====================

    const handleStartRouteMonitoring = async () => {
        if (!routeDestination.trim()) {
            Alert.alert('Error', 'Please enter a destination');
            return;
        }

        setLoading(true);
        try {
            // Plan route
            const result = await dynamicRouteService.planRoute(location, {
                latitude: location.latitude + 0.01,
                longitude: location.longitude + 0.01,
                name: routeDestination,
            });

            if (result.success) {
                setCurrentRoute(result.route);
                
                // Start monitoring
                await dynamicRouteService.startRouteMonitoring((update) => {
                    if (update.type === 'reroute_suggested') {
                        setRerouteSuggestion(update);
                        Alert.alert(
                            '⚠️ Route Change Suggested',
                            `High risk detected! Consider the alternative route for safety.`,
                            [
                                { text: 'Stay on Route', style: 'cancel' },
                                {
                                    text: 'Take Alternative',
                                    onPress: () => {
                                        setCurrentRoute(prev => ({
                                            ...prev,
                                            selected: update.alternativeRoute,
                                        }));
                                        setRerouteSuggestion(null);
                                    },
                                },
                            ]
                        );
                    }
                });

                setRouteActive(true);
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStopRouteMonitoring = async () => {
        await dynamicRouteService.stopRouteMonitoring();
        setRouteActive(false);
        setCurrentRoute(null);
        setRerouteSuggestion(null);
        setRouteDestination('');
    };

    // ==================== DARKNESS REMINDER FEATURE ====================

    const checkSunStatus = async () => {
        const status = await darknessReminderService.checkCurrentSunStatus();
        setSunStatus(status);
    };

    const handleStartJourney = async () => {
        setLoading(true);
        try {
            const result = await darknessReminderService.startJourney({
                estimatedDuration: 60,
            });

            if (result.success) {
                setJourneyActive(true);
                Alert.alert(
                    'Journey Started',
                    'You will be notified before sunset. Stay safe!'
                );
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEndJourney = async () => {
        await darknessReminderService.endJourney();
        setJourneyActive(false);
        Alert.alert('Journey Ended', 'Stay safe!');
    };

    const toggleDarknessReminders = () => {
        if (darknessEnabled) {
            darknessReminderService.disableReminders();
        } else {
            darknessReminderService.enableReminders();
        }
        setDarknessEnabled(!darknessEnabled);
    };

    // ==================== AR NAVIGATION FEATURE ====================

    const handleShowARView = async () => {
        if (cameraPermission !== 'granted') {
            Alert.alert(
                'Camera Permission Required',
                'AR navigation requires camera access. Please grant permission.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: requestPermissions },
                ]
            );
            return;
        }

        setLoading(true);
        try {
            const result = await arNavigationService.findNearbySafePoints(1000);
            
            if (result.success) {
                setArPoints(result.points);
                setShowARView(true);
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateEscapeRoute = async () => {
        setLoading(true);
        try {
            const result = await arNavigationService.calculateEscapeRoute(location);
            
            if (result.success) {
                Alert.alert(
                    '🧭 Escape Route',
                    `Head ${result.escapeRoute.direction} towards ${result.escapeRoute.destination.name}\nDistance: ${result.escapeRoute.distance.toFixed(0)}m\nTime: ~${result.escapeRoute.estimatedTime} min`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== PARKED CAR FEATURE ====================

    const loadParkingData = async () => {
        const current = parkedCarService.getCurrentParking();
        const contacts = parkedCarService.trustedContacts;
        setParkingLocation(current);
        setTrustedContacts(contacts);
    };

    const handleSaveParking = async () => {
        setLoading(true);
        try {
            const result = await parkedCarService.saveParkingLocation({
                notes: parkingNotes,
            });

            if (result.success) {
                setParkingLocation(result.parking);
                setShowParkingModal(false);
                setParkingNotes('');
                Alert.alert('Success', 'Parking location saved!');
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetrieveParking = async () => {
        const result = await parkedCarService.retrieveParkingLocation();
        
        if (result.success) {
            Alert.alert(
                '🅿️ Your Car Location',
                `📍 ${result.parking.address}\n\nSaved: ${new Date(result.parking.savedAt).toLocaleString()}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Navigate', onPress: () => parkedCarService.openNavigationToCar() },
                ]
            );
        } else {
            Alert.alert('Info', 'No parking location saved yet.');
        }
    };

    const handleShareParking = async () => {
        if (trustedContacts.length === 0) {
            Alert.alert('Info', 'No trusted contacts added yet.');
            return;
        }

        const result = await parkedCarService.shareParkingLocation();
        
        if (result.success) {
            const successCount = result.results.filter(r => r.success).length;
            Alert.alert('Success', `Shared with ${successCount} contact(s)!`);
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const handleClearParking = async () => {
        Alert.alert(
            'Clear Parking Location',
            'Are you sure you want to clear the saved parking location?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await parkedCarService.clearParkingLocation();
                        setParkingLocation(null);
                        Alert.alert('Cleared', 'Parking location removed');
                    },
                },
            ]
        );
    };

    // ==================== RENDERING ====================

    const renderFeatureCard = (icon, title, description, featureKey, active = false) => (
        <TouchableOpacity
            key={featureKey}
            style={[
                styles.featureCard,
                { backgroundColor: colors.card, ...shadows.medium },
                activeFeature === featureKey && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFeature(activeFeature === featureKey ? null : featureKey)}
        >
            <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={icon} size={28} color={colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.featureDescription, { color: colors.gray }]}>{description}</Text>
            {active && (
                <View style={styles.activeIndicator}>
                    <View style={[styles.activeDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.activeText}>Active</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderGeofencingContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Safe Zones</Text>

            {/* Current Location Button */}
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddZoneModal(true)}
            >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add Current Location as Safe Zone</Text>
            </TouchableOpacity>

            {/* Monitoring Toggle */}
            <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Monitor Safe Zones</Text>
                <Switch
                    value={geofenceMonitoring}
                    onValueChange={toggleGeofenceMonitoring}
                    trackColor={{ false: colors.gray, true: colors.primary }}
                />
            </View>

            {/* Safe Zones List */}
            {safeZones.length > 0 && (
                <View style={styles.zonesList}>
                    {safeZones.map((zone) => (
                        <View key={zone.id} style={[styles.zoneItem, { backgroundColor: colors.background }]}>
                            <View style={styles.zoneInfo}>
                                <Ionicons
                                    name={zone.type === 'home' ? 'home' : 'location'}
                                    size={20}
                                    color={colors.primary}
                                />
                                <View style={styles.zoneTextContainer}>
                                    <Text style={[styles.zoneName, { color: colors.text }]}>{zone.name}</Text>
                                    <Text style={[styles.zoneDetails, { color: colors.gray }]}>
                                        Radius: {zone.radius}m
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleRemoveSafeZone(zone.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {safeZones.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.gray }]}>
                    No safe zones added yet. Add your current location to get started.
                </Text>
            )}
        </View>
    );

    const renderDynamicRouteContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Dynamic Route Monitoring</Text>

            {!routeActive ? (
                <>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Enter destination"
                        placeholderTextColor={colors.gray}
                        value={routeDestination}
                        onChangeText={setRouteDestination}
                    />
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={handleStartRouteMonitoring}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="navigate" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Start Route Monitoring</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <View>
                    <View style={[styles.routeInfoCard, { backgroundColor: colors.background }]}>
                        <Text style={[styles.routeInfoLabel, { color: colors.gray }]}>Monitoring Route to:</Text>
                        <Text style={[styles.routeInfoValue, { color: colors.text }]}>{routeDestination}</Text>
                    </View>

                    {currentRoute?.selected && (
                        <View style={[styles.routeStats, { backgroundColor: colors.background }]}>
                            <View style={styles.routeStat}>
                                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                                <Text style={[styles.routeStatText, { color: colors.text }]}>
                                    Safety: {currentRoute.selected.safetyScore.toFixed(0)}%
                                </Text>
                            </View>
                            <View style={styles.routeStat}>
                                <Ionicons name="time" size={20} color={colors.primary} />
                                <Text style={[styles.routeStatText, { color: colors.text }]}>
                                    ~{currentRoute.selected.estimatedTime} min
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                        onPress={handleStopRouteMonitoring}
                    >
                        <Ionicons name="stop-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Stop Monitoring</Text>
                    </TouchableOpacity>
                </View>
            )}

            {rerouteSuggestion && (
                <View style={[styles.rerouteAlert, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Ionicons name="warning" size={24} color="#D97706" />
                    <Text style={[styles.rerouteAlertText, { color: '#92400E' }]}>
                        High risk detected! Alternative route suggested.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderDarknessContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Smart Darkness Reminders</Text>

            {/* Sun Status */}
            {sunStatus && (
                <View style={[styles.sunStatusCard, { backgroundColor: colors.background }]}>
                    <Ionicons
                        name={sunStatus.status === 'day' ? 'sunny' : 'moon'}
                        size={40}
                        color={sunStatus.status === 'day' ? '#F59E0B' : '#6366F1'}
                    />
                    <Text style={[styles.sunStatusText, { color: colors.text }]}>
                        Currently: {sunStatus.status.toUpperCase()}
                    </Text>
                    {sunStatus.timeToSunset && (
                        <Text style={[styles.sunTimeText, { color: colors.gray }]}>
                            Sunset in: {Math.round(sunStatus.timeToSunset / 60000)} minutes
                        </Text>
                    )}
                </View>
            )}

            {/* Settings */}
            <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Reminders</Text>
                <Switch
                    value={darknessEnabled}
                    onValueChange={toggleDarknessReminders}
                    trackColor={{ false: colors.gray, true: colors.primary }}
                />
            </View>

            {/* Journey Controls */}
            {!journeyActive ? (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleStartJourney}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="play-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Start Journey</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleEndJourney}
                >
                    <Ionicons name="stop-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>End Journey</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderARContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>AR Escape Guidance</Text>

            <Text style={[styles.featureDescription, { color: colors.gray, marginBottom: 16 }]}>
                View safe directions and nearby help points through your camera
            </Text>

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleShowARView}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="scan" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Open AR View</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10B981', marginTop: 12 }]}
                onPress={handleCalculateEscapeRoute}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="flash" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Find Escape Route</Text>
                    </>
                )}
            </TouchableOpacity>

            {arPoints.length > 0 && (
                <View style={styles.arPointsList}>
                    <Text style={[styles.subsectionTitle, { color: colors.text }]}>Nearby Safe Points:</Text>
                    {arPoints.slice(0, 5).map((point, index) => (
                        <View key={index} style={[styles.arPointItem, { backgroundColor: colors.background }]}>
                            <Ionicons name={point.icon} size={20} color={colors.primary} />
                            <Text style={[styles.arPointName, { color: colors.text }]}>{point.name}</Text>
                            <Text style={[styles.arPointDistance, { color: colors.gray }]}>{point.distanceText}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderParkingContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Parked Car Location</Text>

            {parkingLocation ? (
                <View>
                    <View style={[styles.parkingInfoCard, { backgroundColor: colors.background }]}>
                        <Ionicons name="car" size={32} color={colors.primary} />
                        <Text style={[styles.parkingAddress, { color: colors.text }]}>
                            {parkingLocation.address}
                        </Text>
                        <Text style={[styles.parkingTime, { color: colors.gray }]}>
                            Saved: {new Date(parkingLocation.savedAt).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.parkingActions}>
                        <TouchableOpacity
                            style={[styles.parkingActionBtn, { backgroundColor: colors.primary }]}
                            onPress={handleRetrieveParking}
                        >
                            <Ionicons name="location" size={20} color="#fff" />
                            <Text style={styles.parkingActionText}>Navigate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.parkingActionBtn, { backgroundColor: '#10B981' }]}
                            onPress={handleShareParking}
                        >
                            <Ionicons name="share" size={20} color="#fff" />
                            <Text style={styles.parkingActionText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.parkingActionBtn, { backgroundColor: '#EF4444' }]}
                            onPress={handleClearParking}
                        >
                            <Ionicons name="trash" size={20} color="#fff" />
                            <Text style={styles.parkingActionText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <Text style={[styles.featureDescription, { color: colors.gray, marginBottom: 16 }]}>
                        Save your parking location and share it with trusted contacts
                    </Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowParkingModal(true)}
                    >
                        <Ionicons name="parking" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Save Parking Location</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Trusted Contacts */}
            <View style={styles.contactsSection}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                    Trusted Contacts ({trustedContacts.length})
                </Text>
                {trustedContacts.map((contact) => (
                    <View key={contact.id} style={[styles.contactItem, { backgroundColor: colors.background }]}>
                        <View style={styles.contactAvatar}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                            <Text style={[styles.contactPhone, { color: colors.gray }]}>{contact.phone}</Text>
                        </View>
                    </View>
                ))}
                {trustedContacts.length === 0 && (
                    <Text style={[styles.emptyText, { color: colors.gray }]}>
                        No trusted contacts added yet
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Location</Text>
                <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                    Advanced location-based safety features
                </Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresGrid}>
                {renderFeatureCard('shield-checkmark', 'Safe Zones', 'Set safe areas with breach alerts', 'geofencing', geofenceMonitoring)}
                {renderFeatureCard('navigate', 'Dynamic Routes', 'AI-powered route re-routing', 'dynamicRoute', routeActive)}
                {renderFeatureCard('moon', 'Darkness Alerts', 'Sunset journey reminders', 'darkness', journeyActive)}
                {renderFeatureCard('scan', 'AR Guidance', 'AR escape directions', 'ar', false)}
                {renderFeatureCard('car', 'Parked Car', 'Save & share parking location', 'parking', !!parkingLocation)}
            </View>

            {/* Feature Content */}
            {activeFeature === 'geofencing' && renderGeofencingContent()}
            {activeFeature === 'dynamicRoute' && renderDynamicRouteContent()}
            {activeFeature === 'darkness' && renderDarknessContent()}
            {activeFeature === 'ar' && renderARContent()}
            {activeFeature === 'parking' && renderParkingContent()}

            {/* Location Info */}
            {location && (
                <View style={[styles.locationInfo, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.gray }]}>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    featureCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    activeText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '500',
    },
    featureContent: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
    },
    featureSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    zonesList: {
        marginTop: 12,
    },
    zoneItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    zoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    zoneTextContainer: {
        marginLeft: 8,
    },
    zoneName: {
        fontSize: 15,
        fontWeight: '500',
    },
    zoneDetails: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    },
    routeInfoCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    routeInfoLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    routeInfoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    routeStats: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    routeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeStatText: {
        fontSize: 14,
        fontWeight: '500',
    },
    rerouteAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 12,
        borderWidth: 1,
    },
    rerouteAlertText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    sunStatusCard: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    sunStatusText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    sunTimeText: {
        fontSize: 14,
        marginTop: 4,
    },
    arPointsList: {
        marginTop: 16,
    },
    subsectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    arPointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    arPointName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    arPointDistance: {
        fontSize: 13,
    },
    parkingInfoCard: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    parkingAddress: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    parkingTime: {
        fontSize: 13,
        marginTop: 4,
    },
    parkingActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    parkingActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    parkingActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    contactsSection: {
        marginTop: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        marginLeft: 12,
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '500',
    },
    contactPhone: {
        fontSize: 13,
        marginTop: 2,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 12,
        gap: 8,
    },
    locationText: {
        fontSize: 12,
    },
});

export default SmartLocationScreen;
