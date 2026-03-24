// Fake Call Screen
// Simulate incoming calls and messages for safety
// Enhanced with realistic call UI, vibration patterns, and quick exit

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
import fakeCallService from '../services/fakeCallService';
import { useShakeDetector } from '../hooks/useShakeDetector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FakeCallScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ringAnim = useRef(new Animated.Value(0)).current;

    const [contacts, setContacts] = useState([]);
    const [settings, setSettings] = useState({});
    const [currentCall, setCurrentCall] = useState(null);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [callHistory, setCallHistory] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    // Enhanced call states
    const [incomingCallModal, setIncomingCallModal] = useState(false);
    const [incomingContact, setIncomingContact] = useState(null);

    // Shake-to-decline feature state
    const [shakeToDeclineEnabled, setShakeToDeclineEnabled] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(false);
    const callTimerRef = useRef(null);
    const ringIntervalRef = useRef(null);

    useEffect(() => {
        loadData();
        startPulseAnimation();

        return () => {
            // Cleanup animations and timers
            if (callTimerRef.current) clearInterval(callTimerRef.current);
            if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        };
    }, []);

    // Pulse animation for incoming call
    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Vibration patterns
    const triggerVibration = (pattern = 'default') => {
        const patterns = {
            default: [0, 500, 200, 500],
            urgent: [0, 200, 100, 200, 100, 200],
            silent: [],
            custom: settings?.vibrationPattern || [0, 500, 200, 500],
        };

        if (pattern === 'silent') {
            return;
        }

        if (!settings?.vibration) {
            return;
        }

        const selectedPattern = pattern === 'custom' ? patterns.custom : patterns[pattern] || patterns.default;
        Vibration.vibrate(selectedPattern);
    };

    // Quick shake to decline (shake device)
    const handleShakeToDecline = useCallback(() => {
        if (incomingCallModal && shakeToDeclineEnabled) {
            handleDeclineCall();
            setIncomingCallModal(false);
            Alert.alert('Call Declined', 'Shake gesture detected - call declined');
        }
    }, [incomingCallModal, shakeToDeclineEnabled]);

    // Shake detector - only active during incoming call
    // Using 2 shakes for quick decline (faster response)
    useShakeDetector(
        handleShakeToDecline,
        incomingCallModal && shakeToDeclineEnabled,
        {
            requiredShakes: 2,
            shakeThreshold: 2.0,
            timeWindow: 2000,
            shakeInterval: 300
        }
    );

    const simulateShakeToDecline = () => {
        handleDeclineCall();
        setIncomingCallModal(false);
        Alert.alert('Call Declined', 'Shake gesture detected - call declined');
    };

    const loadData = async () => {
        try {
            const contactsData = await fakeCallService.getContacts();
            const settingsData = await fakeCallService.getSettings();
            const historyData = await fakeCallService.getCallHistory();
            const emergencyScenarios = fakeCallService.getEmergencyScenarios();

            setContacts(contactsData);
            setSettings(settingsData);
            setCallHistory(historyData);
            setScenarios(emergencyScenarios);
        } catch (error) {
            console.error('Load data error:', error);
        }
    };

    const handleSimulateCall = async (contact) => {
        try {
            const call = await fakeCallService.simulateIncomingCall(contact);
            setCurrentCall(call);
            setIncomingContact(contact);

            // Trigger vibration
            triggerVibration('default');

            // Start ring animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(ringAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Show incoming call modal
            setIncomingCallModal(true);

            // Play speech announcement
            try {
                Speech.speak(`Incoming call from ${contact.name}`, {
                    language: 'en',
                    pitch: 1.0,
                    rate: 0.9,
                });
            } catch (error) {
                console.error('Speech error:', error);
            }
        } catch (error) {
            console.error('Simulate call error:', error);
            Alert.alert('Error', 'Failed to simulate call');
        }
    };

    const handleAcceptCall = async () => {
        // Stop vibration and ring animation
        Vibration.cancel();
        ringAnim.stopAnimation();

        const call = await fakeCallService.acceptCall();
        setCurrentCall(call);
        setIsCallActive(true);
        setIncomingCallModal(false);

        // Start call timer
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        Alert.alert(
            'Call in Progress',
            `Speaking with ${call.contact.name}...\n\nTip: Shake device to end call quickly`,
            [
                {
                    text: 'End Call',
                    onPress: handleEndCall,
                },
            ]
        );
    };

    const handleDeclineCall = async () => {
        // Stop vibration and ring animation
        Vibration.cancel();
        ringAnim.stopAnimation();

        await fakeCallService.declineCall();
        setCurrentCall(null);
        setIncomingContact(null);
        setIncomingCallModal(false);
    };

    const handleEndCall = async () => {
        // Stop timer
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }

        setCallDuration(0);
        setIsCallActive(false);

        await fakeCallService.endCall();
        setCurrentCall(null);
        setIncomingContact(null);
        loadData(); // Refresh history
    };

    const handleSendMessage = async () => {
        if (!selectedContact) {
            Alert.alert('Error', 'Please select a contact');
            return;
        }

        try {
            const message = await fakeCallService.sendFakeMessage(selectedContact, messageText);
            setShowMessageModal(false);
            setMessageText('');
            Alert.alert('Message Sent', `Message sent to ${selectedContact.name}`);
        } catch (error) {
            console.error('Send message error:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const handleQuickScenario = (scenario) => {
        const contact = contacts.find(c => c.name === scenario.contactName) || contacts[0];

        if (scenario.type === 'call') {
            handleSimulateCall(contact);
        } else {
            setSelectedContact(contact);
            setMessageText(scenario.message);
            handleSendMessage();
        }
    };

    const handleAddContact = async () => {
        if (!newContactName.trim()) {
            Alert.alert('Error', 'Please enter a contact name');
            return;
        }

        try {
            await fakeCallService.addContact({
                name: newContactName.trim(),
                phone: newContactPhone.trim(),
            });

            setNewContactName('');
            setNewContactPhone('');
            setShowAddContact(false);
            loadData();
            Alert.alert('Success', 'Contact added successfully');
        } catch (error) {
            console.error('Add contact error:', error);
            Alert.alert('Error', 'Failed to add contact');
        }
    };

    const renderContact = ({ item }) => (
        <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.card, ...shadows.small }]}
            onPress={() => handleSimulateCall(item)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.contactPhone, { color: colors.gray }]}>{item.phone || 'No phone'}</Text>
            </View>
            <View style={styles.contactActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleSimulateCall(item)}
                >
                    <Ionicons name="call" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary + '20' }]}
                    onPress={() => {
                        setSelectedContact(item);
                        setShowMessageModal(true);
                    }}
                >
                    <Ionicons name="chatbubble" size={20} color={colors.secondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Quick Scenarios */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Scenarios</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {scenarios.map((scenario) => (
                        <TouchableOpacity
                            key={scenario.id}
                            style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.small }]}
                            onPress={() => handleQuickScenario(scenario)}
                        >
                            <View style={[styles.scenarioIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons
                                    name={scenario.type === 'call' ? 'call' : 'chatbubble'}
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={[styles.scenarioName, { color: colors.text }]}>{scenario.name}</Text>
                            <Text style={[styles.scenarioDesc, { color: colors.gray }]} numberOfLines={2}>
                                {scenario.message}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Shake-to-Decline Setting */}
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
                        <Text style={[styles.scenarioName, { color: colors.text }]}>Shake to Decline</Text>
                        <Text style={[styles.scenarioDesc, { color: colors.gray }]} numberOfLines={2}>
                            Shake your phone 2 times to decline an incoming call
                        </Text>
                    </View>
                    <Switch
                        value={shakeToDeclineEnabled}
                        onValueChange={setShakeToDeclineEnabled}
                        trackColor={{ false: colors.border, true: colors.primary + '80' }}
                        thumbColor={shakeToDeclineEnabled ? colors.primary : colors.gray}
                    />
                </View>
            </View>

            {/* Contacts */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Contacts</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAddContact(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {contacts.map((contact) => (
                    <View key={contact.id}>
                        {renderContact({ item: contact })}
                    </View>
                ))}
            </View>

            {/* Call History */}
            {callHistory.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
                    {callHistory.slice(0, 5).map((call, index) => (
                        <View
                            key={index}
                            style={[styles.historyItem, { backgroundColor: colors.card, ...shadows.small }]}
                        >
                            <Ionicons
                                name={call.status === 'declined' ? 'call-outline' : 'call'}
                                size={20}
                                color={call.status === 'declined' ? colors.gray : colors.primary}
                            />
                            <View style={styles.historyInfo}>
                                <Text style={[styles.historyName, { color: colors.text }]}>{call.name}</Text>
                                <Text style={[styles.historyTime, { color: colors.gray }]}>
                                    {new Date(call.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                            <Text style={[styles.historyStatus, { color: colors.gray }]}>
                                {call.status}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <View style={styles.instructionsContent}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use</Text>
                    <Text style={[styles.instructionsText, { color: colors.gray }]}>
                        1. Select a contact or use quick scenarios{'\n'}
                        2. The app will simulate an incoming call{'\n'}
                        3. Accept to start the simulated conversation{'\n'}
                        4. Use this to exit uncomfortable situations
                    </Text>
                </View>
            </View>

            {/* Add Contact Modal */}
            <Modal visible={showAddContact} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Contact</Text>
                            <TouchableOpacity onPress={() => setShowAddContact(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Contact Name"
                            placeholderTextColor={colors.gray}
                            value={newContactName}
                            onChangeText={setNewContactName}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Phone Number"
                            placeholderTextColor={colors.gray}
                            value={newContactPhone}
                            onChangeText={setNewContactPhone}
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddContact}
                        >
                            <Text style={styles.submitButtonText}>Add Contact</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Message Modal */}
            <Modal visible={showMessageModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Send Message from {selectedContact?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, styles.messageInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter message..."
                            placeholderTextColor={colors.gray}
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleSendMessage}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Send Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Realistic Incoming Call Modal */}
            <Modal visible={incomingCallModal} animationType="slide" transparent>
                <View style={styles.incomingCallOverlay}>
                    <StatusBar barStyle="light-content" />
                    <View style={styles.incomingCallContainer}>
                        {/* Caller Info */}
                        <View style={styles.callerInfo}>
                            <Animated.View
                                style={[
                                    styles.callerAvatar,
                                    { backgroundColor: colors.primary + '30' },
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            >
                                <Text style={styles.callerAvatarText}>
                                    {incomingContact?.name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </Animated.View>

                            <Text style={styles.callerName}>{incomingContact?.name || 'Unknown'}</Text>
                            <Text style={styles.callerNumber}>{incomingContact?.phone || 'No number'}</Text>
                            <Text style={styles.callingText}>is calling...</Text>
                        </View>

                        {/* Call Actions */}
                        <View style={styles.callActions}>
                            {/* Decline Button */}
                            <TouchableOpacity
                                style={[styles.callActionBtn, styles.declineBtn]}
                                onPress={handleDeclineCall}
                            >
                                <Ionicons name="call-outline" size={28} color="#fff" />
                                <Text style={styles.callActionText}>Decline</Text>
                            </TouchableOpacity>

                            {/* Accept Button */}
                            <TouchableOpacity
                                style={[styles.callActionBtn, styles.acceptBtn]}
                                onPress={handleAcceptCall}
                            >
                                <Ionicons name="call" size={28} color="#fff" />
                                <Text style={styles.callActionText}>Accept</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Tip */}
                        <View style={styles.quickTip}>
                            <Ionicons name="information-circle" size={16} color="#fff" />
                            <Text style={styles.quickTipText}>
                                Tip: Shake your phone to decline quickly
                            </Text>
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
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 4,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 12,
    },
    scenarioCard: {
        width: 160,
        marginRight: 12,
        padding: 16,
        borderRadius: 16,
    },
    scenarioIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    scenarioName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    scenarioDesc: {
        fontSize: 12,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 12,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
    },
    contactPhone: {
        fontSize: 12,
        marginTop: 2,
    },
    contactActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        fontWeight: '500',
    },
    historyTime: {
        fontSize: 12,
        marginTop: 2,
    },
    historyStatus: {
        fontSize: 12,
        textTransform: 'capitalize',
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
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    messageInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Realistic Incoming Call Modal Styles
    incomingCallOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    incomingCallContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    callerInfo: {
        alignItems: 'center',
        marginBottom: 60,
    },
    callerAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    callerAvatarText: {
        fontSize: 48,
        fontWeight: '300',
        color: '#fff',
    },
    callerName: {
        fontSize: 32,
        fontWeight: '300',
        color: '#fff',
        marginBottom: 8,
    },
    callerNumber: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 8,
    },
    callingText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '300',
    },
    callActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    callActionBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#4CAF50',
    },
    declineBtn: {
        backgroundColor: '#F44336',
    },
    callActionText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    quickTip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    quickTipText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
});

export default FakeCallScreen;
