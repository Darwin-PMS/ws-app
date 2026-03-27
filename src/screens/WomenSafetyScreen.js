import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Vibration,
    ActivityIndicator,
    Modal,
    TextInput,
    Linking,
    Platform,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import * as AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import databaseService from '../services/databaseService';
import sosService from '../services/sosService';
import locationService from '../services/locationService';
import recordingService from '../services/recordingService';
import offlineService from '../services/offlineService';
import batteryService from '../services/batteryService';
import signalService from '../services/signalService';

const WomenSafetyScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId, userName } = useApp();

    const [location, setLocation] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [defaultContacts, setDefaultContacts] = useState([]);

    const [isSOSActive, setIsSOSActive] = useState(false);
    const [sosStartTime, setSosStartTime] = useState(null);
    const sosLocationIntervalRef = useRef(null);
    const sosLocationHistoryRef = useRef([]);

    const [fakeCallCallerName, setFakeCallCallerName] = useState('Mom');
    const [isFakeCallActive, setIsFakeCallActive] = useState(false);
    const [fakeCallTimer, setFakeCallTimer] = useState(0);
    const fakeCallInterval = useRef(null);

    const [isSirenActive, setIsSirenActive] = useState(false);
    const sirenTimeoutRef = useRef(null);

    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactPriority, setNewContactPriority] = useState(1);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [showCallerNameModal, setShowCallerNameModal] = useState(false);
    const [tempCallerName, setTempCallerName] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const [recordingType, setRecordingType] = useState('audio');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [hasRecordingPermission, setHasRecordingPermission] = useState(false);
    const [autoRecordOnSOS, setAutoRecordOnSOS] = useState(true);
    const cameraRef = useRef(null);
    const recordingInterval = useRef(null);
    const recordingRef = useRef(null);

    const [batteryStatus, setBatteryStatus] = useState(null);
    const [signalStatus, setSignalStatus] = useState(null);
    const [signalWarning, setSignalWarning] = useState(null);
    const batteryCheckIntervalRef = useRef(null);
    const signalCheckIntervalRef = useRef(null);

    useEffect(() => {
        loadEmergencyContacts();
        requestLocationPermission();
        loadFakeCallSettings();
        requestRecordingPermissions();
        initializeDeviceMonitoring();

        return () => {
            if (fakeCallInterval.current) clearInterval(fakeCallInterval.current);
            Speech.stop();
            if (sirenTimeoutRef.current) clearTimeout(sirenTimeoutRef.current);
            if (recordingInterval.current) clearInterval(recordingInterval.current);
            stopRecording();
            stopSOSLiveTracking();
            stopDeviceMonitoring();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadEmergencyContacts();
        });
        return unsubscribe;
    }, [navigation]);

    const initializeDeviceMonitoring = async () => {
        try {
            await batteryService.initialize();
            await batteryService.loadAlertState();
            await signalService.initialize();
            startDeviceMonitoring();
        } catch (error) {
            console.error('Error initializing device monitoring:', error);
        }
    };

    const startDeviceMonitoring = () => {
        batteryCheckIntervalRef.current = setInterval(async () => {
            const status = await batteryService.getBatteryStatus();
            setBatteryStatus(status);
            if (isSOSActive && emergencyContacts.length > 0) {
                await batteryService.checkAndAlert(emergencyContacts, userName);
            }
            if (isSOSActive) adjustTrackingForBattery(status);
        }, 60000);

        signalCheckIntervalRef.current = setInterval(async () => {
            const status = await signalService.getSignalStatus();
            setSignalStatus(status);
            const warning = await signalService.getWarningMessage();
            setSignalWarning(warning);
            if (isSOSActive) adjustTrackingForSignal(status);
        }, 30000);
    };

    const stopDeviceMonitoring = () => {
        if (batteryCheckIntervalRef.current) clearInterval(batteryCheckIntervalRef.current);
        if (signalCheckIntervalRef.current) clearInterval(signalCheckIntervalRef.current);
        batteryService.stopMonitoring();
        signalService.stopMonitoring();
    };

    const adjustTrackingForBattery = async (batteryStatus) => {
        const optimalInterval = batteryService.getOptimalTrackingInterval();
        const shouldContinue = batteryService.shouldContinueTracking();
        if (!shouldContinue && sosLocationIntervalRef.current) {
            Alert.alert('Low Battery', 'Live tracking paused to preserve battery for emergency calls.');
        }
    };

    const adjustTrackingForSignal = async (signalStatus) => {
        const pauseCheck = await signalService.shouldPauseTracking();
        if (pauseCheck.shouldPause && sosLocationIntervalRef.current) {
            setSignalWarning(pauseCheck.reason);
        } else {
            setSignalWarning(null);
        }
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') getCurrentLocation();
    };

    const requestRecordingPermissions = async () => {
        try {
            const cameraPermission = await Camera.requestCameraPermissionsAsync();
            const audioPermission = await Audio.requestPermissionsAsync();
            const mediaPermission = await MediaLibrary.requestPermissionsAsync();
            if (cameraPermission.status === 'granted' && audioPermission.status === 'granted' && mediaPermission.status === 'granted') {
                setHasRecordingPermission(true);
            }
        } catch (error) {
            console.error('Error requesting recording permissions:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const result = await locationService.getCurrentLocation();
            if (result.success) setLocation(result.location);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const loadEmergencyContacts = async () => {
        try {
            if (!userId) return;
            const response = await databaseService.fetchAPI('/users/emergency-contacts/all');
            if (response.success && response.data) {
                setEmergencyContacts(response.data.userContacts || []);
                setDefaultContacts(response.data.defaultContacts || []);
            } else {
                const response = await databaseService.getEmergencyContacts(userId);
                if (response.success) setEmergencyContacts(response.contacts || []);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            try {
                const response = await databaseService.getEmergencyContacts(userId);
                if (response.success) setEmergencyContacts(response.contacts || []);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
    };

    const loadFakeCallSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('fakeCallSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                if (parsed.callerName) setFakeCallCallerName(parsed.callerName);
            }
        } catch (error) {
            console.error('Error loading fake call settings:', error);
        }
    };

    const saveFakeCallSettings = async (callerName) => {
        try {
            const settings = await AsyncStorage.getItem('fakeCallSettings');
            const parsed = settings ? JSON.parse(settings) : {};
            parsed.callerName = callerName;
            await AsyncStorage.setItem('fakeCallSettings', JSON.stringify(parsed));
            setFakeCallCallerName(callerName);
        } catch (error) {
            console.error('Error saving fake call settings:', error);
        }
    };

    const handleSaveCallerName = async () => {
        if (tempCallerName.trim()) {
            await saveFakeCallSettings(tempCallerName.trim());
            setShowCallerNameModal(false);
            Alert.alert('Saved', `Caller name changed to "${tempCallerName.trim()}"`);
        }
    };

    const addEmergencyContact = async () => {
        if (!newContactName.trim() || !newContactPhone.trim()) {
            Alert.alert('Error', 'Please enter name and phone number');
            return;
        }
        const phoneRegex = /^[+]?[\d\s-]{10,}$/;
        if (!phoneRegex.test(newContactPhone.replace(/\s/g, ''))) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        setIsAddingContact(true);
        try {
            const response = await databaseService.addEmergencyContact(userId, {
                name: newContactName.trim(),
                phone: newContactPhone.trim(),
                priority: newContactPriority,
            });
            if (response.success) {
                Alert.alert('Success', 'Emergency contact added successfully');
                setShowAddContact(false);
                setNewContactName('');
                setNewContactPhone('');
                setNewContactPriority(1);
                loadEmergencyContacts();
            } else {
                Alert.alert('Error', response.message || 'Failed to add contact');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add contact. Please try again.');
        } finally {
            setIsAddingContact(false);
        }
    };

    const updateContactPriority = async (contact, newPriority) => {
        try {
            const response = await databaseService.updateEmergencyContact(userId, contact.id, { priority: newPriority });
            if (response.success) loadEmergencyContacts();
        } catch (error) {
            console.error('Error updating contact priority:', error);
        }
    };

    const reorderContacts = async (contact, direction) => {
        const currentContacts = [...emergencyContacts].sort((a, b) => a.priority - b.priority);
        const currentIndex = currentContacts.findIndex(c => c.id === contact.id);
        if (direction === 'up' && currentIndex > 0) {
            await updateContactPriority(contact, currentContacts[currentIndex - 1].priority);
        } else if (direction === 'down' && currentIndex < currentContacts.length - 1) {
            await updateContactPriority(contact, currentContacts[currentIndex + 1].priority);
        }
    };

    const deleteEmergencyContact = (contact) => {
        if (emergencyContacts.length <= 5) {
            Alert.alert('Cannot Delete', `You need at least 5 emergency contacts. You have ${emergencyContacts.length}. Please add more before deleting.`);
            return;
        }
        Alert.alert('Delete Contact', `Are you sure you want to delete ${contact.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await databaseService.deleteEmergencyContact(userId, contact.id);
                        if (response.success) loadEmergencyContacts();
                    } catch (error) {
                        console.error('Error deleting contact:', error);
                    }
                },
            },
        ]);
    };

    const callContact = (phoneNumber) => {
        const phoneUrl = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
        Linking.canOpenURL(phoneUrl).then((supported) => {
            if (supported) Linking.openURL(phoneUrl);
            else Alert.alert('Error', 'Phone calls not supported on this device');
        }).catch(() => Alert.alert('Error', 'Unable to make phone call'));
    };

    const sendEmergencyAlert = async (immediate = false) => {
        if (isSending) return;
        Vibration.vibrate([0, 500, 200, 500]);
        if (!immediate) {
            Alert.alert('EMERGENCY ALERT', 'This will send your location to emergency contacts and start audio recording. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'SEND HELP', style: 'destructive', onPress: () => triggerSOSAlert() },
            ]);
        } else {
            triggerSOSAlert();
        }
    };

    const triggerSOSAlert = async () => {
        setIsSending(true);
        try {
            if (autoRecordOnSOS && !isRecording && hasRecordingPermission) {
                try { await startRecording('audio'); } catch (recError) { console.error('Auto-recording failed:', recError); }
            }
            const sosResponse = await offlineService.triggerSOSOffline(userId, userName, emergencyContacts);
            const locationResult = await locationService.getCurrentLocation();
            if (locationResult.success) startSOSLiveTracking(locationResult);
            if (sosResponse.success) {
                if (sosResponse.queued) Alert.alert('Alert Queued', 'Emergency alert saved. SMS sent with your location.');
                else Alert.alert('Alert Sent', 'Emergency contacts notified. Recording in progress.');
            }
        } catch (error) {
            console.error('Error sending alert:', error);
            try {
                const isAvailable = await SMS.isAvailableAsync();
                if (isAvailable && emergencyContacts.length > 0) {
                    const phoneNumbers = emergencyContacts.map(c => c.phone);
                    const lastLocation = offlineService.getLastKnownLocation();
                    let message = `EMERGENCY! ${userName} needs help!`;
                    if (lastLocation) message += `\nLocation: https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`;
                    message += `\nTime: ${new Date().toLocaleString()}`;
                    await SMS.sendSMSAsync(phoneNumbers, message);
                    Alert.alert('SMS Sent', 'Emergency SMS sent to your contacts.');
                } else {
                    Alert.alert('Error', 'Failed to send alert. Please try again.');
                }
            } catch (smsError) {
                console.error('SMS fallback failed:', smsError);
                Alert.alert('Error', 'Failed to send alert. Please try again.');
            }
        } finally {
            setIsSending(false);
        }
    };

    const startSOSLiveTracking = (initialLocation) => {
        setIsSOSActive(true);
        setSosStartTime(Date.now());
        sosLocationHistoryRef.current = [];
        sosLocationIntervalRef.current = setInterval(async () => {
            try {
                const locationResult = await locationService.getCurrentLocation();
                if (locationResult.success) {
                    sosLocationHistoryRef.current.push({
                        latitude: locationResult.location.latitude,
                        longitude: locationResult.location.longitude,
                        timestamp: new Date().toISOString(),
                        accuracy: locationResult.location.accuracy,
                    });
                    await sendLiveLocationUpdate(locationResult.location);
                    await sosService.updateSOSLocation({ userId, location: { latitude: locationResult.location.latitude, longitude: locationResult.location.longitude }, timestamp: new Date().toISOString() });
                }
            } catch (error) {
                console.error('Error in live location tracking:', error);
            }
        }, 30000);
        locationService.startWatchingLocation((loc) => { console.log('SOS Live location:', loc.latitude, loc.longitude); }, { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 5 });
    };

    const sendLiveLocationUpdate = async (locationData) => {
        if (emergencyContacts.length === 0) return;
        try {
            const mapsUrl = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
            const message = `LIVE LOCATION - ${userName}\nCurrent: ${mapsUrl}\nAccuracy: ${locationData.accuracy ? Math.round(locationData.accuracy) + 'm' : 'Unknown'}\nTime: ${new Date().toLocaleString()}`;
            const phoneNumbers = emergencyContacts.map(c => c.phone);
            await SMS.sendSMSAsync(phoneNumbers, message);
        } catch (error) {
            console.error('Error sending live location update:', error);
        }
    };

    const stopSOSLiveTracking = () => {
        if (sosLocationIntervalRef.current) { clearInterval(sosLocationIntervalRef.current); sosLocationIntervalRef.current = null; }
        locationService.stopWatchingLocation();
        setIsSOSActive(false);
        setSosStartTime(null);
        sosLocationHistoryRef.current = [];
    };

    const cancelSOS = () => {
        Alert.alert('Cancel SOS', 'Stop emergency alert and live tracking?', [
            { text: 'No, Continue SOS', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    stopSOSLiveTracking();
                    if (isRecording) await stopRecording();
                    if (emergencyContacts.length > 0) {
                        const message = `${userName} has cancelled the emergency alert. You are now safe.`;
                        const phoneNumbers = emergencyContacts.map(c => c.phone);
                        try { await SMS.sendSMSAsync(phoneNumbers, message); } catch (error) { console.error('Error:', error); }
                    }
                    Alert.alert('SOS Cancelled', 'Emergency alert has been cancelled.');
                },
            },
        ]);
    };

    const startFakeCall = async () => {
        try {
            setIsFakeCallActive(true);
            Speech.speak(`Incoming call from ${fakeCallCallerName}`, { pitch: 1.0, rate: 1.0 });
            let timer = 300;
            setFakeCallTimer(timer);
            fakeCallInterval.current = setInterval(() => {
                timer -= 1;
                setFakeCallTimer(timer);
                if (timer <= 0) stopFakeCall();
            }, 1000);
            Alert.alert('Fake Call', `Incoming call from "${fakeCallCallerName}"`, [
                { text: 'Answer Now', onPress: () => { Speech.speak('Hello, are you coming home soon?', { pitch: 1.0, rate: 1.0 }); Alert.alert('Call Active', 'Tap "End Call" to stop'); } },
            ]);
        } catch (error) {
            console.error('Error starting fake call:', error);
            Alert.alert('Error', 'Failed to start fake call. Check audio permissions.');
        }
    };

    const stopFakeCall = async () => {
        if (fakeCallInterval.current) { clearInterval(fakeCallInterval.current); fakeCallInterval.current = null; }
        Speech.stop();
        setIsFakeCallActive(false);
        setFakeCallTimer(0);
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const toggleSiren = () => {
        if (isSirenActive) {
            Speech.stop();
            if (sirenTimeoutRef.current) { clearTimeout(sirenTimeoutRef.current); sirenTimeoutRef.current = null; }
            setIsSirenActive(false);
        } else {
            setIsSirenActive(true);
            let isHigh = true;
            const speakSiren = () => {
                if (!isSirenActive) return;
                Speech.speak('Siren', { pitch: isHigh ? 2.0 : 0.5, rate: 0.8, onDone: () => { if (isSirenActive) speakSiren(); } });
                isHigh = !isHigh;
            };
            speakSiren();
            sirenTimeoutRef.current = setTimeout(() => { if (isSirenActive) toggleSiren(); }, 30000);
        }
    };

    const shareLocation = async () => {
        await getCurrentLocation();
        if (!location) { Alert.alert('Error', 'Unable to get location. Enable location services.'); return; }
        const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        const message = `My location:\n${mapsUrl}\n\nFrom Women Safety App`;
        const isAvailable = await SMS.isAvailableAsync();
        Alert.alert('Share Location', 'Choose how to share', [
            { text: 'Share via App', onPress: async () => { try { await Share.share({ message, title: 'My Location' }); } catch (e) { console.error(e); } } },
            ...(emergencyContacts.length > 0 ? [{ text: 'Send to Contacts', onPress: async () => { const phoneNumbers = emergencyContacts.map(c => c.phone); await SMS.sendSMSAsync(phoneNumbers, message); Alert.alert('Sent', 'Location shared with contacts'); } }] : []),
            { text: 'Copy Link', onPress: async () => { await Clipboard.setStringAsync(mapsUrl); Alert.alert('Copied', 'Location link copied'); } },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const startRecording = async (type = 'audio') => {
        if (!hasRecordingPermission) { Alert.alert('Permission Required', 'Grant camera & microphone permissions.'); return; }
        try {
            setRecordingType(type);
            setRecordingDuration(0);
            setIsRecording(true);
            recordingInterval.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recordingRef.current = recording;
            Alert.alert('Recording Started', `${type === 'audio' ? 'Audio' : 'Video'} recording started for evidence.`);
        } catch (error) {
            console.error('Error starting recording:', error);
            setIsRecording(false);
            Alert.alert('Error', 'Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        try {
            if (recordingInterval.current) { clearInterval(recordingInterval.current); recordingInterval.current = null; }
            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                recordingRef.current = null;
                if (uri) {
                    try { await MediaLibrary.createAssetAsync(uri); } catch (e) { console.error(e); }
                    try {
                        await recordingService.saveRecordingLocally(uri, { userId, type: recordingType, duration: recordingDuration, timestamp: new Date().toISOString(), sosActive: isSOSActive });
                        const uploadResult = await recordingService.uploadRecording(uri, { userId, type: recordingType, duration: recordingDuration, timestamp: new Date().toISOString() });
                        Alert.alert('Recording Saved', uploadResult.success ? 'Saved and uploaded.' : 'Saved locally. Will upload when online.');
                    } catch (e) { console.error(e); Alert.alert('Recording Complete', 'Saved locally.'); }
                }
            }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            setIsRecording(false);
            setRecordingDuration(0);
        } catch (error) {
            console.error('Error stopping recording:', error);
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else {
            Alert.alert('Start Recording', 'Choose type', [
                { text: 'Audio Only', onPress: () => startRecording('audio') },
                { text: 'Video', onPress: () => startRecording('video') },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    const quickActions = [
        { id: 'sos', title: 'SOS', icon: 'warning', color: colors.error, bgColor: colors.error + '15', isEmergency: true },
        { id: 'fakecall', title: 'Fake Call', icon: 'call', color: colors.info, bgColor: colors.info + '15' },
        { id: 'siren', title: 'Siren', icon: 'volume-high', color: colors.warning, bgColor: colors.warning + '15' },
        { id: 'share', title: 'Share Location', icon: 'share', color: colors.success, bgColor: colors.success + '15' },
        { id: 'record', title: isRecording ? formatDuration(recordingDuration) : 'Record', icon: isRecording ? 'stop-circle' : 'videocam', color: isRecording ? colors.error : '#8B5CF6', bgColor: (isRecording ? colors.error : '#8B5CF6') + '15' },
        { id: 'live', title: 'Live Track', icon: 'location', color: '#6366F1', bgColor: '#6366F1' + '15' },
    ];

    const handleQuickAction = (action) => {
        switch (action.id) {
            case 'sos':
                if (isSOSActive) cancelSOS();
                else sendEmergencyAlert(true);
                break;
            case 'fakecall':
                if (isFakeCallActive) {
                    Alert.alert('Fake Call', `Time: ${formatTime(fakeCallTimer)}`, [{ text: 'Continue', style: 'cancel' }, { text: 'End', style: 'destructive', onPress: stopFakeCall }]);
                } else startFakeCall();
                break;
            case 'siren': toggleSiren(); break;
            case 'share': shareLocation(); break;
            case 'record': toggleRecording(); break;
            case 'live': navigation.navigate('LiveTracking'); break;
        }
    };

    const secondaryFeatures = [
        { id: 'liveShare', title: 'Live Safety Share', icon: 'videocam', color: '#EF4444', onPress: () => navigation.navigate('LiveShare') },
        { id: 'behavior', title: 'Behavior Analysis', icon: 'analytics', color: '#6366F1', onPress: () => navigation.navigate('BehaviorPattern') },
        { id: 'voiceKeyword', title: 'Voice Keyword', icon: 'mic', color: '#EC4899', onPress: () => navigation.navigate('VoiceKeyword') },
        { id: 'volumeButton', title: 'Volume Button SOS', icon: 'volume-high', color: '#F59E0B', onPress: () => navigation.navigate('VolumeButton') },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { backgroundColor: colors.error }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <Ionicons name="shield-checkmark" size={40} color={colors.white} />
                    <Text style={styles.headerTitle}>Women Safety</Text>
                    <Text style={styles.headerSubtitle}>Your safety is our priority</Text>
                </View>

                <View style={styles.content}>
                    {isSOSActive && (
                        <View style={[styles.sosActiveBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                            <View style={styles.sosBannerLeft}>
                                <Ionicons name="locate" size={28} color={colors.error} />
                                <View style={styles.sosBannerInfo}>
                                    <Text style={[styles.sosBannerTitle, { color: colors.error }]}>SOS ACTIVE</Text>
                                    <Text style={[styles.sosBannerSubtitle, { color: colors.text }]}>Location tracking enabled</Text>
                                </View>
                            </View>
                            <View style={styles.sosBannerRight}>
                                {batteryStatus && (
                                    <View style={[styles.statusChip, { backgroundColor: batteryStatus.level < 20 ? colors.error + '30' : colors.success + '30' }]}>
                                        <Ionicons name="battery-full" size={14} color={batteryStatus.level < 20 ? colors.error : colors.success} />
                                        <Text style={[styles.statusChipText, { color: colors.text }]}>{batteryStatus.level}%</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.error }]} onPress={cancelSOS}>
                                    <Text style={styles.cancelBtnText}>STOP</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={[styles.sosSection, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.large }]}>
                        <TouchableOpacity
                            style={[styles.sosButton, { backgroundColor: isSOSActive ? colors.warning : colors.error }]}
                            onPress={() => handleQuickAction({ id: 'sos' })}
                            disabled={isSending}
                            activeOpacity={0.8}
                        >
                            {isSending ? (
                                <ActivityIndicator size="large" color={colors.white} />
                            ) : (
                                <>
                                    <Ionicons name={isSOSActive ? 'close-circle' : 'warning'} size={56} color={colors.white} />
                                    <Text style={styles.sosButtonText}>{isSOSActive ? 'SOS ACTIVE' : 'SOS'}</Text>
                                    <Text style={styles.sosButtonSubtext}>
                                        {isSOSActive ? 'Tap to cancel' : 'Tap for Emergency'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {isSOSActive && sosStartTime && (
                            <Text style={[styles.trackingText, { color: colors.text }]}>
                                Tracking since {new Date(sosStartTime).toLocaleTimeString()}
                            </Text>
                        )}
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.quickActionCard, { backgroundColor: action.bgColor, borderRadius: borderRadius.lg, borderWidth: action.isEmergency ? 2 : 0, borderColor: action.color }]}
                                onPress={() => handleQuickAction(action)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '30' }]}>
                                    <Ionicons name={action.icon} size={24} color={action.color} />
                                </View>
                                <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>More Safety Tools</Text>
                    <View style={styles.secondaryFeaturesGrid}>
                        {secondaryFeatures.map((feature) => (
                            <TouchableOpacity
                                key={feature.id}
                                style={[styles.secondaryFeatureCard, { backgroundColor: colors.card, borderRadius: borderRadius.md, ...shadows.sm }]}
                                onPress={feature.onPress}
                            >
                                <Ionicons name={feature.icon} size={22} color={feature.color} />
                                <Text style={[styles.secondaryFeatureTitle, { color: colors.text }]}>{feature.title}</Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Emergency Contacts</Text>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: colors.primary }]}
                            onPress={() => { setTempCallerName(fakeCallCallerName); setShowCallerNameModal(true); }}
                        >
                            <Ionicons name="settings-outline" size={16} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    {emergencyContacts.length < 5 && (
                        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '15', borderRadius: borderRadius.md }]}>
                            <Ionicons name="alert-circle" size={20} color={colors.warning} />
                            <Text style={[styles.warningText, { color: colors.warning }]}>
                                Add {5 - emergencyContacts.length} more contact{5 - emergencyContacts.length > 1 ? 's' : ''} for safety
                            </Text>
                        </View>
                    )}

                    <View style={[styles.contactsCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, ...shadows.sm }]}>
                        {emergencyContacts.length > 0 ? (
                            [...emergencyContacts].sort((a, b) => (a.priority || 99) - (b.priority || 99)).map((contact, index) => (
                                <View key={contact.id} style={[styles.contactItem, index < emergencyContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                                    <View style={[styles.priorityBadge, { backgroundColor: index === 0 ? colors.error : colors.primary }]}>
                                        <Text style={styles.priorityText}>{index + 1}</Text>
                                    </View>
                                    <Ionicons name="person-circle" size={44} color={colors.primary} />
                                    <View style={styles.contactInfo}>
                                        <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                        <Text style={[styles.contactPhone, { color: colors.gray }]}>{contact.phone}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.contactAction} onPress={() => callContact(contact.phone)}>
                                        <Ionicons name="call" size={22} color={colors.success} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.contactAction} onPress={() => deleteEmergencyContact(contact)}>
                                        <Ionicons name="trash-outline" size={22} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContacts}>
                                <Ionicons name="person-add" size={40} color={colors.gray} />
                                <Text style={[styles.emptyText, { color: colors.gray }]}>No contacts added</Text>
                                <Text style={[styles.emptySubtext, { color: colors.gray }]}>Add trusted contacts for emergencies</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.addContactBtn, { borderColor: colors.primary }]}
                            onPress={() => { setNewContactName(''); setNewContactPhone(''); setShowAddContact(true); }}
                        >
                            <Ionicons name="add-circle" size={24} color={colors.primary} />
                            <Text style={[styles.addContactBtnText, { color: colors.primary }]}>Add Emergency Contact</Text>
                        </TouchableOpacity>
                    </View>

                    {defaultContacts.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Emergency Helplines</Text>
                            <View style={[styles.helplineCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, ...shadows.sm }]}>
                                {defaultContacts.map((contact, index) => (
                                    <View key={contact.id} style={[styles.contactItem, index < defaultContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                                        <Ionicons name="call" size={24} color={colors.error} />
                                        <View style={styles.contactInfo}>
                                            <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                            <Text style={[styles.contactPhone, { color: colors.error }]}>{contact.phone}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.contactAction} onPress={() => callContact(contact.phone)}>
                                            <Ionicons name="call" size={22} color={colors.success} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {location && (
                        <TouchableOpacity style={[styles.locationCard, { backgroundColor: colors.card, borderRadius: borderRadius.md, ...shadows.sm }]} onPress={getCurrentLocation}>
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={18} color={colors.success} />
                                <Text style={[styles.locationText, { color: colors.text }]}>
                                    Your Location: {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                                </Text>
                            </View>
                            <Text style={[styles.refreshText, { color: colors.primary }]}>Tap to refresh</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            <Modal visible={showAddContact} transparent animationType="slide" onRequestClose={() => setShowAddContact(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Emergency Contact</Text>
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

                        <View style={styles.prioritySection}>
                            <Text style={[styles.priorityLabel, { color: colors.text }]}>Priority (1 = first contacted)</Text>
                            <View style={styles.priorityOptions}>
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.priorityOption, { borderColor: colors.border }, newContactPriority === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                        onPress={() => setNewContactPriority(p)}
                                    >
                                        <Text style={[styles.priorityOptionText, { color: newContactPriority === p ? colors.white : colors.text }]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.gray + '30' }]} onPress={() => setShowAddContact(false)}>
                                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={addEmergencyContact}
                                disabled={isAddingContact}
                            >
                                {isAddingContact ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={[styles.modalBtnText, { color: colors.white }]}>Add Contact</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showCallerNameModal} transparent animationType="slide" onRequestClose={() => setShowCallerNameModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Fake Call Settings</Text>
                            <TouchableOpacity onPress={() => setShowCallerNameModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>Set the caller name for fake calls</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g., Mom, Dad, Boss"
                            placeholderTextColor={colors.gray}
                            value={tempCallerName}
                            onChangeText={setTempCallerName}
                            maxLength={20}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.gray + '30' }]} onPress={() => setShowCallerNameModal(false)}>
                                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.info }]} onPress={handleSaveCallerName}>
                                <Text style={[styles.modalBtnText, { color: colors.white }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backBtn: { position: 'absolute', top: 48, left: 16, zIndex: 10, padding: 8 },
    header: { alignItems: 'center', padding: 24, paddingTop: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 8 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    content: { padding: 16 },
    sosActiveBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    sosBannerLeft: { flexDirection: 'row', alignItems: 'center' },
    sosBannerInfo: { marginLeft: 10 },
    sosBannerTitle: { fontSize: 16, fontWeight: 'bold' },
    sosBannerSubtitle: { fontSize: 12 },
    sosBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    statusChipText: { fontSize: 12, fontWeight: '600' },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    sosSection: { alignItems: 'center', padding: 24, marginBottom: 16 },
    sosButton: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    sosButtonText: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
    sosButtonSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    trackingText: { fontSize: 12, marginTop: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 8 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    quickActionCard: { width: '30%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 8 },
    quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    quickActionTitle: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    secondaryFeaturesGrid: { gap: 8, marginBottom: 16 },
    secondaryFeatureCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    secondaryFeatureTitle: { flex: 1, fontSize: 15, fontWeight: '500' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    warningBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, marginBottom: 12 },
    warningText: { flex: 1, fontSize: 13, fontWeight: '500' },
    contactsCard: { padding: 16 },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
    priorityBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 2 },
    priorityText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 15, fontWeight: '500' },
    contactPhone: { fontSize: 13, marginTop: 2 },
    contactAction: { padding: 8 },
    emptyContacts: { alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 15, fontWeight: '500', marginTop: 10 },
    emptySubtext: { fontSize: 12, marginTop: 4 },
    addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, gap: 8 },
    addContactBtnText: { fontSize: 14, fontWeight: '600' },
    helplineCard: { padding: 16 },
    locationCard: { padding: 14, marginTop: 8 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    locationText: { fontSize: 13, flex: 1 },
    refreshText: { fontSize: 12, marginTop: 6, textAlign: 'right' },
    bottomSpacer: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 13, marginBottom: 16 },
    input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16 },
    prioritySection: { marginBottom: 16 },
    priorityLabel: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
    priorityOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    priorityOption: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    priorityOptionText: { fontSize: 16, fontWeight: '600' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    modalBtnText: { fontSize: 16, fontWeight: '600' },
});

export default WomenSafetyScreen;
