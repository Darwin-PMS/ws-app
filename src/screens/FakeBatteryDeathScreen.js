// Fake Battery Death Screen
// Simulates phone shutdown for safety while continuing background tracking

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Modal,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
    Vibration,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import fakeBatteryService from '../services/fakeBatteryService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FakeBatteryDeathScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [settings, setSettings] = useState({});
    const [isActive, setIsActive] = useState(false);
    const [showShutdownModal, setShowShutdownModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [sessionTime, setSessionTime] = useState(0);
    const [pinInput, setPinInput] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [customTimer, setCustomTimer] = useState(30);
    const [isShuttingDown, setIsShuttingDown] = useState(false);
    const [shutdownProgress, setShutdownProgress] = useState(0);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const batteryAnim = useRef(new Animated.Value(1)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        loadData();
        startBlinkAnimation();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startBlinkAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, {
                    toValue: 0.3,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const loadData = async () => {
        try {
            const settingsData = await fakeBatteryService.getSettings();
            const status = await fakeBatteryService.getStatus();
            const historyData = await fakeBatteryService.getHistory();
            const scenarios = fakeBatteryService.getQuickScenarios();

            setSettings(settingsData);
            setIsActive(status.isActive);
            setHistory(historyData);

            if (status.isActive) {
                setShowShutdownModal(true);
                setSessionTime(status.sessionDuration);
                startSessionTimer();
            }
        } catch (error) {
            console.error('Load data error:', error);
        }
    };

    const startSessionTimer = () => {
        timerRef.current = setInterval(async () => {
            const status = await fakeBatteryService.getStatus();
            setSessionTime(status.sessionDuration);

            if (settings.wakeUpMethod === 'timer' && status.sessionDuration >= settings.wakeUpTimer) {
                handleAutoWakeUp();
            }
        }, 1000);
    };

    const handleAutoWakeUp = () => {
        Alert.alert(
            'Phone Waking Up',
            'Your preset timer has ended. The phone will now power on.',
            [{ text: 'OK', onPress: handleWakeUp }]
        );
    };

    const handleActivate = async (scenario = null) => {
        try {
            let timer = settings.wakeUpTimer;
            
            if (scenario) {
                if (scenario.id === '5') {
                    timer = customTimer;
                } else {
                    timer = scenario.duration;
                }
            }

            setSelectedScenario(scenario);
            setIsShuttingDown(true);
            setShutdownProgress(0);

            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 2500,
                useNativeDriver: false,
            }).start();

            const progressInterval = setInterval(() => {
                setShutdownProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        return 100;
                    }
                    return prev + 4;
                });
            }, 100);

            setTimeout(async () => {
                clearInterval(progressInterval);
                await fakeBatteryService.updateSettings({ wakeUpTimer: timer });
                await fakeBatteryService.activateFakeShutdown();
                
                setIsShuttingDown(false);
                setShowShutdownModal(true);
                setSessionTime(0);
                startSessionTimer();

                try {
                    Speech.speak('Battery critically low - Phone shutting down', {
                        language: 'en',
                        pitch: 0.8,
                        rate: 0.9,
                    });
                } catch (error) {
                    console.error('Speech error:', error);
                }
            }, 2500);

        } catch (error) {
            console.error('Activate error:', error);
            Alert.alert('Error', 'Failed to activate fake shutdown');
            setIsShuttingDown(false);
        }
    };

    const handleWakeUp = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        await fakeBatteryService.deactivateFakeShutdown();
        setShowShutdownModal(false);
        setIsActive(false);
        setSessionTime(0);
        loadData();

        Alert.alert('Success', 'Phone is now on!');
    };

    const handleDeclineWakeUp = () => {
        setShowPinModal(false);
        setPinInput('');
    };

    const handleVerifyPin = async () => {
        const isValid = await fakeBatteryService.verifyWakeUpPin(pinInput);
        if (isValid) {
            setShowPinModal(false);
            setPinInput('');
            handleWakeUp();
        } else {
            Alert.alert('Incorrect PIN', 'Please enter the correct PIN to wake up.');
            setPinInput('');
        }
    };

    const handleShakeToWakeUp = () => {
        if (settings.wakeUpMethod === 'gesture') {
            handleWakeUp();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getWakeUpMethodIcon = (method) => {
        switch (method) {
            case 'gesture': return 'phone-portrait';
            case 'timer': return 'timer';
            case 'button': return 'power';
            case 'pin': return 'key';
            default: return 'help';
        }
    };

    const renderScenario = (scenario) => (
        <TouchableOpacity
            key={scenario.id}
            style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.small }]}
            onPress={() => handleActivate(scenario)}
        >
            <View style={[styles.scenarioIcon, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name={scenario.icon} size={24} color={colors.danger} />
            </View>
            <Text style={[styles.scenarioName, { color: colors.text }]}>{scenario.name}</Text>
            <Text style={[styles.scenarioDuration, { color: colors.gray }]}>
                {scenario.duration > 0 ? `${scenario.duration}s` : 'Custom'}
            </Text>
        </TouchableOpacity>
    );

    const renderHistoryItem = (item, index) => (
        <View key={index} style={[styles.historyItem, { backgroundColor: colors.card, ...shadows.small }]}>
            <Ionicons
                name={item.type === 'wakeup' ? 'battery-full' : 'battery-dead'}
                size={20}
                color={item.type === 'wakeup' ? colors.success : colors.danger}
            />
            <View style={styles.historyInfo}>
                <Text style={[styles.historyType, { color: colors.text }]}>
                    {item.type === 'wakeup' ? 'Phone Woke Up' : 'Fake Shutdown'}
                </Text>
                <Text style={[styles.historyTime, { color: colors.gray }]}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
            {item.duration !== undefined && (
                <Text style={[styles.historyDuration, { color: colors.gray }]}>
                    {formatTime(item.duration)}s
                </Text>
            )}
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.danger }]}>
                <Ionicons name="battery-dead" size={40} color="#fff" />
                <Text style={styles.headerTitle}>Fake Battery Death</Text>
                <Text style={styles.headerSubtitle}>
                    Discreetly simulate phone shutdown to escape uncomfortable situations
                </Text>
            </View>

            {/* Quick Scenarios */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Scenarios</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {fakeBatteryService.getQuickScenarios().map(renderScenario)}
                </ScrollView>
            </View>

            {/* Custom Timer Option */}
            <View style={styles.section}>
                <View style={[styles.customTimerCard, { backgroundColor: colors.card, ...shadows.small }]}>
                    <View style={styles.customTimerHeader}>
                        <Ionicons name="timer" size={24} color={colors.primary} />
                        <Text style={[styles.customTimerTitle, { color: colors.text }]}>Custom Timer</Text>
                    </View>
                    <View style={styles.timerInputRow}>
                        <TextInput
                            style={[styles.timerInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={customTimer.toString()}
                            onChangeText={(text) => setCustomTimer(parseInt(text) || 0)}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                        <Text style={[styles.timerLabel, { color: colors.gray }]}>seconds</Text>
                        <TouchableOpacity
                            style={[styles.activateBtn, { backgroundColor: colors.danger }]}
                            onPress={() => handleActivate({ id: '5', duration: customTimer })}
                        >
                            <Ionicons name="power" size={20} color="#fff" />
                            <Text style={styles.activateBtnText}>Activate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Wake Up Method */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Wake Up Method</Text>
                <TouchableOpacity
                    style={[styles.wakeUpMethodCard, { backgroundColor: colors.card, ...shadows.small }]}
                    onPress={() => setShowSettingsModal(true)}
                >
                    <View style={[styles.wakeUpIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name={getWakeUpMethodIcon(settings.wakeUpMethod)} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.wakeUpInfo}>
                        <Text style={[styles.wakeUpName, { color: colors.text }]}>
                            {fakeBatteryService.getWakeUpMethods().find(m => m.id === settings.wakeUpMethod)?.name || 'Timer'}
                        </Text>
                        <Text style={[styles.wakeUpDesc, { color: colors.gray }]}>
                            {fakeBatteryService.getWakeUpMethods().find(m => m.id === settings.wakeUpMethod)?.description || ''}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.gray} />
                </TouchableOpacity>
            </View>

            {/* Continue Tracking Info */}
            <View style={[styles.trackingCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
                <Ionicons name="location" size={24} color={colors.success} />
                <View style={styles.trackingContent}>
                    <Text style={[styles.trackingTitle, { color: colors.text }]}>Background Tracking</Text>
                    <Text style={[styles.trackingText, { color: colors.gray }]}>
                        {settings.continueTracking 
                            ? 'Location tracking continues in background during fake shutdown'
                            : 'Location tracking will pause during fake shutdown'}
                    </Text>
                </View>
            </View>

            {/* History */}
            {history.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
                    {history.slice(0, 5).map(renderHistoryItem)}
                </View>
            )}

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <View style={styles.instructionsContent}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use</Text>
                    <Text style={[styles.instructionsText, { color: colors.gray }]}>
                        1. Select a scenario or set custom timer{'\n'}
                        2. Phone will show shutting down animation{'\n'}
                        3. Your location continues tracking{'\n'}
                        4. Use your chosen method to wake up
                    </Text>
                </View>
            </View>

            {/* Settings Modal */}
            <Modal visible={showSettingsModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Wake Up Method</Text>
                            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        {fakeBatteryService.getWakeUpMethods().map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodOption,
                                    { backgroundColor: settings.wakeUpMethod === method.id ? colors.primary + '20' : colors.background },
                                    { borderColor: settings.wakeUpMethod === method.id ? colors.primary : colors.border }
                                ]}
                                onPress={async () => {
                                    await fakeBatteryService.updateSettings({ wakeUpMethod: method.id });
                                    setSettings({ ...settings, wakeUpMethod: method.id });
                                    setShowSettingsModal(false);
                                }}
                            >
                                <Ionicons name={getWakeUpMethodIcon(method.id)} size={24} color={settings.wakeUpMethod === method.id ? colors.primary : colors.gray} />
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                                    <Text style={[styles.methodDesc, { color: colors.gray }]}>{method.description}</Text>
                                </View>
                                {settings.wakeUpMethod === method.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowSettingsModal(false)}
                        >
                            <Text style={styles.submitButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Shutdown Modal */}
            <Modal visible={showShutdownModal} animationType="slide" transparent>
                <View style={styles.shutdownOverlay}>
                    <StatusBar barStyle="light-content" />
                    
                    {/* Battery Animation */}
                    <Animated.View style={[styles.batteryContainer, { opacity: batteryAnim }]}>
                        <Animated.View style={[styles.batteryIcon, { transform: [{ scale: batteryAnim }] }]}>
                            <Ionicons name="battery-dead" size={80} color="#fff" />
                        </Animated.View>
                    </Animated.View>

                    {/* Shutdown Message */}
                    <Text style={styles.shutdownMessage}>
                        {settings.shutdownMessage || 'Battery critically low'}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View 
                                style={[
                                    styles.progressFill, 
                                    { width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })}
                                ]} 
                            />
                        </View>
                    </View>

                    {/* Session Timer */}
                    <Text style={styles.sessionTimer}>
                        Fake shutdown active: {formatTime(sessionTime)}
                    </Text>

                    {/* Wake Up Button */}
                    <TouchableOpacity
                        style={[styles.wakeUpButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            if (settings.wakeUpMethod === 'pin') {
                                setShowPinModal(true);
                            } else {
                                handleWakeUp();
                            }
                        }}
                    >
                        <Ionicons name="power" size={28} color="#fff" />
                        <Text style={styles.wakeUpButtonText}>Wake Up</Text>
                    </TouchableOpacity>

                    {/* Wake Up Method Hint */}
                    <Text style={styles.hintText}>
                        Method: {fakeBatteryService.getWakeUpMethods().find(m => m.id === settings.wakeUpMethod)?.name}
                    </Text>

                    {/* Shake Hint */}
                    {settings.wakeUpMethod === 'gesture' && (
                        <View style={styles.shakeHint}>
                            <Ionicons name="phone-portrait" size={20} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.shakeHintText}>Shake phone to wake up</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* PIN Modal */}
            <Modal visible={showPinModal} animationType="fade" transparent>
                <View style={styles.pinModalOverlay}>
                    <View style={[styles.pinModalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.pinModalHeader}>
                            <Ionicons name="key" size={32} color={colors.primary} />
                            <Text style={[styles.pinModalTitle, { color: colors.text }]}>Enter PIN to Wake Up</Text>
                        </View>

                        <TextInput
                            style={[styles.pinInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={pinInput}
                            onChangeText={setPinInput}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            placeholder="Enter 4-digit PIN"
                            placeholderTextColor={colors.gray}
                        />

                        <View style={styles.pinModalButtons}>
                            <TouchableOpacity
                                style={[styles.pinButton, { backgroundColor: colors.gray + '30' }]}
                                onPress={handleDeclineWakeUp}
                            >
                                <Text style={[styles.pinButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pinButton, { backgroundColor: colors.primary }]}
                                onPress={handleVerifyPin}
                            >
                                <Text style={[styles.pinButtonText, { color: '#fff' }]}>Wake Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Activating Shutdown Overlay */}
            <Modal visible={isShuttingDown} animationType="fade" transparent>
                <View style={styles.activatingOverlay}>
                    <View style={styles.activatingContent}>
                        <Animated.View style={[styles.activatingBattery, { opacity: blinkAnim }]}>
                            <Ionicons name="battery-dead" size={60} color="#fff" />
                        </Animated.View>
                        <Text style={styles.activatingText}>Shutting down...</Text>
                        <View style={styles.activatingProgress}>
                            <View style={[styles.activatingProgressFill, { width: `${shutdownProgress}%` }]} />
                        </View>
                        <Text style={styles.activatingPercentage}>{shutdownProgress}%</Text>
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
    header: {
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 8,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    scenarioCard: {
        width: 120,
        marginRight: 12,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    scenarioIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    scenarioName: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    scenarioDuration: {
        fontSize: 12,
        marginTop: 4,
    },
    customTimerCard: {
        padding: 16,
        borderRadius: 16,
    },
    customTimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    customTimerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    timerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 18,
        textAlign: 'center',
    },
    timerLabel: {
        marginLeft: 12,
        fontSize: 14,
    },
    activateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginLeft: 12,
        gap: 8,
    },
    activateBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    wakeUpMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    wakeUpIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wakeUpInfo: {
        flex: 1,
        marginLeft: 12,
    },
    wakeUpName: {
        fontSize: 16,
        fontWeight: '600',
    },
    wakeUpDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    trackingCard: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
    },
    trackingContent: {
        flex: 1,
        marginLeft: 12,
    },
    trackingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    trackingText: {
        fontSize: 12,
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
    historyType: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyTime: {
        fontSize: 12,
        marginTop: 2,
    },
    historyDuration: {
        fontSize: 12,
    },
    instructionsCard: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
    },
    instructionsContent: {
        flex: 1,
        marginLeft: 12,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 12,
        lineHeight: 20,
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
        fontWeight: 'bold',
    },
    methodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    methodInfo: {
        flex: 1,
        marginLeft: 12,
    },
    methodName: {
        fontSize: 14,
        fontWeight: '600',
    },
    methodDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    submitButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    shutdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    batteryContainer: {
        marginBottom: 40,
    },
    batteryIcon: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutdownMessage: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 40,
    },
    progressContainer: {
        width: '80%',
        marginBottom: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ff4444',
    },
    sessionTimer: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 40,
    },
    wakeUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 8,
    },
    wakeUpButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    hintText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 20,
    },
    shakeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    shakeHintText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
    },
    pinModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pinModalContent: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
    },
    pinModalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    pinModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    pinInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
    },
    pinModalButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    pinButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    pinButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    activatingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activatingContent: {
        alignItems: 'center',
    },
    activatingBattery: {
        marginBottom: 20,
    },
    activatingText: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    activatingProgress: {
        width: 200,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    activatingProgressFill: {
        height: '100%',
        backgroundColor: '#ff4444',
    },
    activatingPercentage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 10,
    },
});

export default FakeBatteryDeathScreen;
