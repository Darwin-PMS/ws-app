import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
    Dimensions, Modal, FlatList, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import liveStreamService from '../services/liveStreamService';
import databaseService from '../services/databaseService';

const { width } = Dimensions.get('window');

const LiveShareScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const { userId, userName } = useApp();

    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [duration, setDuration] = useState(0);
    const [activeStreams, setActiveStreams] = useState({ screen: false, frontCamera: false, backCamera: false });
    const [showContactModal, setShowContactModal] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const timerRef = useRef(null);
    const locationSubscription = useRef(null);

    useEffect(() => {
        loadContacts();
        requestPermissions();
        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])).start();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (locationSubscription.current) locationSubscription.current.remove();
            if (locationUpdateInterval) clearInterval(locationUpdateInterval);
        };
    }, []);

    const requestPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (Platform.OS === 'android') await Notifications.requestPermissionsAsync();
    };

    const loadContacts = async () => {
        setLoadingContacts(true);
        try {
            const emergencyContacts = await databaseService.getEmergencyContacts(userId);
            if (emergencyContacts.success && emergencyContacts.contacts) {
                const formattedContacts = emergencyContacts.contacts.map(c => ({
                    id: c.id,
                    name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unknown',
                    email: c.email,
                    phone: c.phone,
                    role: 'emergency_contact',
                    first_name: c.first_name,
                    last_name: c.last_name,
                }));
                setContacts(formattedContacts);
            } else {
                setContacts([]);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            const loc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setCurrentLocation(loc);
            return loc;
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    };

    const startStreaming = async () => {
        try {
            const coords = await getCurrentLocation();
            const result = await liveStreamService.startSession(
                userId,
                userName,
                selectedContacts.map(c => c.id),
                coords ? { latitude: coords.latitude, longitude: coords.longitude } : null
            );
            if (result.success) {
                setIsStreaming(true);
                setSessionId(result.session.sessionId);
                setDuration(0);
                timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
                
                const interval = setInterval(async () => {
                    try {
                        const loc = await getCurrentLocation();
                        if (loc && sessionId) {
                            await liveStreamService.updateLocation(result.session.sessionId, loc.latitude, loc.longitude);
                        }
                    } catch (e) {
                        console.log('Location update error:', e);
                    }
                }, 30000);
                setLocationUpdateInterval(interval);

                if (coords) {
                    locationSubscription.current = await Location.watchPositionAsync(
                        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
                        async (location) => {
                            const loc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                            setCurrentLocation(loc);
                            if (result.session.sessionId) {
                                try {
                                    await liveStreamService.updateLocation(result.session.sessionId, loc.latitude, loc.longitude);
                                } catch (e) {
                                    console.log('Location update error:', e);
                                }
                            }
                        }
                    );
                }

                Alert.alert('Live Sharing Started', 'Your live location and camera feeds are now being shared with selected contacts.');
            } else {
                Alert.alert('Error', result.message || 'Failed to start live sharing.');
            }
        } catch (error) {
            console.error('Start streaming error:', error);
            Alert.alert('Error', 'Failed to start live sharing. Please try again.');
        }
    };

    const stopStreaming = () => {
        Alert.alert('Stop Sharing', 'Are you sure you want to stop the live stream?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Stop', style: 'destructive', onPress: async () => {
                try {
                    if (sessionId) await liveStreamService.stopSession(sessionId);
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (locationUpdateInterval) clearInterval(locationUpdateInterval);
                    if (locationSubscription.current) locationSubscription.current.remove();
                    setIsStreaming(false);
                    setSessionId(null);
                    setDuration(0);
                    setActiveStreams({ screen: false, frontCamera: false, backCamera: false });
                    setLocationUpdateInterval(null);
                    Alert.alert('Stopped', 'Live sharing has been stopped.');
                } catch (error) {
                    console.error('Error stopping stream:', error);
                }
            }},
        ]);
    };

    const toggleStream = async (streamType) => {
        if (!sessionId) return;
        const newState = !activeStreams[streamType];
        try {
            await liveStreamService.updateStream(sessionId, streamType, newState);
            setActiveStreams(prev => ({ ...prev, [streamType]: newState }));
        } catch (error) {
            console.error('Error toggling stream:', error);
            Alert.alert('Error', 'Failed to update stream settings.');
        }
    };

    const toggleContactSelection = (contact) => {
        setSelectedContacts(prev => prev.find(c => c.id === contact.id) ? prev.filter(c => c.id !== contact.id) : [...prev, contact]);
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderContactItem = ({ item }) => {
        const isSelected = selectedContacts.find(c => c.id === item.id);
        const contactName = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Unknown';
        return (
            <TouchableOpacity style={[styles.contactItem, { backgroundColor: colors.card }, isSelected && { borderColor: colors.primary, borderWidth: 2 }]} onPress={() => toggleContactSelection(item)}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{contactName}</Text>
                    <Text style={[styles.contactRelation, { color: colors.gray }]}>{item.role || 'Family Member'}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: isStreaming ? '#EF4444' : colors.primary }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Live Safety Share</Text>
                        <Text style={styles.headerSubtitle}>{isStreaming ? 'Recording active' : 'Share your safety in real-time'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {!isStreaming ? (
                    <View style={styles.startSection}>
                        <Animated.View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15', transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="videocam-outline" size={56} color={colors.primary} />
                        </Animated.View>
                        <Text style={[styles.mainTitle, { color: colors.text }]}>Start Live Safety Share</Text>
                        <Text style={[styles.mainDesc, { color: colors.gray }]}>Share your live location, screen, and camera feeds with trusted contacts during emergencies</Text>

                        <TouchableOpacity style={[styles.selectContactsCard, { backgroundColor: colors.card, ...shadows.md }]} onPress={() => setShowContactModal(true)}>
                            <View style={[styles.selectIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="people-outline" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.selectInfo}>
                                <Text style={[styles.selectTitle, { color: colors.text }]}>
                                    {selectedContacts.length > 0 ? `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} selected` : 'Select Contacts'}
                                </Text>
                                <Text style={[styles.selectSubtitle, { color: colors.gray }]}>Choose who can view your stream</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={22} color={colors.gray} />
                        </TouchableOpacity>

                        <View style={styles.featureList}>
                            {[
                                { icon: 'location-outline', text: 'Real-time location sharing', color: '#10B981' },
                                { icon: 'videocam-outline', text: 'Live camera feed access', color: '#3B82F6' },
                                { icon: 'shield-checkmark-outline', text: 'Emergency alerts sent', color: '#EF4444' },
                            ].map((feature, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                                        <Ionicons name={feature.icon} size={18} color={feature.color} />
                                    </View>
                                    <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={startStreaming} activeOpacity={0.8}>
                            <Ionicons name="radio-button-on-outline" size={26} color="#fff" />
                            <Text style={styles.startBtnText}>Start Live Sharing</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.streamingSection}>
                        <View style={[styles.statusCard, { backgroundColor: colors.card, ...shadows.md }]}>
                            <View style={styles.statusRow}>
                                <View style={styles.liveBadge}>
                                    <Animated.View style={[styles.pulseDot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                                <View style={[styles.durationBadge, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.durationText, { color: colors.primary }]}>{formatDuration(duration)}</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.streamTitle, { color: colors.text }]}>Active Streams</Text>
                        <View style={styles.streamGrid}>
                            {[
                                { type: 'screen', icon: 'laptop-outline', label: 'Screen' },
                                { type: 'frontCamera', icon: 'camera-outline', label: 'Front Cam' },
                                { type: 'backCamera', icon: 'videocam-outline', label: 'Back Cam' },
                            ].map((stream) => (
                                <TouchableOpacity key={stream.type} style={[styles.streamCard, { backgroundColor: activeStreams[stream.type] ? colors.primary : colors.card, ...shadows.sm }]} onPress={() => toggleStream(stream.type)} activeOpacity={0.7}>
                                    <Ionicons name={stream.icon} size={32} color={activeStreams[stream.type] ? '#fff' : colors.primary} />
                                    <Text style={[styles.streamLabel, { color: activeStreams[stream.type] ? '#fff' : colors.text }]}>{stream.label}</Text>
                                    <View style={[styles.streamStatus, { backgroundColor: activeStreams[stream.type] ? 'rgba(255,255,255,0.3)' : colors.primary + '15' }]}>
                                        <Ionicons name={activeStreams[stream.type] ? 'checkmark-circle-outline' : 'add-circle-outline'} size={18} color={activeStreams[stream.type] ? '#fff' : colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[styles.sharedCard, { backgroundColor: colors.card, ...shadows.md }]}>
                            <Text style={[styles.sharedTitle, { color: colors.text }]}>Sharing With</Text>
                            {selectedContacts.length > 0 ? (
                                <View style={styles.sharedList}>
                                    {selectedContacts.slice(0, 3).map((contact, i) => {
                                        const contactName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown';
                                        return (
                                            <View key={contact.id} style={[styles.sharedItem, { backgroundColor: colors.primary + '10' }]}>
                                                <Ionicons name="person-outline" size={14} color={colors.primary} />
                                                <Text style={[styles.sharedItemText, { color: colors.text }]}>{contactName}</Text>
                                            </View>
                                        );
                                    })}
                                    {selectedContacts.length > 3 && <Text style={[styles.moreText, { color: colors.primary }]}>+{selectedContacts.length - 3} more</Text>}
                                </View>
                            ) : <Text style={[styles.defaultText, { color: colors.gray }]}>Default primary contact will receive</Text>}
                        </View>

                        <TouchableOpacity style={[styles.stopBtn, { backgroundColor: '#EF4444' }]} onPress={stopStreaming} activeOpacity={0.8}>
                            <Ionicons name="stop-circle-outline" size={26} color="#fff" />
                            <Text style={styles.stopBtnText}>Stop Sharing</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.bottomPadding} />
            </ScrollView>

            <Modal visible={showContactModal} animationType="slide" transparent onRequestClose={() => setShowContactModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Contacts</Text>
                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>
                        <FlatList 
                            data={contacts} 
                            renderItem={renderContactItem} 
                            keyExtractor={item => item.id?.toString() || Math.random().toString()} 
                            style={styles.contactList} 
                            ListEmptyComponent={
                                loadingContacts 
                                    ? <Text style={[styles.emptyText, { color: colors.gray }]}>Loading contacts...</Text>
                                    : <Text style={[styles.emptyText, { color: colors.gray }]}>No emergency contacts found.{'\n'}Please add emergency contacts first.</Text>
                            } 
                        />
                        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={() => setShowContactModal(false)}>
                            <Text style={styles.confirmBtnText}>Confirm ({selectedContacts.length} selected)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    content: { flex: 1, padding: 16 },
    startSection: { alignItems: 'center', paddingTop: 20 },
    iconWrapper: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    mainDesc: { fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    selectContactsCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, width: '100%' },
    selectIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    selectInfo: { flex: 1, marginLeft: 14 },
    selectTitle: { fontSize: 16, fontWeight: '600' },
    selectSubtitle: { fontSize: 12, marginTop: 2 },
    featureList: { width: '100%', marginBottom: 28, gap: 12 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    featureText: { fontSize: 14 },
    startBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, gap: 12 },
    startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    streamingSection: { paddingTop: 20 },
    statusCard: { padding: 16, borderRadius: 16, marginBottom: 20 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444415', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 8 },
    pulseDot: { width: 10, height: 10, borderRadius: 5 },
    liveText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
    durationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
    durationText: { fontSize: 14, fontWeight: '600' },
    streamTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
    streamGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    streamCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
    streamLabel: { fontSize: 12, fontWeight: '600', marginTop: 10 },
    streamStatus: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    sharedCard: { padding: 18, borderRadius: 16, marginBottom: 24 },
    sharedTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    sharedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sharedItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    sharedItemText: { fontSize: 13, fontWeight: '500' },
    moreText: { fontSize: 13, fontWeight: '600', alignSelf: 'center' },
    defaultText: { fontSize: 13, fontStyle: 'italic' },
    stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 12 },
    stopBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    bottomPadding: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    contactList: { maxHeight: 300 },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactName: { fontSize: 15, fontWeight: '600' },
    contactRelation: { fontSize: 12, marginTop: 2 },
    emptyText: { textAlign: 'center', marginTop: 40 },
    confirmBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default LiveShareScreen;
