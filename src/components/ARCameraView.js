// AR Camera View Component
// Augmented Reality overlay for escape guidance

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import arNavigationService from '../services/arNavigationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ARCameraView = ({ visible, onClose, navigation }) => {
    const { colors } = useTheme();
    const cameraRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [arData, setArData] = useState(null);
    const [compassHeading, setCompassHeading] = useState(0);
    const [location, setLocation] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);

    useEffect(() => {
        if (visible) {
            initializeAR();
        } else {
            cleanupAR();
        }
    }, [visible]);

    const initializeAR = async () => {
        // Request camera permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status === 'granted') {
            // Get location
            const locationResult = await arNavigationService.getCurrentLocation();
            if (locationResult.success) {
                setLocation(locationResult.location);
            }

            // Find nearby safe points
            const pointsResult = await arNavigationService.findNearbySafePoints(500);
            if (pointsResult.success) {
                setArData(pointsResult.arData);
            }

            // Start compass updates
            await arNavigationService.startCompassUpdates((heading) => {
                setCompassHeading(heading);
            });
        }
    };

    const cleanupAR = () => {
        arNavigationService.stopCompassUpdates();
    };

    const getARPosition = (point) => {
        if (!location || !arData) return null;

        const deviceHeading = location.heading || compassHeading;
        const relativeBearing = (point.bearing - deviceHeading + 360) % 360;

        // Convert to screen coordinates
        const fov = 60; // Field of view
        const xPercent = (relativeBearing - 180) / fov + 0.5;
        const x = xPercent * SCREEN_WIDTH;

        // Distance-based Y position
        const maxDistance = 500;
        const yPercent = Math.min(point.distance / maxDistance, 1);
        const y = SCREEN_HEIGHT * 0.3 + (yPercent * SCREEN_HEIGHT * 0.5);

        // Check if in view
        const isInView = relativeBearing > (180 - fov / 2) && relativeBearing < (180 + fov / 2);

        return {
            x,
            y,
            isInView,
            opacity: isInView ? 1 : 0.3,
            scale: isInView ? 1 : 0.8,
        };
    };

    const handlePointPress = (point) => {
        setSelectedPoint(point);
    };

    if (!visible) return null;

    if (hasPermission === false) {
        return (
            <View style={[styles.container, styles.permissionDenied]}>
                <Ionicons name="camera-off" size={64} color={colors.gray} />
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Camera permission required for AR view
                </Text>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                >
                    <Text style={styles.permissionButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <Camera
                ref={cameraRef}
                style={styles.camera}
                type={Camera.Constants.Type.back}
            >
                {/* AR Overlay */}
                <View style={styles.overlay}>
                    {/* Compass */}
                    <View style={styles.compassContainer}>
                        <View style={[styles.compass, { transform: [{ rotate: `${-compassHeading}deg` }] }]}>
                            <Ionicons name="navigate" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.compassText}>{Math.round(compassHeading)}°</Text>
                    </View>

                    {/* AR Markers */}
                    {arData?.points?.map((point, index) => {
                        const position = getARPosition(point);
                        if (!position) return null;

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.marker,
                                    {
                                        left: position.x - 20,
                                        top: position.y - 20,
                                        opacity: position.opacity,
                                        transform: [{ scale: position.scale }],
                                    },
                                ]}
                                onPress={() => handlePointPress(point)}
                                disabled={!position.isInView}
                            >
                                <View style={[
                                    styles.markerIcon,
                                    { backgroundColor: point.type === 'safe_zone' ? '#10B981' : colors.primary }
                                ]}>
                                    <Ionicons
                                        name={point.icon}
                                        size={20}
                                        color="#fff"
                                    />
                                </View>
                                {position.isInView && (
                                    <View style={styles.markerLabel}>
                                        <Text style={styles.markerLabelText}>{point.name}</Text>
                                        <Text style={styles.markerDistanceText}>{point.distanceText}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Direction Arrow */}
                    {arData && arData.points?.length > 0 && (
                        <View style={styles.directionArrow}>
                            <Ionicons
                                name="arrow-up"
                                size={32}
                                color="#10B981"
                            />
                            <Text style={styles.directionText}>
                                {arData.points[0]?.distanceText} to safety
                            </Text>
                        </View>
                    )}

                    {/* Selected Point Info */}
                    {selectedPoint && (
                        <View style={[styles.selectedPointCard, { backgroundColor: colors.card }]}>
                            <View style={styles.selectedPointHeader}>
                                <Ionicons
                                    name={selectedPoint.icon}
                                    size={24}
                                    color={colors.primary}
                                />
                                <Text style={[styles.selectedPointName, { color: colors.text }]}>
                                    {selectedPoint.name}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                                    <Ionicons name="close" size={24} color={colors.gray} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.selectedPointInfo, { color: colors.gray }]}>
                                Distance: {selectedPoint.distanceText}
                            </Text>
                            <Text style={[styles.selectedPointInfo, { color: colors.gray }]}>
                                Direction: {selectedPoint.bearing.toFixed(0)}°
                            </Text>
                        </View>
                    )}

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={44} color="#fff" />
                    </TouchableOpacity>

                    {/* Distance Info */}
                    <View style={[styles.distanceInfo, { backgroundColor: colors.card + 'E0' }]}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={[styles.distanceText, { color: colors.text }]}>
                            Showing safe points within 500m
                        </Text>
                    </View>
                </View>
            </Camera>

            {/* Bottom Controls */}
            <View style={[styles.bottomControls, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                        const result = await arNavigationService.calculateEscapeRoute(location);
                        if (result.success) {
                            setSelectedPoint(result.escapeRoute.destination);
                        }
                    }}
                >
                    <Ionicons name="flash" size={24} color="#fff" />
                    <Text style={styles.controlButtonText}>Escape Route</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: '#10B981' }]}
                    onPress={async () => {
                        const result = await arNavigationService.findNearbySafePoints(1000);
                        if (result.success) {
                            setArData(result.arData);
                        }
                    }}
                >
                    <Ionicons name="refresh" size={24} color="#fff" />
                    <Text style={styles.controlButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 9999,
    },
    permissionDenied: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    permissionButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    compassContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    compass: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    compassText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    marker: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    markerLabel: {
        position: 'absolute',
        top: 45,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    markerLabelText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    markerDistanceText: {
        color: '#10B981',
        fontSize: 10,
        marginTop: 2,
    },
    directionArrow: {
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    directionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    selectedPointCard: {
        position: 'absolute',
        bottom: 140,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    selectedPointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    selectedPointName: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    selectedPointInfo: {
        fontSize: 14,
        marginTop: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    distanceInfo: {
        position: 'absolute',
        bottom: 140,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    distanceText: {
        flex: 1,
        fontSize: 13,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 40,
        gap: 16,
    },
    controlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    controlButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ARCameraView;
