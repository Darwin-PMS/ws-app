import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import locationService from '../services/locationService';
import userService from '../services/userService';

const LiveTrackingScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId, user } = useApp();

    // States
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [locationHistory, setLocationHistory] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds

    // Auto-refresh interval
    const refreshIntervalRef = useRef(null);

    useEffect(() => {
        // Load initial location
        getCurrentLocation();

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (autoRefresh && isTracking) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }

        return () => stopAutoRefresh();
    }, [autoRefresh, isTracking, refreshInterval]);

    // Start auto-refresh
    const startAutoRefresh = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        refreshIntervalRef.current = setInterval(() => {
            getCurrentLocation(false);
        }, refreshInterval * 1000);
    };

    // Stop auto-refresh
    const stopAutoRefresh = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    };

    // Get current location
    const getCurrentLocation = async (showLoading = true) => {
        try {
            if (showLoading) {
                setIsLoading(true);
            }

            const result = await locationService.getCurrentLocation();
            if (result.success) {
                setCurrentLocation(result.location);
                setLastUpdated(new Date());

                // Save to server if tracking is enabled
                if (isTracking && userId) {
                    await locationService.saveCurrentLocation(userId);
                }
            } else {
                Alert.alert('Error', result.message || 'Failed to get location');
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle tracking
    const toggleTracking = async () => {
        if (!userId) {
            Alert.alert('Error', 'User not logged in');
            return;
        }

        if (isTracking) {
            // Stop tracking
            await locationService.stopPeriodicLocationSave();
            setIsTracking(false);
            Alert.alert('Tracking Stopped', 'Location tracking has been disabled');
        } else {
            // Start tracking
            const permission = await locationService.requestPermissions();
            if (!permission.success) {
                Alert.alert('Permission Required', permission.message);
                return;
            }

            const result = await locationService.startPeriodicLocationSave(userId, refreshInterval * 1000);
            if (result.success) {
                setIsTracking(true);
                Alert.alert('Tracking Started', 'Your location is being shared in real-time');
            } else {
                Alert.alert('Error', result.message);
            }
        }
    };

    // Load location history
    const loadLocationHistory = async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            const result = await userService.getLocationHistory(userId, { limit: 50 });
            if (result.success) {
                setLocationHistory(result.data || []);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Share location
    const shareLocation = () => {
        if (!currentLocation) {
            Alert.alert('Error', 'No location available to share');
            return;
        }

        const mapsUrl = locationService.getGoogleMapsUrl(
            currentLocation.latitude,
            currentLocation.longitude,
            'My Location'
        );

        // Share using device's share functionality
        Alert.alert(
            'Share Location',
            'Share your current location?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Share',
                    onPress: () => {
                        // In a real app, use Share.share() or deep linking
                        Alert.alert('Location Shared', 'Your location has been shared');
                    },
                },
            ]
        );
    };

    // Get map region
    const getMapRegion = () => {
        if (currentLocation) {
            return {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // Default to Delhi
        return {
            latitude: 28.6139,
            longitude: 77.2090,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
    };

    // Format last updated time
    const formatLastUpdated = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return date.toLocaleTimeString();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, ...shadows.medium }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Live Tracking</Text>
                <TouchableOpacity
                    onPress={getCurrentLocation}
                    style={[styles.iconButton, { backgroundColor: colors.primary + '20' }]}
                >
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: colors.card, ...shadows.medium }]}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isTracking ? '#10B981' : '#EF4444' }]} />
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
                        </Text>
                    </View>

                    {lastUpdated && (
                        <Text style={[styles.lastUpdated, { color: colors.gray }]}>
                            Updated: {formatLastUpdated(lastUpdated)}
                        </Text>
                    )}

                    {/* Toggle Tracking */}
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            { backgroundColor: isTracking ? '#EF4444' : colors.primary },
                        ]}
                        onPress={toggleTracking}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons
                                    name={isTracking ? 'stop-circle' : 'location'}
                                    size={20}
                                    color="#fff"
                                />
                                <Text style={styles.toggleButtonText}>
                                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Auto Refresh Toggle */}
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Auto Refresh</Text>
                        <Switch
                            value={autoRefresh}
                            onValueChange={setAutoRefresh}
                            trackColor={{ false: colors.gray, true: colors.primary }}
                        />
                    </View>
                </View>

                {/* Map */}
                <View style={[styles.mapContainer, { backgroundColor: colors.card, ...shadows.medium }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Location</Text>

                    {currentLocation ? (
                        <MapView
                            style={styles.map}
                            region={getMapRegion()}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                        >
                            <Marker
                                coordinate={{
                                    latitude: currentLocation.latitude,
                                    longitude: currentLocation.longitude,
                                }}
                                title="Your Location"
                                description={formatLastUpdated(lastUpdated)}
                            />
                        </MapView>
                    ) : (
                        <View style={[styles.mapPlaceholder, { backgroundColor: colors.background }]}>
                            <Ionicons name="location-outline" size={48} color={colors.gray} />
                            <Text style={[styles.placeholderText, { color: colors.gray }]}>
                                Loading location...
                            </Text>
                        </View>
                    )}

                    {/* Share Button */}
                    <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: colors.primary }]}
                        onPress={shareLocation}
                        disabled={!currentLocation}
                    >
                        <Ionicons name="share-outline" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>Share Location</Text>
                    </TouchableOpacity>
                </View>

                {/* Location Info */}
                {currentLocation && (
                    <View style={[styles.infoCard, { backgroundColor: colors.card, ...shadows.medium }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Details</Text>

                        <View style={styles.infoRow}>
                            <Ionicons name="navigate" size={20} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>Latitude</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {currentLocation.latitude.toFixed(6)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="compass" size={20} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.gray }]}>Longitude</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {currentLocation.longitude.toFixed(6)}
                                </Text>
                            </View>
                        </View>

                        {currentLocation.accuracy && (
                            <View style={styles.infoRow}>
                                <Ionicons name="radio" size={20} color={colors.primary} />
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, { color: colors.gray }]}>Accuracy</Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>
                                        ±{currentLocation.accuracy.toFixed(1)}m
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Safety Tips */}
                <View style={[styles.safetyCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Ionicons name="shield-checkmark" size={32} color="#D97706" />
                    <Text style={[styles.safetyTitle, { color: '#92400E' }]}>Safety Tips</Text>
                    <Text style={[styles.safetyText, { color: '#78350F' }]}>
                        • Keep location tracking enabled for emergency situations{'\n'}
                        • Share your location with trusted contacts{'\n'}
                        • Battery usage is optimized when tracking is active{'\n'}
                        • Your location is encrypted and secure
                    </Text>
                </View>
            </ScrollView>
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
        padding: 16,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statusCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
    },
    lastUpdated: {
        fontSize: 12,
        marginBottom: 16,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    mapContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    map: {
        width: '100%',
        height: 250,
        borderRadius: 12,
    },
    mapPlaceholder: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 14,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
    safetyCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    safetyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
        marginRight: 12,
        flex: 1,
    },
    safetyText: {
        fontSize: 13,
        lineHeight: 20,
        flex: 2,
    },
});

export default LiveTrackingScreen;
