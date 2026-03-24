import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { processCylinderImage } from '../services/cylinderService';
import { validateImageQuality } from '../utils/cylinderValidator';
import { DEFAULT_REGION } from '../constants/cylinderStandards';
import StatusBadge from '../components/cylinder/StatusBadge';
import CylinderResultCard from '../components/cylinder/CylinderResultCard';

/**
 * CylinderVerificationScreen
 * Main screen for verifying gas cylinder validity and expiration
 */
const CylinderVerificationScreen = ({ navigation, route }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    // State
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION);

    // Handle image from camera/gallery
    const handleImageSelected = useCallback(async (image) => {
        if (!image) return;

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            // Convert to base64 if needed
            let base64Image = image.base64;
            if (!base64Image && image.uri) {
                // For local URI, we'll pass the URI to the service
                setImageUri(image.uri);
            }

            // Validate image quality first
            const qualityCheck = validateImageQuality({
                width: image.width || 1920,
                height: image.height || 1080,
                base64: base64Image,
            });

            if (!qualityCheck.isValid) {
                Alert.alert(
                    'Image Quality Warning',
                    qualityCheck.message,
                    [
                        { text: 'Continue Anyway', onPress: () => processImage(image, base64Image) },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
                return;
            }

            await processImage(image, base64Image);
        } catch (err) {
            console.error('Image processing error:', err);
            setError(err.message || 'Failed to process image');
            Alert.alert('Error', err.message || 'Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Process the image
    const processImage = async (image, base64Image) => {
        try {
            // Get API key from environment or user settings
            const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

            if (!apiKey) {
                Alert.alert(
                    'API Key Required',
                    'Please configure your Groq API key in settings to use this feature.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Process through the service
            const response = await processCylinderImage(
                apiKey,
                base64Image || image.uri,
                selectedRegion
            );

            setResult(response);

            // Show warnings if any
            if (response.warnings && response.warnings.length > 0) {
                Alert.alert(
                    'Warning',
                    response.warnings.join('\n'),
                    [{ text: 'OK' }]
                );
            }
        } catch (err) {
            console.error('Process image error:', err);
            throw err;
        }
    };

    // Handle capture from camera
    const handleCapture = useCallback((photo) => {
        handleImageSelected(photo);
    }, [handleImageSelected]);

    // Reset for new scan
    const handleReset = useCallback(() => {
        setResult(null);
        setImageUri(null);
        setError(null);
    }, []);

    // Save report (placeholder - would save to file/storage)
    const handleSaveReport = useCallback(() => {
        if (!result) return;

        Alert.alert(
            'Save Report',
            'Report would be saved to your device.',
            [{ text: 'OK' }]
        );
    }, [result]);

    // Find retest center (placeholder - would open maps/link)
    const handleFindRetest = useCallback(() => {
        Alert.alert(
            'Find Retest Center',
            'This would open a map or list of authorized retest centers.',
            [{ text: 'OK' }]
        );
    }, []);

    // Render initial state with scan options
    const renderInitialState = () => (
        <View style={styles.initialContainer}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Ionicons name="flame" size={48} color="#fff" />
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    Cylinder Verification
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Scan gas cylinder to verify validity and expiration
                </Text>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: colors.card, ...shadows.small }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    How to Scan
                </Text>

                <View style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.instructionNumberText, { color: colors.primary }]}>1</Text>
                    </View>
                    <View style={styles.instructionContent}>
                        <Text style={[styles.instructionTitle, { color: colors.text }]}>
                            Position the Cylinder
                        </Text>
                        <Text style={[styles.instructionDesc, { color: colors.textMuted }]}>
                            Ensure the cylinder's collar/stamp area is clearly visible
                        </Text>
                    </View>
                </View>

                <View style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.instructionNumberText, { color: colors.primary }]}>2</Text>
                    </View>
                    <View style={styles.instructionContent}>
                        <Text style={[styles.instructionTitle, { color: colors.text }]}>
                            Good Lighting
                        </Text>
                        <Text style={[styles.instructionDesc, { color: colors.textMuted }]}>
                            Ensure the image is clear and not blurry
                        </Text>
                    </View>
                </View>

                <View style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.instructionNumberText, { color: colors.primary }]}>3</Text>
                    </View>
                    <View style={styles.instructionContent}>
                        <Text style={[styles.instructionTitle, { color: colors.text }]}>
                            Capture & Analyze
                        </Text>
                        <Text style={[styles.instructionDesc, { color: colors.textMuted }]}>
                            Our AI will extract and verify the cylinder information
                        </Text>
                    </View>
                </View>
            </View>

            {/* Scan Options */}
            <View style={styles.scanOptions}>
                <TouchableOpacity
                    style={[styles.scanButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        // In a real app, this would open the camera
                        // For demo, we'll simulate with a sample result
                        Alert.alert(
                            'Camera',
                            'Camera functionality would open here. In production, this uses expo-camera.',
                            [
                                { text: 'Simulate Scan', onPress: () => simulateScan() },
                                { text: 'Cancel', style: 'cancel' },
                            ]
                        );
                    }}
                >
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.scanButtonText}>Scan with Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.scanButton, styles.secondaryButton, { borderColor: colors.primary }]}
                    onPress={() => {
                        Alert.alert(
                            'Gallery',
                            'Image picker would open here. In production, this uses expo-image-picker.',
                            [{ text: 'OK' }]
                        );
                    }}
                >
                    <Ionicons name="images" size={24} color={colors.primary} />
                    <Text style={[styles.scanButtonText, { color: colors.primary }]}>
                        Choose from Gallery
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Region Selector */}
            <View style={[styles.regionCard, { backgroundColor: colors.card, ...shadows.small }]}>
                <Text style={[styles.regionLabel, { color: colors.textMuted }]}>
                    Verification Region
                </Text>
                <View style={styles.regionOptions}>
                    <TouchableOpacity
                        style={[
                            styles.regionOption,
                            selectedRegion === 'IN' && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                        ]}
                        onPress={() => setSelectedRegion('IN')}
                    >
                        <Text style={[
                            styles.regionOptionText,
                            { color: selectedRegion === 'IN' ? colors.primary : colors.text }
                        ]}>
                            India (PESO)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.regionOption,
                            selectedRegion === 'US' && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                        ]}
                        onPress={() => setSelectedRegion('US')}
                    >
                        <Text style={[
                            styles.regionOptionText,
                            { color: selectedRegion === 'US' ? colors.primary : colors.text }
                        ]}>
                            USA (DOT)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.regionOption,
                            selectedRegion === 'EU' && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                        ]}
                        onPress={() => setSelectedRegion('EU')}
                    >
                        <Text style={[
                            styles.regionOptionText,
                            { color: selectedRegion === 'EU' ? colors.primary : colors.text }
                        ]}>
                            EU (TPED)
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                    This tool is for informational purposes only. Always verify
                    critical safety information manually and consult certified
                    testing stations.
                </Text>
            </View>
        </View>
    );

    // Simulate a scan for demo purposes
    const simulateScan = async () => {
        setIsProcessing(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Demo result
        const demoResult = {
            extraction: {
                cylinderNumber: 'BP1234567A',
                serialNumber: 'BP1234567A0525',
                manufacturer: 'Bharat Petroleum',
                gasType: 'LPG',
                capacity: '14.2 kg',
                manufactureDate: '05/25',
                testDate: '05/25',
                nextTestDate: '05/30',
                tareWeight: '15.3 kg',
                inspectionMark: 'A',
            },
            confidence: {
                overall: 0.92,
                cylinderNumber: 0.95,
                serialNumber: 0.90,
                manufacturer: 0.85,
                gasType: 0.88,
                capacity: 0.90,
                testDate: 0.92,
                nextTestDate: 0.94,
                tareWeight: 0.75,
                inspectionMark: 0.80,
            },
            status: {
                code: 'VALID',
                label: 'Valid',
                color: '#22C55E',
                daysUntilTest: 1523,
                daysOverdue: null,
            },
            assessment: {
                recommendedAction: 'Cylinder is valid for use',
                priority: 'low',
                remarks: 'All safety checks passed. Next test due May 2030.',
            },
            compliance: {
                region: 'India (IS/PESO)',
                standard: 'IS 3196',
                testInterval: '5 years',
                isCompliant: true,
            },
            contact: {
                retestProvider: 'Authorized PESO Test Station',
                contactInfo: 'Visit https://www.peso.gov.in for nearest test station',
                emergencyContact: '1800-XXX-XXXX',
            },
            metadata: {
                processedAt: new Date().toISOString(),
                imageQuality: 'good',
                ocrEngine: 'groq-vision-llama-4',
                processingTimeMs: 2847,
            },
            errors: [],
            warnings: [],
        };

        setResult(demoResult);
        setIsProcessing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Processing Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.processingText, { color: colors.text }]}>
                        Analyzing Cylinder...
                    </Text>
                    <Text style={[styles.processingSubtext, { color: colors.textMuted }]}>
                        Please wait while we extract and verify the information
                    </Text>
                </View>
            )}

            {/* Result View */}
            {result && !isProcessing ? (
                <CylinderResultCard
                    result={result}
                    onSave={handleSaveReport}
                    onRetest={handleFindRetest}
                    onScanAnother={handleReset}
                />
            ) : (
                // Initial State
                !isProcessing && renderInitialState()
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 100,
    },
    processingText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
    },
    processingSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    initialContainer: {
        flex: 1,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        padding: 32,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    instructionsCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    instructionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    instructionNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    instructionContent: {
        flex: 1,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    instructionDesc: {
        fontSize: 14,
        marginTop: 2,
    },
    scanOptions: {
        paddingHorizontal: 16,
        gap: 12,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    regionCard: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    regionLabel: {
        fontSize: 14,
        marginBottom: 12,
    },
    regionOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    regionOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    regionOptionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginTop: 8,
        marginBottom: 32,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        marginLeft: 8,
        lineHeight: 18,
    },
});

export default CylinderVerificationScreen;
