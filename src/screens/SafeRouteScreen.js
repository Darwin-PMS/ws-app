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
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import safeRouteService from '../services/safeRouteService';

const SafeRouteScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [travelMode, setTravelMode] = useState('walking');
    const [location, setLocation] = useState(null);
    const [routeAnalysis, setRouteAnalysis] = useState(null);
    const [alternativeRoutes, setAlternativeRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [routeHistory, setRouteHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        initializeLocation();
        loadRouteHistory();
    }, []);

    const initializeLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const userLocation = await Location.getCurrentPositionAsync({});
                setLocation(userLocation.coords);
            }
        } catch (error) {
            console.error('Location error:', error);
            setLocation({ latitude: 28.6139, longitude: 77.209 });
        }
    };

    const loadRouteHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await safeRouteService.getMyRoutes(10);
            if (response.success && response.data) {
                setRouteHistory(response.data);
            }
        } catch (error) {
            console.error('Load history error:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAnalyzeRoute = async () => {
        if (!origin.trim() || !destination.trim()) {
            Alert.alert('Error', 'Please enter both origin and destination');
            return;
        }

        setLoading(true);
        try {
            const originCoords = location || { latitude: 28.6139, longitude: 77.209 };
            const destCoords = {
                latitude: location ? location.latitude + (Math.random() * 0.02 - 0.01) : 28.6239,
                longitude: location ? location.longitude + (Math.random() * 0.02 - 0.01) : 77.219
            };

            const result = await safeRouteService.analyzeRoute(
                { ...originCoords, name: origin },
                { ...destCoords, name: destination },
                travelMode
            );

            if (result.success) {
                setRouteAnalysis(result);

                if (result.alternativeRoutes) {
                    setAlternativeRoutes(result.alternativeRoutes);
                } else {
                    const alternatives = await safeRouteService.getAlternativeRoutes(
                        { ...originCoords, name: origin },
                        { ...destCoords, name: destination }
                    );
                    setAlternativeRoutes(alternatives);
                }

                loadRouteHistory();
            } else {
                Alert.alert('Error', result.error || 'Failed to analyze route');
            }
        } catch (error) {
            console.error('Analyze route error:', error);
            Alert.alert('Error', 'Failed to analyze route');
        } finally {
            setLoading(false);
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

    const renderTravelModeSelector = () => (
        <View style={styles.modeSelector}>
            <TouchableOpacity
                style={[
                    styles.modeBtn,
                    { backgroundColor: travelMode === 'walking' ? colors.primary : colors.card }
                ]}
                onPress={() => setTravelMode('walking')}
            >
                <Ionicons
                    name="walk"
                    size={20}
                    color={travelMode === 'walking' ? '#fff' : colors.gray}
                />
                <Text style={[styles.modeBtnText, { color: travelMode === 'walking' ? '#fff' : colors.gray }]}>
                    Walking
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.modeBtn,
                    { backgroundColor: travelMode === 'driving' ? colors.primary : colors.card }
                ]}
                onPress={() => setTravelMode('driving')}
            >
                <Ionicons
                    name="car"
                    size={20}
                    color={travelMode === 'driving' ? '#fff' : colors.gray}
                />
                <Text style={[styles.modeBtnText, { color: travelMode === 'driving' ? '#fff' : colors.gray }]}>
                    Driving
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.inputSection, { backgroundColor: colors.card, ...shadows.small }]}>
                <View style={styles.inputRow}>
                    <View style={[styles.inputIcon, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="location" size={20} color="#fff" />
                    </View>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="From: Current Location"
                        placeholderTextColor={colors.gray}
                        value={origin}
                        onChangeText={setOrigin}
                    />
                </View>

                <View style={[styles.inputRow, { marginTop: 12 }]}>
                    <View style={[styles.inputIcon, { backgroundColor: '#EF4444' }]}>
                        <Ionicons name="flag" size={20} color="#fff" />
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Route Analysis</Text>

                    <View style={[styles.scoreCard, { backgroundColor: colors.card, ...shadows.medium }]}>
                        <View style={[styles.scoreCircle, { borderColor: getSafetyColor(routeAnalysis.safetyScore) }]}>
                            <Text style={[styles.scoreValue, { color: getSafetyColor(routeAnalysis.safetyScore) }]}>
                                {routeAnalysis.safetyScore}
                            </Text>
                            <Text style={[styles.scoreLabel, { color: colors.gray }]}>Safety Score</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <View style={styles.scoreItem}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                    {routeAnalysis.incidents?.origin + routeAnalysis.incidents?.destination || 0} incidents nearby
                                </Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                                <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                    {routeAnalysis.safeZones?.origin + routeAnalysis.safeZones?.destination || 0} safe zones
                                </Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <Ionicons name="navigate" size={20} color={colors.primary} />
                                <Text style={[styles.scoreItemText, { color: colors.text }]}>
                                    {routeAnalysis.distance} km • ~{routeAnalysis.estimatedTime} min
                                </Text>
                            </View>
                        </View>
                    </View>

                    {routeAnalysis.recommendations && routeAnalysis.recommendations.length > 0 && (
                        <View style={[styles.recommendationsCard, { backgroundColor: colors.card, ...shadows.small }]}>
                            <Text style={[styles.recommendationsTitle, { color: colors.text }]}>Recommendations</Text>
                            {routeAnalysis.recommendations.map((rec, index) => (
                                <View key={index} style={styles.recommendationItem}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                    <Text style={[styles.recommendationText, { color: colors.text }]}>{rec}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {alternativeRoutes.length > 0 && (
                <View style={styles.resultsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Alternative Routes</Text>
                    {alternativeRoutes.map((route) => (
                        <TouchableOpacity
                            key={route.id}
                            style={[styles.routeCard, { backgroundColor: colors.card, ...shadows.small }]}
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
                                    <Ionicons name="time" size={16} color={colors.gray} />
                                    <Text style={[styles.routeMetaText, { color: colors.gray }]}>~{route.estimatedTime} min</Text>
                                </View>
                                <View style={styles.routeMetaItem}>
                                    <Ionicons name="navigate" size={16} color={colors.gray} />
                                    <Text style={[styles.routeMetaText, { color: colors.gray }]}>{route.distance} km</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.resultsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Analysis History</Text>
                {loadingHistory ? (
                    <ActivityIndicator color={colors.primary} />
                ) : routeHistory.length > 0 ? (
                    routeHistory.map((route) => (
                        <View key={route.id} style={[styles.historyCard, { backgroundColor: colors.card, ...shadows.small }]}>
                            <View style={styles.historyHeader}>
                                <View>
                                    <Text style={[styles.historyFrom, { color: colors.text }]}>
                                        {route.origin_name || 'Unknown'} → {route.dest_name || 'Unknown'}
                                    </Text>
                                    <Text style={[styles.historyDate, { color: colors.gray }]}>
                                        {new Date(route.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={[styles.routeScore, { backgroundColor: getSafetyColor(route.safety_score) + '20' }]}>
                                    <Text style={[styles.routeScoreText, { color: getSafetyColor(route.safety_score) }]}>
                                        {route.safety_score}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: colors.gray }]}>No route analysis history yet</Text>
                )}
            </View>

            <View style={[styles.howItWorksCard, { backgroundColor: colors.card, ...shadows.small }]}>
                <Text style={[styles.howItWorksTitle, { color: colors.text }]}>How It Works</Text>
                <View style={styles.step}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.gray }]}>Enter your start and end locations</Text>
                </View>
                <View style={styles.step}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.stepNumberText, { color: colors.primary }]}>2</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.gray }]}>Select walking or driving mode</Text>
                </View>
                <View style={styles.step}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.stepNumberText, { color: colors.primary }]}>3</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.gray }]}>Get safety analysis based on incidents and safe zones</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inputSection: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        padding: 12,
        borderRadius: 12,
        fontSize: 14,
    },
    modeSelector: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    modeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    scoreCard: {
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 10,
    },
    scoreInfo: {
        flex: 1,
        marginLeft: 16,
    },
    scoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    scoreItemText: {
        fontSize: 13,
    },
    recommendationsCard: {
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    recommendationText: {
        flex: 1,
        fontSize: 13,
    },
    routeCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeName: {
        fontSize: 16,
        fontWeight: '600',
    },
    routeScore: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    routeScoreText: {
        fontSize: 12,
        fontWeight: '600',
    },
    routeDesc: {
        fontSize: 13,
        marginBottom: 12,
    },
    routeMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    routeMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    routeMetaText: {
        fontSize: 12,
    },
    historyCard: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyFrom: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyDate: {
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
    },
    howItWorksCard: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
    },
    howItWorksTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepText: {
        flex: 1,
        fontSize: 13,
    },
});

export default SafeRouteScreen;
