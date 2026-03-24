import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { IMAGE_VALIDATION_CONFIG } from '../../constants/cylinderStandards';

/**
 * CylinderCamera Component
 * Camera interface with guided overlay for capturing cylinder images
 * 
 * @param {Object} props
 * @param {Function} props.onCapture - Callback when image is captured
 * @param {Function} props.onClose - Callback to close camera
 * @param {string} props.cameraRef - Reference to camera component
 */
const CylinderCamera = ({ onCapture, onClose, cameraRef }) => {
    const { colors, spacing, borderRadius } = useTheme();
    const [isCapturing, setIsCapturing] = useState(false);
    const [flashMode, setFlashMode] = useState('off');
    const [hasPermission, setHasPermission] = useState(null);
    const [guideVisible, setGuideVisible] = useState(true);

    // Check camera permissions
    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const { status } = await require('expo-camera').useCameraPermissions();
            setHasPermission(status === 'granted');
        } catch (error) {
            console.log('Camera permission check error:', error);
            setHasPermission(false);
        }
    };

    const handleCapture = async () => {
        if (!cameraRef || isCapturing) return;

        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
                flash: flashMode,
            });

            if (onCapture) {
                onCapture(photo);
            }
        } catch (error) {
            console.error('Capture error:', error);
            Alert.alert('Error', 'Failed to capture image. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const toggleFlash = () => {
        setFlashMode(current => current === 'off' ? 'on' : 'off');
    };

    const toggleGuide = () => {
        setGuideVisible(current => !current);
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <Ionicons name="camera-off" size={64} color={colors.error} />
                <Text style={[styles.message, { color: colors.text }]}>
                    Camera permission is required to scan cylinders
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                >
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            {/* Camera View */}
            {Platform.OS === 'web' ? (
                <View style={[styles.cameraPlaceholder, { backgroundColor: '#1a1a1a' }]}>
                    <Ionicons name="camera" size={80} color="#666" />
                    <Text style={styles.placeholderText}>
                        Camera preview will appear here
                    </Text>
                    <Text style={styles.placeholderHint}>
                        Position the cylinder's collar/stamp area within the frame
                    </Text>
                </View>
            ) : (
                <View style={styles.cameraContainer}>
                    {/* Guided Overlay */}
                    {guideVisible && (
                        <View style={styles.overlay}>
                            {/* Top guides */}
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />

                            {/* Bottom guides */}
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />

                            {/* Center guide text */}
                            <View style={styles.guideTextContainer}>
                                <Text style={styles.guideText}>
                                    Position cylinder stamp area here
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Controls */}
            <View style={[styles.controls, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                {/* Close button */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onClose}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Capture button */}
                <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                >
                    {isCapturing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <View style={styles.captureButtonInner} />
                    )}
                </TouchableOpacity>

                {/* Flash toggle */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleFlash}
                >
                    <Ionicons
                        name={flashMode === 'on' ? 'flash' : 'flash-off'}
                        size={28}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* Tips */}
            <View style={[styles.tipsContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <TouchableOpacity onPress={toggleGuide} style={styles.tipToggle}>
                    <Ionicons name="information-circle-outline" size={20} color="#fff" />
                    <Text style={styles.tipText}>
                        {guideVisible ? 'Hide guide' : 'Show guide'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.tipText}>
                    Ensure the stamp area is clearly visible
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    cameraPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
    placeholderHint: {
        color: '#444',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#fff',
    },
    topLeft: {
        top: '20%',
        left: '10%',
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    topRight: {
        top: '20%',
        right: '10%',
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    bottomLeft: {
        bottom: '30%',
        left: '10%',
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    bottomRight: {
        bottom: '30%',
        right: '10%',
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    guideTextContainer: {
        position: 'absolute',
        top: '15%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    guideText: {
        color: '#fff',
        fontSize: 14,
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    controlButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
    },
    tipsContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
    },
    tipToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tipText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 6,
    },
});

export default CylinderCamera;
