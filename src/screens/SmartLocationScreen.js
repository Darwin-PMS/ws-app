import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    RefreshControl,
    Dimensions,
    Keyboard,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import geofencingService from '../services/geofencingService';
import dynamicRouteService from '../services/dynamicRouteService';
import darknessReminderService from '../services/darknessReminderService';
import arNavigationService from '../services/arNavigationService';
import parkedCarService from '../services/parkedCarService';
import locationService from '../services/locationService';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURE_KEYS = {
    GEOFENCING: 'geofencing',
    ROUTE: 'route',
    DARKNESS: 'darkness',
    AR: 'ar',
    PARKING: 'parking',
};

const SmartLocationScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows, isDark } = useTheme();
    const mapRef = useRef(null);

    const [activeFeature, setActiveFeature] = useState(null);
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState({ location: false, background: false, camera: false });

    const [safeZones, setSafeZones] = useState([]);
    const [geofenceMonitoring, setGeofenceMonitoring] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneRadius, setNewZoneRadius] = useState('100');
    const [showAddZoneModal, setShowAddZoneModal] = useState(false);

    const [routeActive, setRouteActive] = useState(false);
    const [currentRoute, setCurrentRoute] = useState(null);
    const [routeDestination, setRouteDestination] = useState('');
    const [rerouteSuggestion, setRerouteSuggestion] = useState(null);
    const [selectedRouteOption, setSelectedRouteOption] = useState(null);
    const [routeError, setRouteError] = useState(null);

    const [darknessEnabled, setDarknessEnabled] = useState(true);
    const [journeyActive, setJourneyActive] = useState(false);
    const [sunStatus, setSunStatus] = useState(null);
    const [sunLoading, setSunLoading] = useState(false);

    const [showARView, setShowARView] = useState(false);
    const [arPoints, setArPoints] = useState([]);
    const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

    const [parkingLocation, setParkingLocation] = useState(null);
    const [parkingAddress, setParkingAddress] = useState(null);
    const [trustedContacts, setTrustedContacts] = useState([]);
    const [showParkingModal, setShowParkingModal] = useState(false);
    const [parkingNotes, setParkingNotes] = useState('');

    const requestPermissions = useCallback(async () => {
        try {
            const [locationPerm, backgroundPerm, cameraPerm] = await Promise.all([
                Location.requestForegroundPermissionsAsync(),
                Location.requestBackgroundPermissionsAsync(),
                Camera.requestCameraPermissionsAsync(),
            ]);
            
            const perms = {
                location: locationPerm.status === 'granted',
                background: backgroundPerm.status === 'granted',
                camera: cameraPerm.status === 'granted',
            };
            setPermissionStatus(perms);
            setCameraPermissionGranted(cameraPerm.status === 'granted');
            
            return perms;
        } catch (error) {
            console.error('Permission error:', error);
            return { location: false, background: false, camera: false };
        }
    }, []);

    const getCurrentLocation = useCallback(async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            setLocation(coords);
            
            try {
                const addrResult = await locationService.getAddressFromCoordinates(coords.latitude, coords.longitude);
                if (addrResult.success) {
                    setAddress(addrResult.address.formatted);
                } else {
                    setAddress(null);
                }
            } catch {
                setAddress(null);
            }
            
            return coords;
        } catch (error) {
            console.error('Location error:', error);
            const fallback = { latitude: 28.6139, longitude: 77.209 };
            setLocation(fallback);
            setAddress('Delhi, India (fallback)');
            return fallback;
        }
    }, []);

    const getAddressForCoords = async (lat, lng) => {
        try {
            const result = await locationService.getAddressFromCoordinates(lat, lng);
            return result.success ? result.address.formatted : 'Unknown location';
        } catch {
            return 'Unknown location';
        }
    };

    const loadSafeZones = useCallback(() => {
        const zones = geofencingService.getSafeZones();
        setSafeZones(zones);
        return zones;
    }, []);

    const loadParkingData = useCallback(async () => {
        try {
            const current = parkedCarService.getCurrentParking();
            const contacts = parkedCarService.trustedContacts || [];
            setParkingLocation(current);
            setTrustedContacts(contacts);
            
            if (current) {
                const addr = await getAddressForCoords(current.latitude, current.longitude);
                setParkingAddress(addr);
            } else {
                setParkingAddress(null);
            }
        } catch (error) {
            console.error('Load parking data error:', error);
            setTrustedContacts([]);
        }
    }, []);

    const loadAllData = useCallback(async () => {
        try {
            loadSafeZones();
            await loadParkingData();
            
            try {
                const sun = await darknessReminderService.checkCurrentSunStatus();
                setSunStatus(sun);
            } catch {
                setSunStatus(null);
            }
        } catch (error) {
            console.error('Load all data error:', error);
        }
    }, [loadSafeZones, loadParkingData]);

    const initializeApp = useCallback(async () => {
        setInitialLoading(true);
        try {
            await Promise.all([
                geofencingService.initialize(),
                darknessReminderService.initialize(),
                arNavigationService.initialize(),
                parkedCarService.initialize(),
            ]);
            
            const perms = await requestPermissions();
            
            if (perms.location) {
                await getCurrentLocation();
            }
            
            await loadAllData();
        } catch (error) {
            console.error('Init error:', error);
        } finally {
            setInitialLoading(false);
        }
    }, [requestPermissions, getCurrentLocation, loadAllData]);

    useEffect(() => {
        initializeApp();
        
        return () => {
            geofencingService.stopMonitoring();
            dynamicRouteService.stopRouteMonitoring();
        };
    }, [initializeApp]);

    useEffect(() => {
        if (activeFeature === FEATURE_KEYS.GEOFENCING) {
            loadSafeZones();
        } else if (activeFeature === FEATURE_KEYS.PARKING) {
            loadParkingData();
        } else if (activeFeature === FEATURE_KEYS.DARKNESS) {
            checkSunStatus();
        }
    }, [activeFeature, loadSafeZones, loadParkingData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                getCurrentLocation(),
                loadAllData(),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [getCurrentLocation, loadAllData]);

    const handleAddSafeZone = async () => {
        if (!newZoneName.trim()) {
            Alert.alert('Error', 'Please enter a zone name');
            return;
        }

        if (!location) {
            Alert.alert('Error', 'Unable to get current location');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();
        try {
            const result = await geofencingService.markCurrentLocationAsSafe(
                newZoneName.trim(),
                parseInt(newZoneRadius) || 100
            );

            if (result.success) {
                loadSafeZones();
                setShowAddZoneModal(false);
                setNewZoneName('');
                setNewZoneRadius('100');
                Alert.alert('Success', `${newZoneName} added as a safe zone!`);
            } else {
                Alert.alert('Error', result.message || 'Failed to add safe zone');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
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
                        loadSafeZones();
                        setSelectedZone(null);
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
                if (!permissionStatus.background) {
                    Alert.alert(
                        'Permission Required',
                        'Background location permission is needed for monitoring. Please enable it in settings.',
                        [{ text: 'OK' }]
                    );
                    setLoading(false);
                    return;
                }

                const result = await geofencingService.startMonitoring((breaches) => {
                    if (breaches && breaches.length > 0) {
                        breaches.forEach(breach => {
                            Alert.alert(
                                breach.type === 'enter' ? 'Safe Zone Entered' : 'Safe Zone Alert',
                                `You have ${breach.type === 'enter' ? 'arrived at' : 'left'} ${breach.zone?.name || 'a safe zone'}`,
                                [{ text: 'OK' }]
                            );
                        });
                    }
                });

                if (result.success) {
                    setGeofenceMonitoring(true);
                } else {
                    Alert.alert('Error', result.message || 'Failed to start monitoring');
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getDistanceToZone = useCallback((zone) => {
        if (!location || !zone) return null;
        try {
            const dist = locationService.calculateDistance(
                location.latitude, location.longitude,
                zone.latitude, zone.longitude
            );
            if (dist < 1000) return `${Math.round(dist)}m`;
            return `${(dist / 1000).toFixed(1)}km`;
        } catch {
            return null;
        }
    }, [location]);

    const handleDestinationSearch = async () => {
        if (!routeDestination.trim()) {
            Alert.alert('Error', 'Please enter a destination');
            return;
        }

        if (!location) {
            Alert.alert('Error', 'Current location not available');
            return;
        }

        setLoading(true);
        setRouteError(null);
        Keyboard.dismiss();
        try {
            const geoResult = await locationService.getCoordinatesFromAddress(routeDestination);
            if (!geoResult.success) {
                setRouteError('Could not find location. Please try a different search.');
                setLoading(false);
                return;
            }

            const routeResult = await dynamicRouteService.planRoute(location, {
                ...geoResult.location,
                name: routeDestination,
            });

            if (routeResult.success) {
                setCurrentRoute(routeResult.route);
                setSelectedRouteOption(routeResult.route.selected);
            } else {
                setRouteError(routeResult.message || 'Failed to plan route');
            }
        } catch (error) {
            setRouteError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRouteOption = useCallback((option) => {
        setSelectedRouteOption(option);
        setCurrentRoute(prev => prev ? { ...prev, selected: option } : null);
    }, []);

    const handleStartRouteMonitoring = async () => {
        if (!selectedRouteOption) {
            Alert.alert('Select Route', 'Please select a route option first');
            return;
        }

        if (!location) {
            Alert.alert('Error', 'Current location not available');
            return;
        }

        setLoading(true);
        try {
            const result = await dynamicRouteService.startRouteMonitoring((update) => {
                if (update) {
                    if (update.type === 'reroute_suggested') {
                        setRerouteSuggestion(update);
                        Alert.alert(
                            'Route Change Suggested',
                            'High risk detected in current area! Consider the alternative route for safety.',
                            [
                                { text: 'Stay on Route', style: 'cancel', onPress: () => setRerouteSuggestion(null) },
                                {
                                    text: 'Take Alternative',
                                    onPress: () => {
                                        if (update.alternativeRoute) {
                                            handleSelectRouteOption(update.alternativeRoute);
                                        }
                                        setRerouteSuggestion(null);
                                    },
                                },
                            ]
                        );
                    } else if (update.type === 'route_deviation') {
                        Alert.alert('Route Deviation', update.message || 'You have deviated from the planned route');
                    }
                }
            });

            if (result.success) {
                setRouteActive(true);
            } else {
                Alert.alert('Error', result.message || 'Failed to start monitoring');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleStopRouteMonitoring = async () => {
        try {
            await dynamicRouteService.stopRouteMonitoring();
        } catch {
            // Ignore stop errors
        }
        setRouteActive(false);
        setCurrentRoute(null);
        setRerouteSuggestion(null);
        setRouteDestination('');
        setSelectedRouteOption(null);
        setRouteError(null);
    };

    const checkSunStatus = async () => {
        setSunLoading(true);
        try {
            const status = await darknessReminderService.checkCurrentSunStatus();
            setSunStatus(status);
        } catch (error) {
            console.error('Sun status error:', error);
            setSunStatus(null);
        } finally {
            setSunLoading(false);
        }
    };

    const handleStartJourney = async () => {
        if (!location) {
            Alert.alert('Error', 'Current location not available');
            return;
        }

        setLoading(true);
        try {
            const result = await darknessReminderService.startJourney({ estimatedDuration: 60 });
            if (result.success) {
                setJourneyActive(true);
                Alert.alert('Journey Started', 'You will be notified before sunset. Stay safe!');
            } else {
                Alert.alert('Error', result.message || 'Failed to start journey');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEndJourney = async () => {
        try {
            await darknessReminderService.endJourney();
            setJourneyActive(false);
            Alert.alert('Journey Ended', 'Stay safe!');
        } catch (error) {
            setJourneyActive(false);
        }
    };

    const toggleDarknessReminders = () => {
        if (darknessEnabled) {
            darknessReminderService.disableReminders();
        } else {
            darknessReminderService.enableReminders();
        }
        setDarknessEnabled(!darknessEnabled);
    };

    const handleShowARView = async () => {
        if (!cameraPermissionGranted) {
            Alert.alert(
                'Camera Permission Required',
                'AR navigation requires camera access.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Grant', onPress: async () => {
                        const perms = await requestPermissions();
                        if (perms.camera) {
                            handleShowARView();
                        }
                    }},
                ]
            );
            return;
        }

        if (!location) {
            Alert.alert('Error', 'Current location not available');
            return;
        }

        setLoading(true);
        try {
            const result = await arNavigationService.findNearbySafePoints(1000);
            if (result.success && result.points) {
                setArPoints(result.points);
                setShowARView(true);
            } else {
                Alert.alert('Error', result.message || 'No safe points found nearby');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateEscapeRoute = async () => {
        if (!location) {
            Alert.alert('Error', 'Current location not available');
            return;
        }

        setLoading(true);
        try {
            const result = await arNavigationService.calculateEscapeRoute(location);
            if (result.success && result.escapeRoute) {
                Alert.alert(
                    'Escape Route',
                    `Head ${result.escapeRoute.direction || 'north'} towards ${result.escapeRoute.destination?.name || 'safe area'}\nDistance: ${(result.escapeRoute.distance || 0).toFixed(0)}m\nTime: ~${result.escapeRoute.estimatedTime || 5} min`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Info', result.message || 'Could not calculate escape route');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveParking = async () => {
        setLoading(true);
        Keyboard.dismiss();
        try {
            const result = await parkedCarService.saveParkingLocation({ notes: parkingNotes });
            if (result.success && result.parking) {
                setParkingLocation(result.parking);
                const addr = await getAddressForCoords(result.parking.latitude, result.parking.longitude);
                setParkingAddress(addr);
                setShowParkingModal(false);
                setParkingNotes('');
                Alert.alert('Success', 'Parking location saved!');
            } else {
                Alert.alert('Error', result.message || 'Failed to save parking location');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRetrieveParking = async () => {
        try {
            const result = await parkedCarService.retrieveParkingLocation();
            if (result.success && result.parking) {
                Alert.alert(
                    'Your Car Location',
                    `${parkingAddress || 'Saved location'}\n\nSaved: ${new Date(result.parking.savedAt).toLocaleString()}`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Navigate', onPress: async () => {
                            await parkedCarService.openNavigationToCar();
                        }},
                    ]
                );
            } else {
                Alert.alert('Info', 'No parking location saved yet.');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        }
    };

    const handleShareParking = async () => {
        if (!parkingLocation) {
            Alert.alert('Info', 'Please save a parking location first');
            return;
        }

        const contacts = parkedCarService.trustedContacts || [];
        if (contacts.length === 0) {
            Alert.alert('Info', 'No trusted contacts added. Add contacts in settings to share parking location.');
            return;
        }

        setLoading(true);
        try {
            const result = await parkedCarService.shareParkingLocation();
            if (result.success && result.results) {
                const successCount = result.results.filter(r => r && r.success).length;
                Alert.alert('Success', `Shared with ${successCount} contact(s)!`);
            } else {
                Alert.alert('Error', result.message || 'Failed to share location');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
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
                        try {
                            await parkedCarService.clearParkingLocation();
                            setParkingLocation(null);
                            setParkingAddress(null);
                            Alert.alert('Cleared', 'Parking location removed');
                        } catch (error) {
                            Alert.alert('Error', error.message || 'An error occurred');
                        }
                    },
                },
            ]
        );
    };

    const openInMaps = useCallback((lat, lng, name) => {
        locationService.openMapsApp(lat, lng, name || 'Location');
    }, []);

    const getSafetyColor = useCallback((score) => {
        if (!score) return colors.gray;
        if (score >= 80) return colors.success;
        if (score >= 60) return colors.warning;
        return colors.error;
    }, [colors]);

    const renderPermissionBanner = () => {
        if (permissionStatus.location && permissionStatus.background) return null;
        
        return (
            <View style={[styles.permissionBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Enable {permissionStatus.location ? 'background ' : ''}location for full features
                </Text>
                <TouchableOpacity onPress={requestPermissions}>
                    <Text style={[styles.permissionAction, { color: colors.primary }]}>Enable</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderGeofencingContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Safe Zones</Text>
                <View style={[styles.statsBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.statsText, { color: colors.primary }]}>{safeZones.length} zones</Text>
                </View>
            </View>

            {location && (
                <View style={[styles.miniMap, { backgroundColor: colors.background }]}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker coordinate={location}>
                            <View style={[styles.currentLocationMarker, { backgroundColor: colors.primary }]}>
                                <Ionicons name="person" size={12} color="#fff" />
                            </View>
                        </Marker>
                        {safeZones.map((zone) => (
                            <React.Fragment key={zone.id}>
                                <Circle
                                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                                    radius={zone.radius}
                                    fillColor={colors.success + '30'}
                                    strokeColor={colors.success}
                                    strokeWidth={2}
                                />
                                <Marker
                                    coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                                    onPress={() => setSelectedZone(zone)}
                                >
                                    <View style={[styles.zoneMarker, { backgroundColor: colors.success }]}>
                                        <Ionicons name={zone.type === 'home' ? 'home' : 'location'} size={14} color="#fff" />
                                    </View>
                                </Marker>
                            </React.Fragment>
                        ))}
                    </MapView>
                </View>
            )}

            {selectedZone && (
                <View style={[styles.selectedZoneCard, { backgroundColor: colors.background }]}>
                    <View style={styles.zoneCardHeader}>
                        <View style={styles.zoneCardTitle}>
                            <Ionicons name={selectedZone.type === 'home' ? 'home' : 'location'} size={20} color={colors.primary} />
                            <Text style={[styles.zoneCardName, { color: colors.text }]}>{selectedZone.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedZone(null)}>
                            <Ionicons name="close" size={20} color={colors.gray} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.zoneCardDetail, { color: colors.gray }]}>Radius: {selectedZone.radius}m</Text>
                    <Text style={[styles.zoneCardDetail, { color: colors.gray }]}>Distance: {getDistanceToZone(selectedZone) || 'N/A'}</Text>
                    <View style={styles.zoneCardActions}>
                        <TouchableOpacity
                            style={[styles.zoneCardBtn, { backgroundColor: colors.primary }]}
                            onPress={() => openInMaps(selectedZone.latitude, selectedZone.longitude, selectedZone.name)}
                        >
                            <Ionicons name="navigate" size={16} color="#fff" />
                            <Text style={styles.zoneCardBtnText}>Navigate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.zoneCardBtn, { backgroundColor: colors.error }]}
                            onPress={() => handleRemoveSafeZone(selectedZone.id)}
                        >
                            <Ionicons name="trash" size={16} color="#fff" />
                            <Text style={styles.zoneCardBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                    if (!location) {
                        Alert.alert('Error', 'Current location not available');
                        return;
                    }
                    setShowAddZoneModal(true);
                }}
            >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add Current Location as Safe Zone</Text>
            </TouchableOpacity>

            <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="shield-checkmark" size={20} color={geofenceMonitoring ? colors.success : colors.gray} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Monitor Safe Zones</Text>
                </View>
                <Switch
                    value={geofenceMonitoring}
                    onValueChange={toggleGeofenceMonitoring}
                    trackColor={{ false: colors.gray, true: colors.success }}
                    thumbColor="#fff"
                    disabled={!permissionStatus.background}
                />
            </View>
            {!permissionStatus.background && (
                <Text style={[styles.helperText, { color: colors.warning }]}>
                    Background location required for monitoring
                </Text>
            )}

            {safeZones.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={48} color={colors.gray} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Safe Zones Yet</Text>
                    <Text style={[styles.emptyDescription, { color: colors.gray }]}>
                        Add your current location to create your first safe zone
                    </Text>
                </View>
            )}
        </View>
    );

    const renderDynamicRouteContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Dynamic Route Monitoring</Text>

            {!routeActive ? (
                <>
                    <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                        <Ionicons name="search" size={20} color={colors.gray} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Enter destination address"
                            placeholderTextColor={colors.gray}
                            value={routeDestination}
                            onChangeText={(text) => {
                                setRouteDestination(text);
                                setRouteError(null);
                            }}
                            onSubmitEditing={handleDestinationSearch}
                            returnKeyType="search"
                        />
                        {routeDestination.length > 0 && (
                            <TouchableOpacity onPress={() => setRouteDestination('')}>
                                <Ionicons name="close-circle" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {routeError && (
                        <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="alert-circle" size={16} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error }]}>{routeError}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleDestinationSearch}
                        disabled={loading || !routeDestination.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Find Routes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {currentRoute?.options && currentRoute.options.length > 0 && (
                        <View style={styles.routeOptionsContainer}>
                            <Text style={[styles.subsectionTitle, { color: colors.text }]}>Available Routes</Text>
                            {currentRoute.options.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.routeOption,
                                        { backgroundColor: colors.background },
                                        selectedRouteOption?.id === option.id && { borderColor: colors.primary, borderWidth: 2 },
                                    ]}
                                    onPress={() => handleSelectRouteOption(option)}
                                >
                                    <View style={styles.routeOptionHeader}>
                                        <View style={styles.routeOptionTitle}>
                                            <Text style={[styles.routeOptionName, { color: colors.text }]}>{option.name}</Text>
                                            <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(option.safetyScore) + '20' }]}>
                                                <Text style={[styles.safetyScore, { color: getSafetyColor(option.safetyScore) }]}>
                                                    {option.safetyScore ? option.safetyScore.toFixed(0) : '?'}%
                                                </Text>
                                            </View>
                                        </View>
                                        {selectedRouteOption?.id === option.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                        )}
                                    </View>
                                    <Text style={[styles.routeOptionDesc, { color: colors.gray }]}>{option.description || ''}</Text>
                                    <View style={styles.routeOptionStats}>
                                        <View style={styles.routeStat}>
                                            <Ionicons name="walk" size={14} color={colors.gray} />
                                            <Text style={[styles.routeStatText, { color: colors.gray }]}>
                                                {option.distance ? (option.distance * 1000).toFixed(0) : '?'}m
                                            </Text>
                                        </View>
                                        <View style={styles.routeStat}>
                                            <Ionicons name="time" size={14} color={colors.gray} />
                                            <Text style={[styles.routeStatText, { color: colors.gray }]}>
                                                ~{option.estimatedTime || '?'} min
                                            </Text>
                                        </View>
                                    </View>
                                    {option.riskFactors && option.riskFactors.length > 0 && (
                                        <View style={styles.riskFactors}>
                                            {option.riskFactors.slice(0, 2).map((risk, idx) => (
                                                <View key={idx} style={[styles.riskTag, { backgroundColor: colors.warning + '20' }]}>
                                                    <Text style={[styles.riskTagText, { color: colors.warning }]}>{risk}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {selectedRouteOption && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.success, marginTop: 12 }]}
                            onPress={handleStartRouteMonitoring}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Start Navigation</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <View>
                    <View style={[styles.activeRouteCard, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                        <View style={styles.activeRouteHeader}>
                            <View style={[styles.activeIndicator, { backgroundColor: colors.success }]} />
                            <Text style={[styles.activeRouteTitle, { color: colors.text }]}>Route Active</Text>
                        </View>
                        <Text style={[styles.activeRouteDest, { color: colors.text }]}>To: {routeDestination}</Text>
                        {currentRoute?.selected && (
                            <View style={styles.activeRouteStats}>
                                <View style={styles.routeStat}>
                                    <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                                    <Text style={[styles.routeStatText, { color: colors.text }]}>
                                        Safety: {currentRoute.selected.safetyScore ? currentRoute.selected.safetyScore.toFixed(0) : '?'}%
                                    </Text>
                                </View>
                                <View style={styles.routeStat}>
                                    <Ionicons name="time" size={18} color={colors.primary} />
                                    <Text style={[styles.routeStatText, { color: colors.text }]}>
                                        ~{currentRoute.selected.estimatedTime || '?'} min
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {rerouteSuggestion && (
                        <View style={[styles.rerouteAlert, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                            <Ionicons name="warning" size={24} color={colors.warning} />
                            <View style={styles.rerouteContent}>
                                <Text style={[styles.rerouteTitle, { color: colors.text }]}>High Risk Detected</Text>
                                <Text style={[styles.rerouteText, { color: colors.gray }]}>
                                    Alternative route suggested for your safety
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.error }]}
                        onPress={handleStopRouteMonitoring}
                    >
                        <Ionicons name="stop-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Stop Navigation</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderDarknessContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>Smart Darkness Reminders</Text>

            {sunLoading ? (
                <View style={styles.sunLoadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.sunLoadingText, { color: colors.gray }]}>Checking sun status...</Text>
                </View>
            ) : sunStatus ? (
                <View style={[styles.sunStatusCard, { backgroundColor: colors.background }]}>
                    <View style={[
                        styles.sunIconContainer,
                        { backgroundColor: sunStatus.status === 'day' ? colors.warning + '20' : colors.primary + '20' }
                    ]}>
                        <Ionicons
                            name={sunStatus.status === 'day' ? 'sunny' : 'moon'}
                            size={48}
                            color={sunStatus.status === 'day' ? colors.warning : colors.primary}
                        />
                    </View>
                    <Text style={[styles.sunStatusText, { color: colors.text }]}>
                        Currently: {sunStatus.status ? sunStatus.status.toUpperCase() : 'UNKNOWN'}
                    </Text>
                    {sunStatus.status === 'day' && sunStatus.timeToSunset && sunStatus.timeToSunset > 0 && (
                        <Text style={[styles.sunTimeText, { color: colors.gray }]}>
                            Sunset in: {Math.round(sunStatus.timeToSunset / 60000)} minutes
                        </Text>
                    )}
                    {sunStatus.status === 'night' && sunStatus.timeToSunrise && sunStatus.timeToSunrise > 0 && (
                        <Text style={[styles.sunTimeText, { color: colors.gray }]}>
                            Sunrise in: {Math.round(sunStatus.timeToSunrise / 60000)} minutes
                        </Text>
                    )}
                    {sunStatus.sunTimes && (
                        <>
                            {sunStatus.sunTimes.sunrise && (
                                <Text style={[styles.sunTimeText, { color: colors.gray }]}>
                                    Sunrise: {new Date(sunStatus.sunTimes.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                            {sunStatus.sunTimes.sunset && (
                                <Text style={[styles.sunTimeText, { color: colors.gray }]}>
                                    Sunset: {new Date(sunStatus.sunTimes.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </>
                    )}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="cloud-offline" size={48} color={colors.gray} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to get sun status</Text>
                    <TouchableOpacity onPress={checkSunStatus}>
                        <Text style={[styles.retryText, { color: colors.primary }]}>Tap to retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="notifications" size={20} color={darknessEnabled ? colors.primary : colors.gray} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Reminders</Text>
                </View>
                <Switch
                    value={darknessEnabled}
                    onValueChange={toggleDarknessReminders}
                    trackColor={{ false: colors.gray, true: colors.primary }}
                    thumbColor="#fff"
                />
            </View>

            <View style={styles.journeyButtons}>
                {!journeyActive ? (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
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
                        style={[styles.actionButton, { backgroundColor: colors.error, flex: 1 }]}
                        onPress={handleEndJourney}
                    >
                        <Ionicons name="stop-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>End Journey</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderARContent = () => (
        <View style={[styles.featureContent, { backgroundColor: colors.card, ...shadows.medium }]}>
            <Text style={[styles.featureSectionTitle, { color: colors.text }]}>AR Escape Guidance</Text>

            <Text style={[styles.featureDescription, { color: colors.gray, marginBottom: 16 }]}>
                View safe directions and nearby help points
            </Text>

            <View style={styles.arButtonsContainer}>
                <TouchableOpacity
                    style={[styles.arButton, { backgroundColor: colors.primary }]}
                    onPress={handleShowARView}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="scan" size={24} color="#fff" />
                            <Text style={styles.arButtonText}>Open AR View</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.arButton, { backgroundColor: colors.success }]}
                    onPress={handleCalculateEscapeRoute}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="flash" size={24} color="#fff" />
                            <Text style={styles.arButtonText}>Find Escape</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {arPoints.length > 0 && (
                <View style={styles.arPointsList}>
                    <Text style={[styles.subsectionTitle, { color: colors.text }]}>Nearby Safe Points:</Text>
                    {arPoints.slice(0, 5).map((point, index) => (
                        <View key={point.id || index} style={[styles.arPointItem, { backgroundColor: colors.background }]}>
                            <View style={[styles.arPointIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name={point.icon || 'location'} size={18} color={colors.primary} />
                            </View>
                            <View style={styles.arPointInfo}>
                                <Text style={[styles.arPointName, { color: colors.text }]}>{point.name || 'Safe Point'}</Text>
                                <Text style={[styles.arPointDistance, { color: colors.gray }]}>{point.distanceText || 'Unknown distance'}</Text>
                            </View>
                            {point.latitude && point.longitude && (
                                <TouchableOpacity
                                    style={[styles.arPointNav, { backgroundColor: colors.primary }]}
                                    onPress={() => openInMaps(point.latitude, point.longitude, point.name)}
                                >
                                    <Ionicons name="navigate" size={14} color="#fff" />
                                </TouchableOpacity>
                            )}
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
                        <View style={[styles.parkingIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="car" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.parkingAddress, { color: colors.text }]}>
                            {parkingAddress || 'Saved location'}
                        </Text>
                        {parkingLocation.notes && (
                            <Text style={[styles.parkingNotes, { color: colors.gray }]}>
                                Note: {parkingLocation.notes}
                            </Text>
                        )}
                        <Text style={[styles.parkingTime, { color: colors.gray }]}>
                            Saved: {parkingLocation.savedAt ? new Date(parkingLocation.savedAt).toLocaleString() : 'Unknown'}
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
                            style={[styles.parkingActionBtn, { backgroundColor: colors.success }]}
                            onPress={handleShareParking}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="share" size={20} color="#fff" />
                                    <Text style={styles.parkingActionText}>Share</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.parkingActionBtn, { backgroundColor: colors.error }]}
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
                        onPress={() => {
                            if (!location) {
                                Alert.alert('Error', 'Current location not available');
                                return;
                            }
                            setShowParkingModal(true);
                        }}
                    >
                        <Ionicons name="locate" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Save Current Location</Text>
                    </TouchableOpacity>
                </>
            )}

            <View style={styles.contactsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                        Trusted Contacts ({trustedContacts.length})
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Text style={[styles.manageText, { color: colors.primary }]}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {trustedContacts.length > 0 ? (
                    trustedContacts.slice(0, 3).map((contact) => (
                        <View key={contact.id || contact.phone} style={[styles.contactItem, { backgroundColor: colors.background }]}>
                            <View style={[styles.contactAvatar, { backgroundColor: colors.success }]}>
                                <Text style={styles.contactInitial}>
                                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                <Text style={[styles.contactPhone, { color: colors.gray }]}>{contact.phone}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: colors.gray }]}>
                        No trusted contacts added yet
                    </Text>
                )}
            </View>
        </View>
    );

    const renderAddZoneModal = () => (
        <Modal visible={showAddZoneModal} transparent animationType="slide">
            <View style={[styles.modalOverlay]}>
                <TouchableOpacity 
                    style={styles.modalOverlayTouch} 
                    activeOpacity={1} 
                    onPress={() => Keyboard.dismiss()}
                />
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Safe Zone</Text>
                        <TouchableOpacity onPress={() => setShowAddZoneModal(false)}>
                            <Ionicons name="close" size={24} color={colors.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.currentLocationPreview, { backgroundColor: colors.background }]}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <Text style={[styles.currentLocationText, { color: colors.text }]} numberOfLines={1}>
                            {address || 'Current location'}
                        </Text>
                    </View>

                    <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="Zone name (e.g., Home, Office)"
                        placeholderTextColor={colors.gray}
                        value={newZoneName}
                        onChangeText={setNewZoneName}
                        autoFocus
                    />

                    <View style={styles.radiusSelector}>
                        <Text style={[styles.radiusLabel, { color: colors.text }]}>Radius:</Text>
                        <View style={styles.radiusOptions}>
                            {['50', '100', '200', '500'].map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[
                                        styles.radiusOption,
                                        { backgroundColor: newZoneRadius === r ? colors.primary : colors.background },
                                    ]}
                                    onPress={() => setNewZoneRadius(r)}
                                >
                                    <Text style={[
                                        styles.radiusOptionText,
                                        { color: newZoneRadius === r ? '#fff' : colors.text }
                                    ]}>
                                        {r}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.background }]}
                            onPress={() => setShowAddZoneModal(false)}
                        >
                            <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalBtn,
                                { backgroundColor: colors.primary, opacity: loading || !newZoneName.trim() ? 0.7 : 1 }
                            ]}
                            onPress={handleAddSafeZone}
                            disabled={loading || !newZoneName.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add Zone</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderParkingModal = () => (
        <Modal visible={showParkingModal} transparent animationType="slide">
            <View style={[styles.modalOverlay]}>
                <TouchableOpacity 
                    style={styles.modalOverlayTouch} 
                    activeOpacity={1} 
                    onPress={() => Keyboard.dismiss()}
                />
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Save Parking Location</Text>
                        <TouchableOpacity onPress={() => setShowParkingModal(false)}>
                            <Ionicons name="close" size={24} color={colors.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.currentLocationPreview, { backgroundColor: colors.background }]}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <Text style={[styles.currentLocationText, { color: colors.text }]} numberOfLines={1}>
                            {address || 'Current location'}
                        </Text>
                    </View>

                    <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="Add a note (optional)"
                        placeholderTextColor={colors.gray}
                        value={parkingNotes}
                        onChangeText={setParkingNotes}
                        multiline
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.background }]}
                            onPress={() => setShowParkingModal(false)}
                        >
                            <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalBtn,
                                { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }
                            ]}
                            onPress={handleSaveParking}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (initialLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingTitle, { color: colors.text }]}>Loading Smart Location</Text>
                <Text style={[styles.loadingSubtitle, { color: colors.gray }]}>Initializing features...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Location</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                        Advanced location-based safety features
                    </Text>
                </View>

                {renderPermissionBanner()}

                {location && (
                    <View style={[styles.locationBadge, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Ionicons name="location" size={16} color={colors.success} />
                        <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                            {address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                        </Text>
                        <TouchableOpacity onPress={getCurrentLocation}>
                            <Ionicons name="refresh" size={16} color={colors.gray} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.featuresGrid}>
                    <TouchableOpacity
                        style={[
                            styles.featureCard,
                            { backgroundColor: colors.card, ...shadows.medium },
                            activeFeature === FEATURE_KEYS.GEOFENCING && { borderColor: colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => setActiveFeature(activeFeature === FEATURE_KEYS.GEOFENCING ? null : FEATURE_KEYS.GEOFENCING)}
                    >
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Safe Zones</Text>
                        <Text style={[styles.featureDescription, { color: colors.gray }]}>
                            {safeZones.length} zones configured
                        </Text>
                        {geofenceMonitoring && (
                            <View style={styles.activeBadge}>
                                <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                                <Text style={[styles.activeText, { color: colors.success }]}>Monitoring</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.featureCard,
                            { backgroundColor: colors.card, ...shadows.medium },
                            activeFeature === FEATURE_KEYS.ROUTE && { borderColor: colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => setActiveFeature(activeFeature === FEATURE_KEYS.ROUTE ? null : FEATURE_KEYS.ROUTE)}
                    >
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="navigate" size={24} color={colors.info} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Dynamic Routes</Text>
                        <Text style={[styles.featureDescription, { color: colors.gray }]}>
                            AI-powered safe routing
                        </Text>
                        {routeActive && (
                            <View style={styles.activeBadge}>
                                <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                                <Text style={[styles.activeText, { color: colors.success }]}>Active</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.featureCard,
                            { backgroundColor: colors.card, ...shadows.medium },
                            activeFeature === FEATURE_KEYS.DARKNESS && { borderColor: colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => setActiveFeature(activeFeature === FEATURE_KEYS.DARKNESS ? null : FEATURE_KEYS.DARKNESS)}
                    >
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="moon" size={24} color={colors.warning} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Darkness Alerts</Text>
                        <Text style={[styles.featureDescription, { color: colors.gray }]}>
                            Sunset journey reminders
                        </Text>
                        {journeyActive && (
                            <View style={styles.activeBadge}>
                                <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                                <Text style={[styles.activeText, { color: colors.success }]}>Journey Active</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.featureCard,
                            { backgroundColor: colors.card, ...shadows.medium },
                            activeFeature === FEATURE_KEYS.AR && { borderColor: colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => setActiveFeature(activeFeature === FEATURE_KEYS.AR ? null : FEATURE_KEYS.AR)}
                    >
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                            <Ionicons name="scan" size={24} color={colors.secondary} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>AR Guidance</Text>
                        <Text style={[styles.featureDescription, { color: colors.gray }]}>
                            Visual escape directions
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.featureCard,
                            { backgroundColor: colors.card, ...shadows.medium },
                            activeFeature === FEATURE_KEYS.PARKING && { borderColor: colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => setActiveFeature(activeFeature === FEATURE_KEYS.PARKING ? null : FEATURE_KEYS.PARKING)}
                    >
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="car" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Parked Car</Text>
                        <Text style={[styles.featureDescription, { color: colors.gray }]}>
                            {parkingLocation ? 'Location saved' : 'Save parking spot'}
                        </Text>
                        {parkingLocation && (
                            <View style={styles.activeBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                <Text style={[styles.activeText, { color: colors.success }]}>Saved</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {activeFeature === FEATURE_KEYS.GEOFENCING && renderGeofencingContent()}
                {activeFeature === FEATURE_KEYS.ROUTE && renderDynamicRouteContent()}
                {activeFeature === FEATURE_KEYS.DARKNESS && renderDarknessContent()}
                {activeFeature === FEATURE_KEYS.AR && renderARContent()}
                {activeFeature === FEATURE_KEYS.PARKING && renderParkingContent()}

                <View style={styles.footer} />
            </ScrollView>

            {renderAddZoneModal()}
            {renderParkingModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
    loadingTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    loadingSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    permissionText: {
        flex: 1,
        fontSize: 13,
    },
    permissionAction: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    locationText: {
        flex: 1,
        fontSize: 13,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    featureCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    featureIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    featureContent: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    statsBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '600',
    },
    miniMap: {
        height: 180,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    currentLocationMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    zoneMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    selectedZoneCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    zoneCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    zoneCardTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    zoneCardName: {
        fontSize: 16,
        fontWeight: '600',
    },
    zoneCardDetail: {
        fontSize: 13,
        marginBottom: 4,
    },
    zoneCardActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    zoneCardBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    zoneCardBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        marginTop: 12,
    },
    settingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    helperText: {
        fontSize: 12,
        marginTop: -8,
        marginBottom: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptyDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
    },
    routeOptionsContainer: {
        marginTop: 16,
    },
    subsectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    routeOption: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    routeOptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeOptionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeOptionName: {
        fontSize: 15,
        fontWeight: '600',
    },
    safetyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    safetyScore: {
        fontSize: 12,
        fontWeight: '600',
    },
    routeOptionDesc: {
        fontSize: 13,
        marginBottom: 8,
    },
    routeOptionStats: {
        flexDirection: 'row',
        gap: 16,
    },
    routeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    routeStatText: {
        fontSize: 13,
    },
    riskFactors: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    riskTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    riskTagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    activeRouteCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    activeRouteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeRouteTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeRouteDest: {
        fontSize: 14,
        marginBottom: 12,
    },
    activeRouteStats: {
        flexDirection: 'row',
        gap: 24,
    },
    rerouteAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        gap: 12,
    },
    rerouteContent: {
        flex: 1,
    },
    rerouteTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    rerouteText: {
        fontSize: 13,
        marginTop: 2,
    },
    sunLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 8,
    },
    sunLoadingText: {
        fontSize: 14,
    },
    sunStatusCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 12,
        marginBottom: 16,
    },
    sunIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    sunStatusText: {
        fontSize: 20,
        fontWeight: '600',
    },
    sunTimeText: {
        fontSize: 14,
        marginTop: 4,
    },
    journeyButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    arButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    arButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 12,
        gap: 8,
    },
    arButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    arPointsList: {
        marginTop: 8,
    },
    arPointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    arPointIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arPointInfo: {
        flex: 1,
    },
    arPointName: {
        fontSize: 14,
        fontWeight: '500',
    },
    arPointDistance: {
        fontSize: 12,
    },
    arPointNav: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    parkingInfoCard: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    parkingIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    parkingAddress: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    parkingNotes: {
        fontSize: 13,
        marginTop: 4,
        fontStyle: 'italic',
    },
    parkingTime: {
        fontSize: 12,
        marginTop: 8,
    },
    parkingActions: {
        flexDirection: 'row',
        gap: 12,
    },
    parkingActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    parkingActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    contactsSection: {
        marginTop: 20,
    },
    manageText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '500',
    },
    contactPhone: {
        fontSize: 13,
    },
    footer: {
        height: 100,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlayTouch: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    currentLocationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 16,
    },
    currentLocationText: {
        flex: 1,
        fontSize: 14,
    },
    modalInput: {
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        marginBottom: 16,
        borderWidth: 1,
    },
    radiusSelector: {
        marginBottom: 20,
    },
    radiusLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 10,
    },
    radiusOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    radiusOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    radiusOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SmartLocationScreen;
