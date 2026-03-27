import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    FlatList,
    Image,
    ActivityIndicator,
    Share,
    Dimensions,
    Linking,
    Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/api/client';
import { ENDPOINTS, API_CONFIG, QR_CONFIG } from '../services/api/endpoints';
import Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';

const PERMISSION_TYPES = {
    VIEW_PROFILE: 'view_profile',
    VIEW_LOCATION: 'view_location',
    VIEW_CONTACT: 'view_contact',
    EMERGENCY_ACCESS: 'emergency_access',
    TRACK: 'track',
};

const TOKEN_TYPES = {
    PROFILE: 'profile',
    PERMISSION: 'permission',
    EMERGENCY: 'emergency',
    TEMP_ACCESS: 'temp_access',
};

const QR_GUIDELINES = (appName) => `📋 IMPORTANT GUIDELINES:

⚠️ Before Scanning:
• Only scan QR codes from trusted sources
• Verify the person's identity before sharing your code

🔒 While Using:
• This code grants access based on selected permissions only
• Your sensitive data remains protected
• You can revoke access anytime from settings

📱 After Scanning:
• Report suspicious access to the app support team
• Keep the app updated for security patches

🔐 Remember: The app owner can revoke access at any time.

Stay Safe! ${appName} Team`;

const QRScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId, token } = useApp();

    const [myQRCodes, setMyQRCodes] = useState([]);
    const [myPermissions, setMyPermissions] = useState([]);
    const [accessHistory, setAccessHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showQRPreview, setShowQRPreview] = useState(false);
    const [selectedQR, setSelectedQR] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [qrImageUrl, setQrImageUrl] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    const [newQR, setNewQR] = useState({
        tokenType: 'profile',
        permissions: [],
        expiresIn: '',
        maxUses: '',
        label: '',
    });

    const [scanToken, setScanToken] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMyQRCodes(),
                fetchMyPermissions(),
                fetchAccessHistory(),
            ]);
        } catch (error) {
            console.error('Error loading QR data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyQRCodes = async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.qr.myCodes);
            if (response.success) {
                setMyQRCodes(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching QR codes:', error);
        }
    };

    const fetchMyPermissions = async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.qr.permissions);
            if (response.success) {
                setMyPermissions(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const fetchAccessHistory = async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.qr.accessHistory);
            if (response.success) {
                setAccessHistory(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching access history:', error);
        }
    };

    const handleCreateQR = async () => {
        try {
            const payload = {
                tokenType: newQR.tokenType,
                permissions: newQR.permissions,
                expiresIn: newQR.expiresIn ? parseInt(newQR.expiresIn) : null,
                maxUses: newQR.maxUses ? parseInt(newQR.maxUses) : null,
                label: newQR.label,
            };

            const response = await apiClient.post(ENDPOINTS.qr.generate, payload);
            if (response.success) {
                Alert.alert('Success', 'QR code created successfully');
                setShowCreateModal(false);
                setNewQR({ tokenType: 'profile', permissions: [], expiresIn: '', maxUses: '', label: '' });
                fetchMyQRCodes();
            } else {
                Alert.alert('Error', response.message || 'Failed to create QR code');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create QR code');
        }
    };

    const handleRevokeQR = async (tokenId) => {
        Alert.alert(
            'Revoke QR Code',
            'Are you sure you want to revoke this QR code?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiClient.delete(ENDPOINTS.qr.revoke(tokenId));
                            if (response.success) {
                                Alert.alert('Success', 'QR code revoked');
                                fetchMyQRCodes();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to revoke QR code');
                        }
                    },
                },
            ]
        );
    };

    const handleScanQR = async () => {
        if (!scanToken.trim()) {
            Alert.alert('Error', 'Please enter a QR token');
            return;
        }

        try {
            const response = await apiClient.post(ENDPOINTS.qr.scan, { token: scanToken.trim() });
            if (response.success) {
                setScanResult(response.data);
                setShowScanModal(false);
                setShowDetailsModal(true);
            } else {
                Alert.alert('Error', response.message || 'Failed to scan QR code');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to scan QR code');
        }
    };

    const openCameraScanner = async () => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === 'granted') {
                setScanning(true);
                setShowScanModal(true);
                setScanned(false);
            } else {
                Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes');
            }
        } catch (error) {
            console.error('Camera permission error:', error);
            Alert.alert('Error', 'Failed to request camera permission');
        }
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        setScanning(false);

        try {
            const response = await apiClient.post(ENDPOINTS.qr.scan, { token: data.trim() });
            if (response.success) {
                setScanResult(response.data);
                setShowScanModal(false);
                setShowDetailsModal(true);
            } else {
                Alert.alert('Error', response.message || 'Failed to process QR code');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to process QR code');
        }
    };

    const fetchQRImage = async (token) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/mobile/qr/image/${token}`);
            const data = await response.json();
            if (data.success && data.data.qrImage) {
                setQrImageUrl(data.data.qrImage);
            }
        } catch (error) {
            console.error('Error fetching QR image:', error);
        }
    };

    const viewQRPreview = async (item) => {
        setSelectedQR(item);
        setQrImageUrl(null);
        if (item.token) {
            await fetchQRImage(item.token);
        }
        setShowQRPreview(true);
    };

    const getQRImageBase64 = (item) => {
        if (item?.qrImage) {
            return item.qrImage;
        }
        return null;
    };

    const shareToWhatsApp = async (localUri, shareMessage) => {
        try {
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
                Clipboard.setString(shareMessage);
                Alert.alert(
                    'Copied!',
                    'Message copied to clipboard. Paste it in WhatsApp after selecting the image.'
                );
            }
        } catch (error) {
            console.log('WhatsApp direct share failed');
        }
    };

    const handleShareQR = async (item) => {
        try {
            const token = item?.token || '';
            const publicUrl = `${QR_CONFIG.PUBLIC_SCAN_URL}?t=${encodeURIComponent(token)}`;
            const qrImageBase64 = getQRImageBase64(item);

            const shareMessage = `${QR_CONFIG.APP_NAME}\n\n👋 I'm sharing my QR code for secure profile access.\n\n📋 Type: ${getTokenTypeLabel(item?.type)}\n🌐 Link: ${publicUrl}\n📱 App: ${QR_CONFIG.APP_PLAY_STORE_URL}\n🔑 Token: ${item?.id || 'N/A'}\n\n${QR_GUIDELINES(QR_CONFIG.APP_NAME)}\n\nvia ${QR_CONFIG.APP_NAME}`;

            const shareWithOptions = async (localUri) => {
                await Share.share({
                    title: `${QR_CONFIG.APP_NAME} - QR Code`,
                    message: shareMessage,
                    url: localUri ? `file://${localUri}` : undefined,
                }, {
                    subject: `${QR_CONFIG.APP_NAME} - QR Code`,
                    dialogTitle: 'Share QR Code',
                });
            };

            const saveAndShareImage = async (base64String) => {
                const base64Data = base64String.split('base64,')[1];
                const localUri = `${FileSystem.cacheDirectory}qr_share_${Date.now()}.png`;
                await FileSystem.writeAsStringAsync(localUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                return localUri;
            };

            if (qrImageBase64 && qrImageBase64.startsWith('data:image')) {
                try {
                    const localUri = await saveAndShareImage(qrImageBase64);

                    Alert.alert(
                        'Share QR Code',
                        'Choose how to share:',
                        [
                            {
                                text: 'WhatsApp',
                                onPress: async () => {
                                    await shareToWhatsApp(localUri, shareMessage);
                                },
                            },
                            {
                                text: 'Other Apps',
                                onPress: async () => {
                                    await shareWithOptions(localUri);
                                },
                            },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );

                } catch (imageError) {
                    console.log('Could not share image, falling back to text');
                    await Share.share({
                        title: `${QR_CONFIG.APP_NAME} - QR Code`,
                        message: shareMessage,
                    });
                }
            } else {
                const qrImageApiUrl = token ? `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/mobile/qr/image/${token}` : null;
                try {
                    const localUri = `${FileSystem.cacheDirectory}qr_share_${Date.now()}.png`;
                    const { uri } = await FileSystem.downloadAsync(qrImageApiUrl, localUri);

                    Alert.alert(
                        'Share QR Code',
                        'Choose how to share:',
                        [
                            {
                                text: 'WhatsApp',
                                onPress: async () => {
                                    await shareToWhatsApp(uri, shareMessage);
                                },
                            },
                            {
                                text: 'Other Apps',
                                onPress: async () => {
                                    await shareWithOptions(uri);
                                },
                            },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );

                } catch (fetchError) {
                    await Share.share({
                        title: `${QR_CONFIG.APP_NAME} - QR Code`,
                        message: shareMessage,
                    });
                }
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to share QR code');
        }
    };

    const togglePermission = (permission) => {
        setNewQR((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter((p) => p !== permission)
                : [...prev.permissions, permission],
        }));
    };

    const getPermissionLabel = (perm) => {
        const labels = {
            view_profile: 'View Profile',
            view_location: 'View Location',
            view_contact: 'View Contact',
            emergency_access: 'Emergency Access',
            track: 'Track Location',
        };
        return labels[perm] || perm;
    };

    const getTokenTypeLabel = (type) => {
        const labels = {
            profile: 'Profile',
            permission: 'Permission',
            emergency: 'Emergency',
            temp_access: 'Temporary Access',
        };
        return labels[type] || type;
    };

    const renderQRCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.qrCard, { backgroundColor: colors.card, ...shadows }]}
            onPress={() => {
                setSelectedQR(item);
                setShowDetailsModal(true);
            }}
        >
            <View style={styles.qrCardHeader}>
                <View style={[styles.tokenTypeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Text style={[styles.tokenTypeText, { color: getTypeColor(item.type) }]}>
                        {getTokenTypeLabel(item.type)}
                    </Text>
                </View>
                {!item.isActive && (
                    <View style={[styles.statusBadge, { backgroundColor: '#ef444420' }]}>
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>Revoked</Text>
                    </View>
                )}
            </View>

            <View style={styles.permissionsContainer}>
                {item.permissions?.map((perm) => (
                    <View key={perm} style={[styles.permissionChip, { backgroundColor: colors.background }]}>
                        <Text style={[styles.permissionChipText, { color: colors.textSecondary }]}>
                            {getPermissionLabel(perm)}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.qrCardFooter}>
                <View style={styles.qrStats}>
                    <Text style={[styles.qrStatText, { color: colors.textSecondary }]}>
                        Uses: {item.useCount || 0}/{item.maxUses || '∞'}
                    </Text>
                    <Text style={[styles.qrStatText, { color: colors.textSecondary }]}>
                        {item.expiresAt ? `Expires: ${new Date(item.expiresAt).toLocaleDateString()}` : 'Never expires'}
                    </Text>
                </View>
                <View style={styles.qrActions}>
                    {item.isActive && item.token && (
                        <TouchableOpacity 
                            style={[styles.qrActionBtn, { backgroundColor: colors.primary + '20' }]}
                            onPress={() => viewQRPreview(item)}
                        >
                            <Ionicons name="qr-code" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {item.isActive && (
                        <TouchableOpacity onPress={() => handleShareQR(item)}>
                            <Ionicons name="share-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const getTypeColor = (type) => {
        const colors = {
            profile: '#6366f1',
            permission: '#10b981',
            emergency: '#ef4444',
            temp_access: '#f59e0b',
        };
        return colors[type] || '#6366f1';
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>QR & Permissions</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>My QR Codes</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Create</Text>
                        </TouchableOpacity>
                    </View>

                    {myQRCodes.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                            <Ionicons name="qr-code-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No QR codes yet. Create one to share your profile!
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={myQRCodes}
                            renderItem={renderQRCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Permissions I Have</Text>
                    {myPermissions.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                            <Ionicons name="shield-checkmark-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No permissions granted yet
                            </Text>
                        </View>
                    ) : (
                        myPermissions.map((perm) => (
                            <View key={perm.id} style={[styles.permissionCard, { backgroundColor: colors.card }]}>
                                <View style={styles.permissionInfo}>
                                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                                    <Text style={[styles.permissionFrom, { color: colors.text }]}>{perm.from}</Text>
                                </View>
                                <View style={[styles.permissionBadge, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.permissionType, { color: colors.primary }]}>
                                        {getPermissionLabel(perm.permission)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.scanButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.scanButton, { backgroundColor: colors.primary }]}
                        onPress={openCameraScanner}
                    >
                        <Ionicons name="scan-outline" size={24} color="#fff" />
                        <Text style={styles.scanButtonText}>Scan with Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.scanButtonSecondary, { backgroundColor: colors.card, borderColor: colors.primary }]}
                        onPress={() => setShowScanModal(true)}
                    >
                        <Ionicons name="keypad-outline" size={24} color={colors.primary} />
                        <Text style={[styles.scanButtonSecondaryText, { color: colors.primary }]}>Enter Token Manually</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Create QR Code</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Token Type</Text>
                            <View style={styles.typeSelector}>
                                {Object.entries(TOKEN_TYPES).map(([key, value]) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.typeOption,
                                            {
                                                backgroundColor: newQR.tokenType === value ? colors.primary : colors.background,
                                                borderColor: newQR.tokenType === value ? colors.primary : colors.border,
                                            },
                                        ]}
                                        onPress={() => setNewQR({ ...newQR, tokenType: value })}
                                    >
                                        <Text
                                            style={[
                                                styles.typeOptionText,
                                                { color: newQR.tokenType === value ? '#fff' : colors.text },
                                            ]}
                                        >
                                            {getTokenTypeLabel(value)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>Permissions</Text>
                            <View style={styles.permissionsGrid}>
                                {Object.entries(PERMISSION_TYPES).map(([key, value]) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.permissionOption,
                                            {
                                                backgroundColor: newQR.permissions.includes(value)
                                                    ? colors.primary
                                                    : colors.background,
                                                borderColor: newQR.permissions.includes(value)
                                                    ? colors.primary
                                                    : colors.border,
                                            },
                                        ]}
                                        onPress={() => togglePermission(value)}
                                    >
                                        <Text
                                            style={[
                                                styles.permissionOptionText,
                                                { color: newQR.permissions.includes(value) ? '#fff' : colors.text },
                                            ]}
                                        >
                                            {getPermissionLabel(value)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>Expires In (minutes, optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newQR.expiresIn}
                                onChangeText={(text) => setNewQR({ ...newQR, expiresIn: text })}
                                placeholder="Leave empty for no expiry"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>Max Uses (optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newQR.maxUses}
                                onChangeText={(text) => setNewQR({ ...newQR, maxUses: text })}
                                placeholder="Leave empty for unlimited"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateQR}
                            >
                                <Text style={styles.createButtonText}>Create QR Code</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showScanModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Scan QR Code</Text>
                            <TouchableOpacity onPress={() => setShowScanModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.text }]}>Enter QR Token</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={scanToken}
                            onChangeText={setScanToken}
                            placeholder="Paste the QR token here"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                            onPress={handleScanQR}
                        >
                            <Text style={styles.createButtonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showDetailsModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>QR Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedQR && (
                            <View style={styles.detailsContent}>
                                <View style={[styles.tokenTypeBadge, { backgroundColor: getTypeColor(selectedQR.type) + '20' }]}>
                                    <Text style={[styles.tokenTypeText, { color: getTypeColor(selectedQR.type) }]}>
                                        {getTokenTypeLabel(selectedQR.type)}
                                    </Text>
                                </View>

                                <View style={styles.permissionsContainer}>
                                    {selectedQR.permissions?.map((perm) => (
                                        <View key={perm} style={[styles.permissionChip, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.permissionChipText, { color: colors.textSecondary }]}>
                                                {getPermissionLabel(perm)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.detailsStats}>
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Uses:</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>
                                            {selectedQR.useCount || 0} / {selectedQR.maxUses || '∞'}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created:</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>
                                            {new Date(selectedQR.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    {selectedQR.expiresAt && (
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Expires:</Text>
                                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                                {new Date(selectedQR.expiresAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {selectedQR.isActive && (
                                    <TouchableOpacity
                                        style={[styles.revokeButton, { backgroundColor: '#ef444420' }]}
                                        onPress={() => {
                                            setShowDetailsModal(false);
                                            handleRevokeQR(selectedQR.id);
                                        }}
                                    >
                                        <Text style={[styles.revokeButtonText, { color: '#ef4444' }]}>Revoke QR Code</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {scanResult && (
                            <View style={styles.detailsContent}>
                                <Text style={[styles.accessResult, { color: scanResult.access === 'granted' ? '#10b981' : '#ef4444' }]}>
                                    Access {scanResult.access}
                                </Text>
                                {scanResult.accessibleData?.profile && (
                                    <View style={styles.profileSection}>
                                        <Text style={[styles.profileName, { color: colors.text }]}>
                                            {scanResult.accessibleData.profile.name}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.permissionsContainer}>
                                    {scanResult.permissions?.map((perm) => (
                                        <View key={perm} style={[styles.permissionChip, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.permissionChipText, { color: colors.textSecondary }]}>
                                                {getPermissionLabel(perm)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={showScanModal && scanning} animationType="slide">
                <View style={[styles.cameraContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity 
                            onPress={() => {
                                setScanning(false);
                                setShowScanModal(false);
                            }}
                            style={styles.closeCameraBtn}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.cameraTitle}>Scan QR Code</Text>
                        <View style={{ width: 28 }} />
                    </View>
                    
                    <View style={styles.cameraWrapper}>
                        <Camera
                            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                            style={styles.camera}
                        />
                        <View style={styles.cameraOverlay}>
                            <View style={styles.scanFrame}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.scanInstructions}>
                        Point your camera at a QR code
                    </Text>
                </View>
            </Modal>

            <Modal visible={showQRPreview} animationType="fade" transparent>
                <View style={styles.previewOverlay}>
                    <View style={[styles.previewContent, { backgroundColor: colors.card }]}>
                        <View style={styles.previewHeader}>
                            <Text style={[styles.previewTitle, { color: colors.text }]}>
                                {getTokenTypeLabel(selectedQR?.type)} QR Code
                            </Text>
                            <TouchableOpacity onPress={() => setShowQRPreview(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrPreviewContainer}>
                            {qrImageUrl ? (
                                <Image
                                    source={{ uri: qrImageUrl }}
                                    style={styles.qrPreviewImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={[styles.qrPlaceholder, { backgroundColor: colors.background }]}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[styles.qrLoadingText, { color: colors.textSecondary }]}>
                                        Generating QR...
                                    </Text>
                                </View>
                            )}
                        </View>

                        {selectedQR?.token && (
                            <View style={[styles.tokenInfoContainer, { backgroundColor: colors.background }]}>
                                <Text style={[styles.tokenInfoLabel, { color: colors.textSecondary }]}>Token ID</Text>
                                <Text style={[styles.tokenInfoValue, { color: colors.text }]} numberOfLines={1}>
                                    {selectedQR.id}
                                </Text>
                            </View>
                        )}

                        <View style={styles.previewPermissions}>
                            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                                Permissions:
                            </Text>
                            <View style={styles.permissionsContainer}>
                                {selectedQR?.permissions?.map((perm) => (
                                    <View key={perm} style={[styles.permissionChip, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.permissionChipText, { color: colors.textSecondary }]}>
                                            {getPermissionLabel(perm)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.shareButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleShareQR(selectedQR)}
                        >
                            <Ionicons name="share-outline" size={20} color="#fff" />
                            <Text style={styles.shareButtonText}>Share QR Code</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 4,
        fontWeight: '500',
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        textAlign: 'center',
    },
    qrCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    qrCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tokenTypeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    permissionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    permissionChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    permissionChipText: {
        fontSize: 12,
    },
    qrCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qrStats: {
        flex: 1,
    },
    qrStatText: {
        fontSize: 12,
        marginBottom: 2,
    },
    permissionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    permissionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    permissionFrom: {
        marginLeft: 8,
        fontWeight: '500',
    },
    permissionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    permissionType: {
        fontSize: 12,
        fontWeight: '500',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    scanButtonsContainer: {
        marginBottom: 32,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scanButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    scanButtonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    typeOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    typeOptionText: {
        fontSize: 13,
        fontWeight: '500',
    },
    permissionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    permissionOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    permissionOptionText: {
        fontSize: 13,
        fontWeight: '500',
    },
    createButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    detailsContent: {
        paddingVertical: 16,
    },
    detailsStats: {
        marginTop: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    revokeButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    revokeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    accessResult: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
    },
    qrActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qrActionBtn: {
        padding: 8,
        borderRadius: 8,
    },
    cameraContainer: {
        flex: 1,
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeCameraBtn: {
        padding: 4,
    },
    cameraTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    cameraWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#fff',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    scanInstructions: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    previewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    previewContent: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    qrPreviewContainer: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    qrPreviewImage: {
        width: '100%',
        height: '100%',
    },
    qrPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    qrLoadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    previewPermissions: {
        width: '100%',
        marginTop: 16,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    tokenInfoContainer: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    tokenInfoLabel: {
        fontSize: 11,
        marginBottom: 4,
    },
    tokenInfoValue: {
        fontSize: 12,
        fontWeight: '500',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        width: '100%',
        marginTop: 20,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default QRScreen;
