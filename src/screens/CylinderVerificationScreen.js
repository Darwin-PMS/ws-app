import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
    FlatList,
    Modal,
    Share,
    Linking,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { processCylinderImage } from '../services/cylinderService';
import { validateImageQuality } from '../utils/cylinderValidator';
import { DEFAULT_REGION, REGIONAL_CONFIGS, STATUS_CODES } from '../constants/cylinderStandards';
import { apiClient } from '../services/api/client';
import { ENDPOINTS } from '../services/api/endpoints';

const CylinderVerificationScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const { userId } = useApp();

    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION);
    const [showCamera, setShowCamera] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await apiClient.get(`${ENDPOINTS.cylinder?.history || `/mobile/cylinder/history`}`);
            if (response.success) {
                setHistory(response.data || []);
            }
        } catch (err) {
            console.log('History load error:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to scan cylinders');
            return false;
        }
        return true;
    };

    const requestMediaLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Media library permission is needed');
            return false;
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                handleImageSelected(result.assets[0]);
            }
        } catch (err) {
            console.error('Camera error:', err);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const pickFromGallery = async () => {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                handleImageSelected(result.assets[0]);
            }
        } catch (err) {
            console.error('Gallery error:', err);
            Alert.alert('Error', 'Failed to open gallery');
        }
    };

    const handleImageSelected = useCallback(async (image) => {
        if (!image) return;

        setIsProcessing(true);
        setError(null);
        setResult(null);
        setImageUri(image.uri);

        try {
            const qualityCheck = validateImageQuality({
                width: image.width || 1920,
                height: image.height || 1080,
                base64: image.base64,
            });

            if (!qualityCheck.isValid) {
                Alert.alert(
                    'Image Quality Warning',
                    qualityCheck.message,
                    [
                        { text: 'Continue Anyway', onPress: () => processImage(image) },
                        { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
                    ]
                );
                return;
            }

            await processImage(image);
        } catch (err) {
            console.error('Image processing error:', err);
            setError(err.message || 'Failed to process image');
            Alert.alert('Error', err.message || 'Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedRegion, userId]);

    const processImage = async (image) => {
        try {
            const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

            if (!apiKey) {
                Alert.alert(
                    'API Key Required',
                    'Please configure your Groq API key in settings to use this feature.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const response = await processCylinderImage(
                apiKey,
                image.base64 || image.uri,
                selectedRegion
            );

            if (response.extraction) {
                const resultWithImage = {
                    ...response,
                    imageUri: image.uri,
                    timestamp: new Date().toISOString(),
                };
                setResult(resultWithImage);
                saveToHistory(resultWithImage);

                if (response.warnings && response.warnings.length > 0) {
                    Alert.alert(
                        'Warning',
                        response.warnings.map(w => w.message || w).join('\n'),
                        [{ text: 'OK' }]
                    );
                }
            } else {
                setError(response.assessment?.remarks || 'Failed to extract cylinder data');
            }
        } catch (err) {
            console.error('Process image error:', err);
            throw err;
        }
    };

    const saveToHistory = async (verificationResult) => {
        try {
            await apiClient.post(`${ENDPOINTS.cylinder?.save || `/mobile/cylinder/save`}`, {
                userId,
                region: selectedRegion,
                result: verificationResult,
            });
            loadHistory();
        } catch (err) {
            console.log('Save history error:', err);
        }
    };

    const handleReset = useCallback(() => {
        setResult(null);
        setImageUri(null);
        setError(null);
    }, []);

    const handleSaveReport = async () => {
        if (!result) return;

        setSaveLoading(true);
        try {
            const reportContent = generateReportText(result);
            const fileName = `cylinder_report_${Date.now()}.txt`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, reportContent);

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Share Cylinder Report',
                });
            } else {
                Alert.alert('Success', 'Report saved to cache');
            }
        } catch (err) {
            console.error('Save report error:', err);
            Alert.alert('Error', 'Failed to save report');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleShare = async () => {
        if (!result) return;

        try {
            const reportContent = generateReportText(result);
            await Share.share({
                message: reportContent,
                title: 'Cylinder Verification Report',
            });
        } catch (err) {
            console.error('Share error:', err);
            Alert.alert('Error', 'Failed to share report');
        }
    };

    const handleFindRetest = () => {
        const regionConfig = REGIONAL_CONFIGS[selectedRegion];
        if (regionConfig?.retestProviderUrl) {
            Linking.openURL(regionConfig.retestProviderUrl);
        } else {
            Alert.alert('Info', 'Retest center information not available for this region');
        }
    };

    const handleCallEmergency = () => {
        const regionConfig = REGIONAL_CONFIGS[selectedRegion];
        if (regionConfig?.emergencyContact) {
            Linking.openURL(`tel:${regionConfig.emergencyContact}`);
        }
    };

    const generateReportText = (data) => {
        const statusColor = data.status?.color || '#6B7280';
        const statusLabel = data.status?.label || 'Unknown';

        return `
═══════════════════════════════════════════
     CYLINDER VERIFICATION REPORT
═══════════════════════════════════════════

📋 VERIFICATION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${statusLabel}
Confidence: ${((data.confidence?.overall || 0) * 100).toFixed(0)}%
Date: ${new Date(data.timestamp || data.metadata?.processedAt).toLocaleString()}

📝 CYLINDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cylinder Number: ${data.extraction?.cylinderNumber || 'N/A'}
Serial Number: ${data.extraction?.serialNumber || 'N/A'}
Manufacturer: ${data.extraction?.manufacturer || 'N/A'}
Gas Type: ${data.extraction?.gasType || 'N/A'}
Capacity: ${data.extraction?.capacity || 'N/A'}
Tare Weight: ${data.extraction?.tareWeight || 'N/A'}

📅 DATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Manufacture Date: ${data.extraction?.manufactureDate || 'N/A'}
Test Date: ${data.extraction?.testDate || 'N/A'}
Next Test Date: ${data.extraction?.nextTestDate || 'N/A'}

${data.status?.daysUntilTest !== null ? `Days Until Test: ${data.status.daysUntilTest} days` : ''}
${data.status?.daysOverdue ? `Days Overdue: ${data.status.daysOverdue} days` : ''}

⚖️ COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Region: ${data.compliance?.region || selectedRegion}
Standard: ${data.compliance?.standard || 'N/A'}
Test Interval: ${data.compliance?.testInterval || 'N/A'}
Compliant: ${data.compliance?.isCompliant ? 'Yes' : 'No'}

💡 RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.assessment?.recommendedAction || 'N/A'}
${data.assessment?.remarks ? `\nRemarks: ${data.assessment.remarks}` : ''}

📞 EMERGENCY CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.contact?.retestProvider || 'N/A'}
${data.contact?.emergencyContact ? `Emergency: ${data.contact.emergencyContact}` : ''}

═══════════════════════════════════════════
Generated by Nirbhaya Women Safety App
═══════════════════════════════════════════
        `.trim();
    };

    const getStatusIcon = (statusCode) => {
        switch (statusCode) {
            case 'VALID': return 'checkmark-circle';
            case 'DUE_SOON': return 'time';
            case 'OVERDUE': return 'alert-circle';
            case 'EXPIRED': return 'close-circle';
            default: return 'help-circle';
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return '#22C55E';
        if (confidence >= 0.6) return '#F59E0B';
        return '#EF4444';
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
                setResult({ ...item.result, imageUri: item.result?.imageUri, timestamp: item.createdAt });
                setShowHistory(false);
            }}
        >
            <View style={styles.historyHeader}>
                <View style={[styles.statusDot, { backgroundColor: item.result?.status?.color || '#6B7280' }]} />
                <Text style={[styles.historyStatus, { color: item.result?.status?.color || colors.text }]}>
                    {item.result?.status?.label || 'Unknown'}
                </Text>
                <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.historyCylinder, { color: colors.text }]} numberOfLines={1}>
                {item.result?.extraction?.cylinderNumber || 'N/A'}
            </Text>
            <Text style={[styles.historyGas, { color: colors.textMuted }]}>
                {item.result?.extraction?.gasType || 'N/A'} • {item.result?.extraction?.capacity || 'N/A'}
            </Text>
        </TouchableOpacity>
    );

    const renderResultView = () => {
        if (!result) return null;

        const statusCode = result.status?.code || 'UNKNOWN';
        const statusColor = result.status?.color || '#6B7280';

        return (
            <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
                <View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={getStatusIcon(statusCode)} size={48} color={statusColor} />
                    <Text style={[styles.statusTitle, { color: statusColor }]}>
                        {result.status?.label || 'Verification Complete'}
                    </Text>
                    <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>
                        {result.assessment?.recommendedAction || 'Analysis complete'}
                    </Text>
                    <View style={styles.confidenceBar}>
                        <View style={[styles.confidenceFill, { width: `${((result.confidence?.overall || 0) * 100)}%`, backgroundColor: statusColor }]} />
                    </View>
                    <Text style={[styles.confidenceText, { color: colors.textMuted }]}>
                        Confidence: {((result.confidence?.overall || 0) * 100).toFixed(0)}%
                    </Text>
                </View>

                {result.imageUri && (
                    <View style={[styles.imagePreview, { backgroundColor: colors.card }]}>
                        <Image source={{ uri: result.imageUri }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity style={[styles.retakeBtn, { backgroundColor: colors.primary }]} onPress={handleReset}>
                            <Ionicons name="camera" size={16} color="#fff" />
                            <Text style={styles.retakeBtnText}>Scan New</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Cylinder Details</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Cylinder Number</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.cylinderNumber || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Serial Number</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.serialNumber || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Manufacturer</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.manufacturer || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Gas Type</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.gasType || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Capacity</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.capacity || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Tare Weight</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.tareWeight || 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Dates</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Manufacture Date</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.manufactureDate || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Test Date</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.testDate || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Next Test Date</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.extraction?.nextTestDate || 'N/A'}
                        </Text>
                    </View>

                    {result.status?.daysUntilTest !== null && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Days Until Test</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {result.status.daysUntilTest} days
                            </Text>
                        </View>
                    )}

                    {result.status?.daysOverdue > 0 && (
                        <View style={[styles.detailRow, { backgroundColor: '#EF444420', marginHorizontal: -12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }]}>
                            <Text style={[styles.detailLabel, { color: '#EF4444' }]}>⚠️ Days Overdue</Text>
                            <Text style={[styles.detailValue, { color: '#EF4444', fontWeight: 'bold' }]}>
                                {result.status.daysOverdue} days
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Compliance</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Region</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.compliance?.region || selectedRegion}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Standard</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.compliance?.standard || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Test Interval</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {result.compliance?.testInterval || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.complianceBadge}>
                        <Ionicons 
                            name={result.compliance?.isCompliant ? 'checkmark-circle' : 'close-circle'} 
                            size={20} 
                            color={result.compliance?.isCompliant ? '#22C55E' : '#EF4444'} 
                        />
                        <Text style={[styles.complianceText, { color: result.compliance?.isCompliant ? '#22C55E' : '#EF4444' }]}>
                            {result.compliance?.isCompliant ? 'Compliant' : 'Non-Compliant'}
                        </Text>
                    </View>
                </View>

                {result.assessment?.remarks && (
                    <View style={[styles.remarksCard, { backgroundColor: colors.card, borderLeftColor: statusColor }]}>
                        <Text style={[styles.remarksTitle, { color: colors.text }]}>Remarks</Text>
                        <Text style={[styles.remarksText, { color: colors.textMuted }]}>
                            {result.assessment.remarks}
                        </Text>
                    </View>
                )}

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleSaveReport} disabled={saveLoading}>
                        {saveLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="download" size={20} color="#fff" />}
                        <Text style={styles.actionBtnText}>Save Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={handleShare}>
                        <Ionicons name="share-social" size={20} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={handleFindRetest}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Retest</Text>
                    </TouchableOpacity>
                </View>

                {result.contact?.emergencyContact && (
                    <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#EF4444' }]} onPress={handleCallEmergency}>
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.emergencyBtnText}>Call Emergency: {result.contact.emergencyContact}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.newScanBtn, { borderColor: colors.primary }]} onPress={handleReset}>
                    <Ionicons name="qr-code-scanner" size={20} color={colors.primary} />
                    <Text style={[styles.newScanBtnText, { color: colors.primary }]}>Scan New Cylinder</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        );
    };

    const renderInitialState = () => (
        <View style={styles.initialContainer}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Ionicons name="flame" size={48} color="#fff" />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Cylinder Verification</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Scan gas cylinder to verify validity
                </Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
                    <Ionicons name="time" size={20} color="#fff" />
                    <Text style={styles.historyBtnText}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Scan</Text>

                    <View style={styles.instructionItem}>
                        <View style={[styles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.instructionNumberText, { color: colors.primary }]}>1</Text>
                        </View>
                        <View style={styles.instructionContent}>
                            <Text style={[styles.instructionTitle, { color: colors.text }]}>Position the Cylinder</Text>
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
                            <Text style={[styles.instructionTitle, { color: colors.text }]}>Good Lighting</Text>
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
                            <Text style={[styles.instructionTitle, { color: colors.text }]}>Capture & Analyze</Text>
                            <Text style={[styles.instructionDesc, { color: colors.textMuted }]}>
                                Our AI will extract and verify the cylinder information
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.scanOptions}>
                    <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                        <Ionicons name="camera" size={28} color="#fff" />
                        <Text style={styles.scanButtonText}>Scan with Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.scanButton, styles.secondaryButton, { borderColor: colors.primary }]} onPress={pickFromGallery}>
                        <Ionicons name="images" size={28} color={colors.primary} />
                        <Text style={[styles.scanButtonText, { color: colors.primary }]}>Choose from Gallery</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.regionCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.regionLabel, { color: colors.textMuted }]}>Verification Region</Text>
                    <View style={styles.regionOptions}>
                        {['IN', 'US', 'EU'].map((region) => (
                            <TouchableOpacity
                                key={region}
                                style={[
                                    styles.regionOption,
                                    selectedRegion === region && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                                ]}
                                onPress={() => setSelectedRegion(region)}
                            >
                                <Text style={[styles.regionOptionText, { color: selectedRegion === region ? colors.primary : colors.text }]}>
                                    {region === 'IN' ? 'India (PESO)' : region === 'US' ? 'USA (DOT)' : 'EU (TPED)'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Ionicons name="warning" size={20} color={colors.warning} />
                    <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                        This tool is for informational purposes only. Always verify critical safety information manually.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.processingText, { color: colors.text }]}>Analyzing Cylinder...</Text>
                    <Text style={[styles.processingSubtext, { color: colors.textMuted }]}>
                        Please wait while we extract and verify the information
                    </Text>
                </View>
            )}

            {result && !isProcessing ? renderResultView() : !isProcessing && renderInitialState()}

            <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.historyModal, { backgroundColor: colors.background }]}>
                    <View style={[styles.historyHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                        <Text style={[styles.historyHeaderTitle, { color: colors.text }]}>Verification History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingHistory ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : history.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>No verification history</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={history}
                            keyExtractor={(item) => item.id || item._id}
                            renderItem={renderHistoryItem}
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
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 100,
    },
    processingText: { fontSize: 20, fontWeight: '600', marginTop: 20 },
    processingSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    initialContainer: { flex: 1 },
    backBtn: { position: 'absolute', top: 48, left: 16, zIndex: 10, padding: 8 },
    historyBtn: { position: 'absolute', top: 48, right: 16, flexDirection: 'row', alignItems: 'center', padding: 8 },
    historyBtnText: { color: '#fff', marginLeft: 4, fontWeight: '500' },
    header: { alignItems: 'center', padding: 32, paddingTop: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
    headerSubtitle: { fontSize: 14, marginTop: 4 },
    scrollContent: { flex: 1 },
    instructionsCard: { margin: 16, padding: 20, borderRadius: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    instructionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    instructionNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    instructionNumberText: { fontSize: 16, fontWeight: 'bold' },
    instructionContent: { flex: 1 },
    instructionTitle: { fontSize: 16, fontWeight: '500' },
    instructionDesc: { fontSize: 14, marginTop: 2 },
    scanOptions: { paddingHorizontal: 16, gap: 12 },
    scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 12 },
    secondaryButton: { backgroundColor: 'transparent', borderWidth: 2 },
    scanButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    regionCard: { margin: 16, padding: 16, borderRadius: 12 },
    regionLabel: { fontSize: 14, marginBottom: 12 },
    regionOptions: { flexDirection: 'row', gap: 8 },
    regionOption: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
    regionOptionText: { fontSize: 12, fontWeight: '500' },
    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, marginBottom: 32 },
    disclaimerText: { flex: 1, fontSize: 12, marginLeft: 8, lineHeight: 18 },
    resultContainer: { flex: 1 },
    statusBanner: { alignItems: 'center', padding: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    statusTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
    statusSubtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
    confidenceBar: { width: '80%', height: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, marginTop: 16 },
    confidenceFill: { height: '100%', borderRadius: 3 },
    confidenceText: { fontSize: 12, marginTop: 8 },
    imagePreview: { margin: 16, borderRadius: 12, overflow: 'hidden' },
    previewImage: { width: '100%', height: 200 },
    retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
    retakeBtnText: { color: '#fff', fontWeight: '600' },
    detailsCard: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, fontWeight: '500' },
    complianceBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 },
    complianceText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    remarksCard: { margin: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
    remarksTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    remarksText: { fontSize: 14, lineHeight: 20 },
    actionButtons: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 12, gap: 8 },
    emergencyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    newScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 2, gap: 8 },
    newScanBtnText: { fontSize: 16, fontWeight: '600' },
    historyModal: { flex: 1 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    historyHeaderTitle: { fontSize: 18, fontWeight: '600' },
    historyList: { padding: 16 },
    historyCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    historyStatus: { fontSize: 14, fontWeight: '600', flex: 1 },
    historyDate: { fontSize: 12 },
    historyCylinder: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
    historyGas: { fontSize: 13 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyHistory: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyHistoryText: { fontSize: 16, marginTop: 16 },
});

export default CylinderVerificationScreen;
