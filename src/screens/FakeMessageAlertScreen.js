// Fake Message Alert Screen
// Simulate incoming message alerts for safety situations

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Modal,
    FlatList,
    Vibration,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import fakeMessageService from '../services/fakeMessageService';
import { useShakeDetector } from '../hooks/useShakeDetector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FakeMessageAlertScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const notificationAnim = useRef(new Animated.Value(0)).current;

    const [contacts, setContacts] = useState([]);
    const [settings, setSettings] = useState({});
    const [alertPresets, setAlertPresets] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);
    const [messageHistory, setMessageHistory] = useState([]);
    const [categories, setCategories] = useState([]);

    // Modal states
    const [showAddPreset, setShowAddPreset] = useState(false);
    const [showEditSettings, setShowEditSettings] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [customMessage, setCustomMessage] = useState('');

    // Alert state
    const [incomingAlertModal, setIncomingAlertModal] = useState(false);
    const [shakeToDismissEnabled, setShakeToDismissEnabled] = useState(true);
    const [alertDuration, setAlertDuration] = useState(0);
    const alertTimerRef = useRef(null);

    useEffect(() => {
        loadData();
        startPulseAnimation();

        return () => {
            if (alertTimerRef.current) clearInterval(alertTimerRef.current);
            Speech.stop();
        };
    }, []);

    // Pulse animation for incoming alert
    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Notification slide animation
    const slideInNotification = () => {
        Animated.timing(notificationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Shake to dismiss handler
    const handleShakeToDismiss = useCallback(() => {
        if (incomingAlertModal && shakeToDismissEnabled) {
            handleDismissAlert();
            Alert.alert('Alert Dismissed', 'Shake gesture detected - alert dismissed');
        }
    }, [incomingAlertModal, shakeToDismissEnabled]);

    // Use shake detector during active alert
    useShakeDetector(
        handleShakeToDismiss,
        incomingAlertModal && shakeToDismissEnabled,
        {
            requiredShakes: 2,
            shakeThreshold: 2.0,
            timeWindow: 2000,
            shakeInterval: 300
        }
    );

    const loadData = async () => {
        try {
            const contactsData = await fakeMessageService.getContacts();
            const settingsData = await fakeMessageService.getSettings();
            const presetsData = await fakeMessageService.getAlertPresets();
            const historyData = await fakeMessageService.getMessageHistory();
            const categoriesData = fakeMessageService.getCategories();

            setContacts(contactsData);
            setSettings(settingsData);
            setAlertPresets(presetsData);
            setMessageHistory(historyData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Load data error:', error);
        }
    };

    const handleTriggerAlert = async (preset, customMsg = null) => {
        try {
            const alert = await fakeMessageService.triggerAlert(preset, customMsg || customMessage);
            setCurrentAlert(alert);

            // Show incoming alert modal
            setIncomingAlertModal(true);

            // Start notification animation
            slideInNotification();

            // Start alert timer
            alertTimerRef.current = setInterval(() => {
                setAlertDuration(prev => prev + 1);
            }, 1000);

            // Auto-dismiss if enabled
            if (settings.autoDismiss) {
                setTimeout(() => {
                    handleDismissAlert();
                }, settings.autoDismissDelay * 1000);
            }
        } catch (error) {
            console.error('Trigger alert error:', error);
            Alert.alert('Error', 'Failed to trigger alert');
        }
    };

    const handleDismissAlert = async () => {
        if (alertTimerRef.current) {
            clearInterval(alertTimerRef.current);
            alertTimerRef.current = null;
        }

        setAlertDuration(0);
        await fakeMessageService.dismissAlert();
        setCurrentAlert(null);
        setIncomingAlertModal(false);
        setCustomMessage('');
        loadData(); // Refresh history
    };

    const handleQuickScenario = (preset) => {
        setSelectedPreset(preset);
        setCustomMessage(preset.message);
        setShowMessageModal(true);
    };

    const handleSendWithCustomMessage = () => {
        if (selectedPreset) {
            handleTriggerAlert(selectedPreset, customMessage);
            setShowMessageModal(false);
            setCustomMessage('');
            setSelectedPreset(null);
        }
    };

    const handleAddPreset = async () => {
        if (!customMessage.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return;
        }

        try {
            await fakeMessageService.addCustomPreset({
                name: `Custom ${alertPresets.length + 1}`,
                senderName: 'Custom',
                message: customMessage.trim(),
                category: 'custom',
                icon: 'chatbubble',
                priority: 'normal',
            });

            setCustomMessage('');
            setShowAddPreset(false);
            loadData();
            Alert.alert('Success', 'Custom preset added successfully');
        } catch (error) {
            console.error('Add preset error:', error);
            Alert.alert('Error', 'Failed to add preset');
        }
    };

    const handleDeletePreset = async (presetId) => {
        Alert.alert(
            'Delete Preset',
            'Are you sure you want to delete this preset?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await fakeMessageService.deletePreset(presetId);
                        loadData();
                    },
                },
            ]
        );
    };

    const handleUpdateSettings = async (key, value) => {
        try {
            await fakeMessageService.updateSettings({ [key]: value });
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Update settings error:', error);
        }
    };

    const getPresetIcon = (iconName) => {
        const iconMap = {
            briefcase: 'briefcase',
            heart: 'heart',
            restaurant: 'restaurant',
            cube: 'cube',
            person: 'person',
            medical: 'medical',
            car: 'car',
            paw: 'paw',
            warning: 'warning',
            chatbubble: 'chatbubble',
        };
        return iconMap[iconName] || 'chatbubble';
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return colors.error || '#ff4444';
            case 'high': return colors.warning || '#ffaa00';
            default: return colors.primary;
        }
    };

    const renderPreset = ({ item }) => (
        <TouchableOpacity
            style={[styles.presetCard, { backgroundColor: colors.card, ...shadows.small }]}
            onPress={() => handleQuickScenario(item)}
            onLongPress={() => item.isCustom && handleDeletePreset(item.id)}
        >
            <View style={[styles.presetIcon, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Ionicons
                    name={getPresetIcon(item.icon)}
                    size={24}
                    color={getPriorityColor(item.priority)}
                />
            </View>
            <View style={styles.presetInfo}>
                <Text style={[styles.presetName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.presetSender, { color: colors.gray }]} numberOfLines={1}>
                    From: {item.senderName}
                </Text>
                <Text style={[styles.presetMessage, { color: colors.gray }]} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                    {item.priority}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Triggers</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.quickActionCard, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
                        onPress={() => handleTriggerAlert(alertPresets.find(p => p.priority === 'urgent') || alertPresets[0])}
                    >
                        <Ionicons name="warning" size={28} color={colors.error} />
                        <Text style={[styles.quickActionText, { color: colors.error }]}>Emergency</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionCard, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                        onPress={() => handleTriggerAlert(alertPresets.find(p => p.category === 'work') || alertPresets[0])}
                    >
                        <Ionicons name="briefcase" size={28} color={colors.primary} />
                        <Text style={[styles.quickActionText, { color: colors.primary }]}>Work</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionCard, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
                        onPress={() => handleTriggerAlert(alertPresets.find(p => p.category === 'delivery') || alertPresets[2])}
                    >
                        <Ionicons name="cube" size={28} color={colors.secondary} />
                        <Text style={[styles.quickActionText, { color: colors.secondary }]}>Delivery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionCard, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                        onPress={() => handleTriggerAlert(alertPresets.find(p => p.category === 'social') || alertPresets[4])}
                    >
                        <Ionicons name="people" size={28} color={colors.success} />
                        <Text style={[styles.quickActionText, { color: colors.success }]}>Social</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Shake to Dismiss Setting */}
            <View style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.small }]}>
                <View style={styles.scenarioHeader}>
                    <View style={[styles.scenarioIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons
                            name="phone-portrait-outline"
                            size={24}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.scenarioInfo}>
                        <Text style={[styles.scenarioName, { color: colors.text }]}>Shake to Dismiss</Text>
                        <Text style={[styles.scenarioDesc, { color: colors.gray }]} numberOfLines={2}>
                            Shake your phone 2 times to dismiss an alert
                        </Text>
                    </View>
                    <Switch
                        value={shakeToDismissEnabled}
                        onValueChange={setShakeToDismissEnabled}
                        trackColor={{ false: colors.border, true: colors.primary + '80' }}
                        thumbColor={shakeToDismissEnabled ? colors.primary : colors.gray}
                    />
                </View>
            </View>

            {/* Alert Presets */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Message Alerts</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAddPreset(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={alertPresets}
                    renderItem={renderPreset}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                />
            </View>

            {/* Message History */}
            {messageHistory.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
                        <TouchableOpacity onPress={() => {
                            Alert.alert('Clear History', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Clear',
                                    style: 'destructive',
                                    onPress: async () => {
                                        await fakeMessageService.clearHistory();
                                        loadData();
                                    },
                                },
                            ]);
                        }}>
                            <Text style={{ color: colors.error }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    {messageHistory.slice(0, 5).map((msg, index) => (
                        <View
                            key={index}
                            style={[styles.historyItem, { backgroundColor: colors.card, ...shadows.small }]}
                        >
                            <Ionicons
                                name="chatbubble-outline"
                                size={20}
                                color={colors.primary}
                            />
                            <View style={styles.historyInfo}>
                                <Text style={[styles.historyName, { color: colors.text }]}>{msg.senderName}</Text>
                                <Text style={[styles.historyTime, { color: colors.gray }]}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                            <Text style={[styles.historyStatus, { color: colors.gray }]} numberOfLines={1}>
                                {msg.message.substring(0, 20)}...
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Settings */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

                <TouchableOpacity
                    style={[styles.settingItem, { backgroundColor: colors.card, ...shadows.small }]}
                    onPress={() => setShowEditSettings(true)}
                >
                    <View style={styles.settingLeft}>
                        <Ionicons name="settings" size={24} color={colors.primary} />
                        <Text style={[styles.settingText, { color: colors.text }]}>Alert Settings</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <View style={styles.instructionsContent}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use</Text>
                    <Text style={[styles.instructionsText, { color: colors.gray }]}>
                        1. Select a preset or use quick triggers{'\n'}
                        2. The app will simulate an incoming message{'\n'}
                        3. Use this to exit uncomfortable situations{'\n'}
                        4. Shake your phone to dismiss the alert
                    </Text>
                </View>
            </View>

            {/* Incoming Alert Modal */}
            <Modal visible={incomingAlertModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.alertModalContent,
                            {
                                backgroundColor: colors.card,
                                ...shadows.large,
                                transform: [{ scale: pulseAnim }]
                            }
                        ]}
                    >
                        <View style={styles.alertHeader}>
                            <Animated.View style={[styles.alertIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                                <Ionicons name="chatbubbles" size={40} color={colors.primary} />
                            </Animated.View>
                            <Text style={[styles.alertTitle, { color: colors.text }]}>New Message</Text>
                        </View>

                        {currentAlert && (
                            <View style={styles.alertBody}>
                                <View style={[styles.senderAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.senderInitial, { color: colors.primary }]}>
                                        {currentAlert.senderName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.senderName, { color: colors.text }]}>
                                    {currentAlert.senderName}
                                </Text>
                                <View style={[styles.messageBubble, { backgroundColor: colors.background }]}>
                                    <Text style={[styles.messageText, { color: colors.text }]}>
                                        {currentAlert.message}
                                    </Text>
                                </View>
                                <Text style={[styles.alertTime, { color: colors.gray }]}>
                                    Just now • {alertDuration}s ago
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.dismissButton, { backgroundColor: colors.primary }]}
                            onPress={handleDismissAlert}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                            <Text style={styles.dismissButtonText}>Dismiss Alert</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Custom Message Modal */}
            <Modal visible={showMessageModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Customize Message
                            </Text>
                            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>
                            From: {selectedPreset?.senderName}
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter custom message..."
                            placeholderTextColor={colors.gray}
                            value={customMessage}
                            onChangeText={setCustomMessage}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleSendWithCustomMessage}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Send Alert</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Preset Modal */}
            <Modal visible={showAddPreset} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Add Custom Preset
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddPreset(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Message content..."
                            placeholderTextColor={colors.gray}
                            value={customMessage}
                            onChangeText={setCustomMessage}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddPreset}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Add Preset</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Settings Modal */}
            <Modal visible={showEditSettings} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Alert Settings
                            </Text>
                            <TouchableOpacity onPress={() => setShowEditSettings(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabel}>
                                <Text style={[styles.settingLabelText, { color: colors.text }]}>Vibration</Text>
                                <Text style={[styles.settingDesc, { color: colors.gray }]}>Vibrate on incoming alert</Text>
                            </View>
                            <Switch
                                value={settings.vibration}
                                onValueChange={(val) => handleUpdateSettings('vibration', val)}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={settings.vibration ? colors.primary : colors.gray}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabel}>
                                <Text style={[styles.settingLabelText, { color: colors.text }]}>Speech Announcement</Text>
                                <Text style={[styles.settingDesc, { color: colors.gray }]}>Read message aloud</Text>
                            </View>
                            <Switch
                                value={settings.speechAnnouncement}
                                onValueChange={(val) => handleUpdateSettings('speechAnnouncement', val)}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={settings.speechAnnouncement ? colors.primary : colors.gray}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabel}>
                                <Text style={[styles.settingLabelText, { color: colors.text }]}>Auto-Dismiss</Text>
                                <Text style={[styles.settingDesc, { color: colors.gray }]}>Dismiss after {settings.autoDismissDelay || 5}s</Text>
                            </View>
                            <Switch
                                value={settings.autoDismiss}
                                onValueChange={(val) => handleUpdateSettings('autoDismiss', val)}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={settings.autoDismiss ? colors.primary : colors.gray}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        padding: 16,
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
        marginBottom: 12,
    },
    quickActionCard: {
        width: 90,
        height: 90,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
    },
    quickActionText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    scenarioCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 12,
    },
    scenarioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scenarioIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scenarioInfo: {
        flex: 1,
    },
    scenarioName: {
        fontSize: 16,
        fontWeight: '600',
    },
    scenarioDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    presetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    presetIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    presetInfo: {
        flex: 1,
    },
    presetName: {
        fontSize: 16,
        fontWeight: '600',
    },
    presetSender: {
        fontSize: 12,
        marginTop: 2,
    },
    presetMessage: {
        fontSize: 12,
        marginTop: 2,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    historyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    historyName: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyTime: {
        fontSize: 12,
    },
    historyStatus: {
        fontSize: 12,
        maxWidth: 100,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        marginLeft: 12,
    },
    instructionsCard: {
        flexDirection: 'row',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    instructionsContent: {
        flex: 1,
        marginLeft: 12,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    instructionsText: {
        fontSize: 13,
        lineHeight: 20,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: SCREEN_WIDTH - 32,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Alert modal styles
    alertModalContent: {
        width: SCREEN_WIDTH - 32,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    alertHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    alertIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    alertBody: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    senderAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    senderInitial: {
        fontSize: 24,
        fontWeight: '700',
    },
    senderName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    messageBubble: {
        padding: 16,
        borderRadius: 16,
        maxWidth: '100%',
        marginBottom: 8,
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
    },
    alertTime: {
        fontSize: 12,
    },
    dismissButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    dismissButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Settings modal
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        flex: 1,
    },
    settingLabelText: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDesc: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default FakeMessageAlertScreen;
