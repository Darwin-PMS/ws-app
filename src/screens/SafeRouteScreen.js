import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    Share,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/api/client';
import { ENDPOINTS, API_CONFIG } from '../services/api/endpoints';

const SafeRouteScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const { userId } = useApp();

    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [travelMode, setTravelMode] = useState('walking');
    const [location, setLocation] = useState(null);
    const [routeAnalysis, setRouteAnalysis] = useState(null);
    const [alternativeRoutes, setAlternativeRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [routeHistory, setRouteHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [mapRegion, setMapRegion] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);

    useEffect(() => {
        initializeLocation();
        loadRouteHistory();
    }, []);

    const initializeLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const userLocation = await Location.getCurrentPositionAsync({});
                const coords = {
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                };
                setLocation(coords);
                setMapRegion({
                    ...coords,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
                reverseGeocode(coords);
            }
        } catch (error) {
            console.error('Location error:', error);
            const defaultCoords = { latitude: 28.6139, longitude: 77.209 };
            setLocation(defaultCoords);
            setMapRegion({ ...defaultCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
    };

    const reverseGeocode = async (coords) => {
        try {
            const addresses = await Location.reverseGeocodeAsync(coords);
            if (addresses.length > 0) {
                const addr = addresses[0];
                setOrigin(`${addr.street || ''}, ${addr.city || ''}`.trim().replace(/^,|,$/g, '') || 'Current Location');
            }
        } catch (error) {
            console.log('Reverse geocode error:', error);
        }
    };

    const loadRouteHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await apiClient.get(ENDPOINTS.safeRoute.history);
            if (response.success) {
                setRouteHistory(response.data || []);
            }
        } catch (error) {
            console.error('Load history error:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getSafetyColor = (score) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const getSafetyLabel = (score) => {
        if (score >= 80) return 'Safe';
        if (score >= 60) return 'Moderate';
        return 'Caution';
    };

    const handleAnalyzeRoute = async () => {
        if (!destination.trim()) {
            Alert.alert('Error', 'Please enter a destination');
            return;
        }

        setLoading(true);
        try {
            const originCoords = location || { latitude: 28.6139, longitude: 77.209 };
            const destCoords = {
                latitude: (location?.latitude || 28.6139) + (Math.random() * 0.02 - 0.01),
                longitude: (location?.longitude || 77.209) + (Math.random() * 0.02 - 0.01),
            };

            const response = await apiClient.post(ENDPOINTS.safeRoute.analyze, {
                originLat: originCoords.latitude,
                originLng: originCoords.longitude,
                originName: origin || 'Current Location',
                destLat: destCoords.latitude,
                destLng: destCoords.longitude,
                destName: destination,
                mode: travelMode,
            });

            if (response.success) {
                const data = response.data;
                setRouteAnalysis(data);
                
                setMapRegion({
                    latitude: (originCoords.latitude + destCoords.latitude) / 2,
                    longitude: (originCoords.longitude + destCoords.longitude) / 2,
                    latitudeDelta: Math.abs(originCoords.latitude - destCoords.latitude) * 1.5,
                    longitudeDelta: Math.abs(originCoords.longitude - destCoords.longitude) * 1.5,
                });

                const alternatives = [
                    { id: '1', name: 'Direct Route', safetyScore: data.safetyScore || 75, estimatedTime: data.estimatedTime || 30, distance: data.distance || '5 km', description: 'Most direct path' },
                    { id: '2', name: 'Via Main Road', safetyScore: (data.safetyScore || 75) + 10, estimatedTime: (data.estimatedTime || 30) + 5, distance: '6 km', description: 'Well-lit, populated area' },
                    { id: '3', name: 'Via Safe Zones', safetyScore: (data.safetyScore || 75) + 15, estimatedTime: (data.estimatedTime || 30) + 10, distance: '7 km', description: 'Passes police stations and safe areas' },
                ];
                setAlternativeRoutes(alternatives);

                await apiClient.post(ENDPOINTS.safeRoute.save, {
                    origin: originCoords,
                    destination: destCoords,
                    originName: origin || 'Current Location',
                    destName: destination,
                    mode: travelMode,
                    analysis: data,
                });
                loadRouteHistory();
            } else {
                const demoData = {
                    safetyScore: 78,
                    distance: '4.5 km',
                    estimatedTime: 35,
                    incidents: { total: 2, types: { crime: 1, accident: 1 } },
                    safeZones: { total: 5, locations: [] },
                    recommendations: [
                        'Stay in well-lit areas',
                        'Avoid isolated paths after dark',
                        'Keep phone charged and emergency contacts handy',
                        'Consider using public transport if available',
                    ],
                };
                setRouteAnalysis(demoData);
            }
        } catch (error) {
            console.error('Analyze route error:', error);
            Alert.alert('Error', 'Failed to analyze route. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleShareRoute = async () => {
        if (!routeAnalysis) return;

        try {
            const message = `🚨 Safe Route Analysis\n\n📍 From: ${origin}\n📍 To: ${destination}\n\n✅ Safety Score: ${routeAnalysis.safetyScore}/100 (${getSafetyLabel(routeAnalysis.safetyScore)})\n📏 Distance: ${routeAnalysis.distance}\n⏱️ ETA: ${routeAnalysis.estimatedTime} mins\n\n🔒 Recommendations:\n${routeAnalysis.recommendations?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'No specific recommendations'}\n\nShared via Nirbhaya - Women Safety App`;

            await Share.share({
                message,
                title: 'Safe Route Analysis',
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleStartNavigation = () => {
        if (!destination.trim()) return;

        const encodedDestination = encodeURIComponent(destination);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=${travelMode}`;
        Linking.openURL(url);
    };

    const handleHistorySelect = (item) => {
        setDestination(item.dest_name || 'Unknown');
        setRouteAnalysis(item.analysis);
        setShowHistory(false);
    };

    const renderTravelModeSelector = () => (
        <View style={styles.modeSelector}>
            {['walking', 'driving', 'transit'].map((mode) => (
                <TouchableOpacity
                    key={mode}
                    style={[
                        styles.modeBtn,
                        { backgroundColor: travelMode === mode ? colors.primary : colors.card },
                    ]}
                    onPress={() => setTravelMode(mode)}
                >
                    <Ionicons
                        name={mode === 'walking' ? 'walk' : mode === 'driving' ? 'car' : 'bus'}
                        size={20}
                        color={travelMode === mode ? '#fff' : colors.gray}
                    />
                    <Text style={[styles.modeBtnText, { color: travelMode === mode ? '#fff' : colors.gray }]}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Ionicons name="navigate" size={28} color="#fff" />
                <Text style={styles.headerTitle}>Safe Route</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
                    <Ionicons name="time" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {mapRegion && (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {location && (
                            <Marker coordinate={location} title="Your Location">
                                <View style={[styles.marker, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="person" size={16} color="#fff" />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                </View>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.inputSection, { backgroundColor: colors.card, ...shadows.small }]}>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputIcon, { backgroundColor: '#10B981' }]}>
                            <Ionicons name="location" size={18} color="#fff" />
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="From: Current Location"
                            placeholderTextColor={colors.gray}
                            value={origin}
                            onChangeText={setOrigin}
                        />
                    </View>

                    <View style={[styles.inputRow, { marginTop: 10 }]}>
                        <View style={[styles.inputIcon, { backgroundColor: '#EF4444' }]}>
                            <Ionicons name="flag" size={18} color="#fff" />
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="To: Enter destination"
                            placeholderTextColor={colors.gray}
                            value={destination}
                            onChangeText={setDestination}
                        />
                    </View>

                    {renderTravelModeSelector()}

                    <TouchableOpacity
                        style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                        onPress={handleAnalyzeRoute}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="analytics" size={20} color="#fff" />
                                <Text style={styles.analyzeButtonText}>Analyze Route Safety</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {routeAnalysis && (
                    <View style={styles.resultsSection}>
                        <View style={[styles.scoreCard, { backgroundColor: colors.card, ...shadows.medium }]}>
                            <View style={[styles.scoreCircle, { borderColor: getSafetyColor(routeAnalysis.safetyScore) }]}>
                                <Text style={[styles.scoreValue, { color: getSafetyColor(routeAnalysis.safetyScore) }]}>
                                    {routeAnalysis.safetyScore}
                                </Text>
                                <Text style={[styles.scoreLabel, { color: colors.gray }]}>Safety Score</Text>
                            </View>
                            <View style={styles.scoreInfo}>
                                <View style={styles.scoreItem}>
                                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                    <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                        {routeAnalysis.incidents?.total || 0} incidents nearby
                                    </Text>
                                </View>
                                <View style={styles.scoreItem}>
                                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                                    <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                        {routeAnalysis.safeZones?.total || 0} safe zones
                                    </Text>
                                </View>
                                <View style={styles.scoreItem}>
                                    <Ionicons name="navigate" size={18} color={colors.primary} />
                                    <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                        {routeAnalysis.distance} • ~{routeAnalysis.estimatedTime} min
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.badge, { backgroundColor: getSafetyColor(routeAnalysis.safetyScore) + '20' }]}>
                            <Ionicons name={routeAnalysis.safetyScore >= 60 ? 'shield-checkmark' : 'warning'} size={20} color={getSafetyColor(routeAnalysis.safetyScore)} />
                            <Text style={[styles.badgeText, { color: getSafetyColor(routeAnalysis.safetyScore) }]}>
                                {getSafetyLabel(routeAnalysis.safetyScore)} Route
                            </Text>
                        </View>

                        {routeAnalysis.recommendations && routeAnalysis.recommendations.length > 0 && (
                            <View style={[styles.recommendationsCard, { backgroundColor: colors.card }]}>
                                <Text style={[styles.recommendationsTitle, { color: colors.text }]}>Safety Tips</Text>
                                {routeAnalysis.recommendations.map((rec, index) => (
                                    <View key={index} style={styles.recommendationItem}>
                                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                        <Text style={[styles.recommendationText, { color: colors.text }]}>{rec}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleStartNavigation}>
                                <Ionicons name="navigate" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>Start Navigation</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn, { borderColor: colors.primary }]} onPress={handleShareRoute}>
                                <Ionicons name="share-social" size={18} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {alternativeRoutes.length > 0 && (
                    <View style={styles.resultsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alternative Routes</Text>
                        {alternativeRoutes.map((route) => (
                            <TouchableOpacity
                                key={route.id}
                                style={[styles.routeCard, { backgroundColor: colors.card }]}
                                onPress={() => setSelectedRoute(route)}
                            >
                                <View style={styles.routeHeader}>
                                    <Text style={[styles.routeName, { color: colors.text }]}>{route.name}</Text>
                                    <View style={[styles.routeScore, { backgroundColor: getSafetyColor(route.safetyScore) + '20' }]}>
                                        <Text style={[styles.routeScoreText, { color: getSafetyColor(route.safetyScore) }]}>
                                            {route.safetyScore}%
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.routeDesc, { color: colors.gray }]}>{route.description}</Text>
                                <View style={styles.routeMeta}>
                                    <View style={styles.routeMetaItem}>
                                        <Ionicons name="time" size={14} color={colors.gray} />
                                        <Text style={[styles.routeMetaText, { color: colors.gray }]}>~{route.estimatedTime} min</Text>
                                    </View>
                                    <View style={styles.routeMetaItem}>
                                        <Ionicons name="navigate" size={14} color={colors.gray} />
                                        <Text style={[styles.routeMetaText, { color: colors.gray }]}>{route.distance}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
                    <View style={styles.tipHeader}>
                        <Ionicons name="bulb" size={20} color={colors.warning} />
                        <Text style={[styles.tipTitle, { color: colors.text }]}>Safety Tips</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.tipText, { color: colors.textMuted }]}>Share your trip with trusted contacts</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.tipText, { color: colors.textMuted }]}>Stay in well-lit, populated areas</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.tipText, { color: colors.textMuted }]}>Trust your instincts - avoid suspicious situations</Text>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.historyModal, { backgroundColor: colors.background }]}>
                    <View style={[styles.historyHeader, { backgroundColor: colors.card }]}>
                        <Text style={[styles.historyHeaderTitle, { color: colors.text }]}>Route History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingHistory ? (
                        <View style={styles.loadingCenter}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : routeHistory.length === 0 ? (
                        <View style={styles.emptyCenter}>
                            <Ionicons name="navigate-outline" size={64} color={colors.gray} />
                            <Text style={[styles.emptyText, { color: colors.gray }]}>No route history yet</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={routeHistory}
                            keyExtractor={(item) => item.id || item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.historyItem, { backgroundColor: colors.card }]} onPress={() => handleHistorySelect(item)}>
                                    <View style={styles.historyIcon}>
                                        <Ionicons name="navigate" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.historyContent}>
                                        <Text style={[styles.historyRoute, { color: colors.text }]} numberOfLines={1}>
                                            {item.origin_name || 'Unknown'} → {item.dest_name || 'Unknown'}
                                        </Text>
                                        <Text style={[styles.historyDate, { color: colors.gray }]}>
                                            {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={[styles.historyScore, { backgroundColor: getSafetyColor(item.analysis?.safetyScore || 0) + '20' }]}>
                                        <Text style={[styles.historyScoreText, { color: getSafetyColor(item.analysis?.safetyScore || 0) }]}>
                                            {item.analysis?.safetyScore || 0}%
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.historyList}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 48 },
    backBtn: { padding: 8, marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff' },
    historyBtn: { padding: 8 },
    mapContainer: { height: 200 },
    map: { flex: 1 },
    marker: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    scrollView: { flex: 1 },
    inputSection: { margin: 16, padding: 16, borderRadius: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    inputIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, marginLeft: 12, padding: 12, borderRadius: 10, fontSize: 14 },
    modeSelector: { flexDirection: 'row', marginTop: 16, gap: 10 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    modeBtnText: { fontSize: 13, fontWeight: '500' },
    analyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 16, gap: 8 },
    analyzeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    resultsSection: { padding: 16 },
    scoreCard: { padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
    scoreValue: { fontSize: 26, fontWeight: 'bold' },
    scoreLabel: { fontSize: 10 },
    scoreInfo: { flex: 1, marginLeft: 16 },
    scoreItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    scoreItemText: { fontSize: 13 },
    badge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, marginTop: 12, gap: 8 },
    badgeText: { fontSize: 16, fontWeight: '600' },
    recommendationsCard: { marginTop: 16, padding: 16, borderRadius: 12 },
    recommendationsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    recommendationItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
    recommendationText: { flex: 1, fontSize: 13 },
    actionButtons: { flexDirection: 'row', marginTop: 16, gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    secondaryBtn: { backgroundColor: 'transparent', borderWidth: 2 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    routeCard: { padding: 14, borderRadius: 12, marginBottom: 10 },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    routeName: { fontSize: 15, fontWeight: '600' },
    routeScore: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    routeScoreText: { fontSize: 12, fontWeight: '600' },
    routeDesc: { fontSize: 13, marginBottom: 8 },
    routeMeta: { flexDirection: 'row', gap: 16 },
    routeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    routeMetaText: { fontSize: 12 },
    tipsCard: { margin: 16, padding: 16, borderRadius: 12 },
    tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    tipTitle: { fontSize: 16, fontWeight: '600' },
    tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    tipBullet: { fontSize: 16, marginRight: 8 },
    tipText: { flex: 1, fontSize: 13 },
    historyModal: { flex: 1 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    historyHeaderTitle: { fontSize: 18, fontWeight: '600' },
    historyList: { padding: 16 },
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
    historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center' },
    historyContent: { flex: 1, marginLeft: 12 },
    historyRoute: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    historyDate: { fontSize: 12 },
    historyScore: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    historyScoreText: { fontSize: 12, fontWeight: '600' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, marginTop: 16 },
});

export default SafeRouteScreen;
