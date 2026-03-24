import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Dimensions,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import liveStreamService from '../services/liveStreamService';
import familyService from '../services/familyService';

const { width, height } = Dimensions.get('window');

const LiveShareScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();
    const { userId, userName } = useApp();

    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [duration, setDuration] = useState(0);
    const [activeStreams, setActiveStreams] = useState({
        screen: false,
        frontCamera: false,
        backCamera: false,
    });
    const [showContactModal, setShowContactModal] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [streamPermission, setStreamPermission] = useState(false);

    const timerRef = useRef(null);
    const locationSubscription = useRef(null);

    useEffect(() => {
        loadContacts();
        requestPermissions();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (locationSubscription.current) locationSubscription.current.remove();
        };
    }, []);

    const requestPermissions = async () => {
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (Platform.OS === 'android') {
            const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
            setStreamPermission(locationStatus === 'granted');
        }
    };

    const loadContacts = async () => {
        try {
            const familyMembers = await familyService.getFamilyMembers(userId);
            const trustedContacts = familyMembers.filter(m => m.role === 'trusted_contact' || m.role === 'member');
            setContacts(trustedContacts);
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            return location.coords;
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    };

    const startStreaming = async () => {
        try {
            const coords = await getCurrentLocation();
            const contactIds = selectedContacts.map(c => c.id);

            const result = await liveStreamService.startSession(
                userId,
                userName,
                contactIds,
                coords ? { latitude: coords.latitude, longitude: coords.longitude } : null
            );

            if (result.success) {
                setIsStreaming(true);
                setSessionId(result.session.sessionId);
                setDuration(0);

                timerRef.current = setInterval(() => {
                    setDuration(prev => prev + 1);
                }, 1000);

                locationSubscription.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 30000,
                        distanceInterval: 10,
                    },
                    async (location) => {
                        if (sessionId) {
                            await liveStreamService.updateLocation(
                                sessionId,
                                location.coords.latitude,
                                location.coords.longitude
                            );
                        }
                    }
                );

                sendNotificationToContacts(contactIds);
                Alert.alert('Live Sharing Started', 'Your live location and camera feeds are now being shared with selected contacts.');
            }
        } catch (error) {
            console.error('Error starting stream:', error);
            Alert.alert('Error', 'Failed to start live sharing. Please try again.');
        }
    };

    const sendNotificationToContacts = async (contactIds) => {
        for (const contactId of contactIds) {
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Emergency Alert',
                        body: `${userName} has started a live safety stream`,
                        data: { type: 'live_stream', sessionId, userId },
                    },
                    trigger: null,
                });
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }
    };

    const stopStreaming = async () => {
        Alert.alert(
            'Stop Sharing',
            'Are you sure you want to stop the live stream?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Stop',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (sessionId) {
                                await liveStreamService.stopSession(sessionId);
                            }
                            if (timerRef.current) clearInterval(timerRef.current);
                            if (locationSubscription.current) locationSubscription.current.remove();

                            setIsStreaming(false);
                            setSessionId(null);
                            setDuration(0);
                            setActiveStreams({
                                screen: false,
                                frontCamera: false,
                                backCamera: false,
                            });
                            Alert.alert('Stopped', 'Live sharing has been stopped.');
                        } catch (error) {
                            console.error('Error stopping stream:', error);
                        }
                    },
                },
            ]
        );
    };

    const toggleStream = async (streamType) => {
        if (!sessionId) return;

        const newState = !activeStreams[streamType];
        try {
            await liveStreamService.updateStream(sessionId, streamType, newState);
            setActiveStreams(prev => ({ ...prev, [streamType]: newState }));
        } catch (error) {
            console.error('Error toggling stream:', error);
        }
    };

    const toggleContactSelection = (contact) => {
        setSelectedContacts(prev => {
            const exists = prev.find(c => c.id === contact.id);
            if (exists) {
                return prev.filter(c => c.id !== contact.id);
            }
            return [...prev, contact];
        });
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderContactItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.contactItem,
                { backgroundColor: colors.card },
                selectedContacts.find(c => c.id === item.id) && { borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => toggleContactSelection(item)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>
                    {item.relation || 'Family Member'}
                </Text>
            </View>
            {selectedContacts.find(c => c.id === item.id) && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Live Safety Share</Text>
                </View>

                {!isStreaming ? (
                    <View style={styles.startContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="videocam" size={60} color={colors.primary} />
                        </View>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            Share your live location, screen, and camera feeds with trusted contacts during emergencies
                        </Text>

                        <TouchableOpacity
                            style={[styles.selectContactsButton, { backgroundColor: colors.card }]}
                            onPress={() => setShowContactModal(true)}
                        >
                            <Ionicons name="people" size={20} color={colors.primary} />
                            <Text style={[styles.selectContactsText, { color: colors.text }]}>
                                {selectedContacts.length > 0 
                                    ? `${selectedContacts.length} contacts selected`
                                    : 'Select Contacts to Share With'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: colors.primary }]}
                            onPress={startStreaming}
                        >
                            <Ionicons name="radio-button-on" size={24} color="#fff" />
                            <Text style={styles.startButtonText}>Start Live Sharing</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.streamingContainer}>
                        <View style={[styles.statusBar, { backgroundColor: colors.card }]}>
                            <View style={styles.statusItem}>
                                <View style={[styles.liveIndicator, { backgroundColor: '#ff4444' }]} />
                                <Text style={[styles.statusText, { color: colors.text }]}>LIVE</Text>
                            </View>
                            <View style={styles.statusItem}>
                                <Ionicons name="time" size={16} color={colors.textSecondary} />
                                <Text style={[styles.statusText, { color: colors.text }]}>
                                    {formatDuration(duration)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.streamOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.streamOption,
                                    { backgroundColor: activeStreams.screen ? colors.primary : colors.card }
                                ]}
                                onPress={() => toggleStream('screen')}
                            >
                                <Ionicons 
                                    name="monitor" 
                                    size={28} 
                                    color={activeStreams.screen ? '#fff' : colors.primary} 
                                />
                                <Text style={[
                                    styles.streamLabel,
                                    { color: activeStreams.screen ? '#fff' : colors.text }
                                ]}>
                                    Screen
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.streamOption,
                                    { backgroundColor: activeStreams.frontCamera ? colors.primary : colors.card }
                                ]}
                                onPress={() => toggleStream('frontCamera')}
                            >
                                <Ionicons 
                                    name="camera" 
                                    size={28} 
                                    color={activeStreams.frontCamera ? '#fff' : colors.primary} 
                                />
                                <Text style={[
                                    styles.streamLabel,
                                    { color: activeStreams.frontCamera ? '#fff' : colors.text }
                                ]}>
                                    Front Cam
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.streamOption,
                                    { backgroundColor: activeStreams.backCamera ? colors.primary : colors.card }
                                ]}
                                onPress={() => toggleStream('backCamera')}
                            >
                                <Ionicons 
                                    name="videocam" 
                                    size={28} 
                                    color={activeStreams.backCamera ? '#fff' : colors.primary} 
                                />
                                <Text style={[
                                    styles.streamLabel,
                                    { color: activeStreams.backCamera ? '#fff' : colors.text }
                                ]}>
                                    Back Cam
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.infoTitle, { color: colors.text }]}>Sharing With</Text>
                            {selectedContacts.length > 0 ? (
                                <View style={styles.sharedContacts}>
                                    {selectedContacts.slice(0, 3).map((contact, index) => (
                                        <Text key={index} style={[styles.sharedContact, { color: colors.textSecondary }]}>
                                            {contact.name}{index < Math.min(selectedContacts.length, 3) - 1 ? ', ' : ''}
                                        </Text>
                                    ))}
                                    {selectedContacts.length > 3 && (
                                        <Text style={[styles.moreText, { color: colors.primary }]}>
                                            +{selectedContacts.length - 3} more
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={[styles.noContacts, { color: colors.textSecondary }]}>
                                    Default primary contact will receive
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.stopButton, { backgroundColor: '#ff4444' }]}
                            onPress={stopStreaming}
                        >
                            <Ionicons name="stop-circle" size={24} color="#fff" />
                            <Text style={styles.stopButtonText}>Stop Sharing</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={showContactModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowContactModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Select Contacts
                            </Text>
                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={contacts}
                            renderItem={renderContactItem}
                            keyExtractor={item => item.id?.toString() || Math.random().toString()}
                            contentContainerStyle={styles.contactList}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No contacts found. Add family members first.
                                </Text>
                            }
                        />
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowContactModal(false)}
                        >
                            <Text style={styles.confirmButtonText}>
                                Confirm ({selectedContacts.length} selected)
                            </Text>
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
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    startContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    selectContactsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    selectContactsText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        justifyContent: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    streamingContainer: {
        alignItems: 'center',
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    streamOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    streamOption: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        width: width * 0.28,
    },
    streamLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    infoCard: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sharedContacts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sharedContact: {
        fontSize: 14,
    },
    moreText: {
        fontSize: 14,
        marginLeft: 4,
    },
    noContacts: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        justifyContent: 'center',
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    contactList: {
        paddingBottom: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 12,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
    },
    contactRelation: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
    },
    confirmButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LiveShareScreen;