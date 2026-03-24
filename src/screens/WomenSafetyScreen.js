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
    const [defaultContacts, setDefaultContacts] = useState([]);  // Default emergency numbers

    // SOS Active State - for live location tracking
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [sosStartTime, setSosStartTime] = useState(null);
    const sosLocationIntervalRef = useRef(null);
    const sosLocationHistoryRef = useRef([]);

    // Fake Call Caller Name - configurable for safety
    const [fakeCallCallerName, setFakeCallCallerName] = useState('Mom');

    // Fake Call State
    const [isFakeCallActive, setIsFakeCallActive] = useState(false);
    const [fakeCallTimer, setFakeCallTimer] = useState(0);
    const fakeCallInterval = useRef(null);

    // Siren State
    const [isSirenActive, setIsSirenActive] = useState(false);
    const sirenTimeoutRef = useRef(null);

    // Add Contact Modal
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactPriority, setNewContactPriority] = useState(1); // 1 = highest priority
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [editingContact, setEditingContact] = useState(null); // For editing contacts
    const [showCallerNameModal, setShowCallerNameModal] = useState(false);
    const [tempCallerName, setTempCallerName] = useState('');

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingType, setRecordingType] = useState('audio'); // 'audio' or 'video'
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [hasRecordingPermission, setHasRecordingPermission] = useState(false);
    const [autoRecordOnSOS, setAutoRecordOnSOS] = useState(true);
    const cameraRef = useRef(null);
    const recordingInterval = useRef(null);
    const recordingRef = useRef(null);

    // Battery & Signal Monitoring State
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

        // Initialize battery and signal monitoring
        initializeDeviceMonitoring();

        return () => {
            // Cleanup on unmount
            if (fakeCallInterval.current) {
                clearInterval(fakeCallInterval.current);
            }
            Speech.stop();
            if (sirenTimeoutRef.current) {
                clearTimeout(sirenTimeoutRef.current);
            }
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }
            stopRecording();
            // Stop SOS live tracking on unmount
            stopSOSLiveTracking();
            // Stop device monitoring
            stopDeviceMonitoring();
        };
    }, []);

    // Initialize battery and signal monitoring
    const initializeDeviceMonitoring = async () => {
        try {
            // Initialize battery service
            await batteryService.initialize();
            await batteryService.loadAlertState();

            // Initialize signal service
            await signalService.initialize();

            // Start periodic battery and signal checks
            startDeviceMonitoring();

            console.log('Device monitoring initialized');
        } catch (error) {
            console.error('Error initializing device monitoring:', error);
        }
    };

    // Start periodic device monitoring
    const startDeviceMonitoring = () => {
        // Check battery every minute
        batteryCheckIntervalRef.current = setInterval(async () => {
            const status = await batteryService.getBatteryStatus();
            setBatteryStatus(status);

            // Check and send battery alerts during SOS
            if (isSOSActive && emergencyContacts.length > 0) {
                await batteryService.checkAndAlert(emergencyContacts, userName);
            }

            // Adjust tracking interval based on battery
            if (isSOSActive) {
                adjustTrackingForBattery(status);
            }
        }, 60000); // 1 minute

        // Check signal every 30 seconds
        signalCheckIntervalRef.current = setInterval(async () => {
            const status = await signalService.getSignalStatus();
            setSignalStatus(status);

            // Check for signal warnings
            const warning = await signalService.getWarningMessage();
            setSignalWarning(warning);

            // Adjust tracking interval based on signal
            if (isSOSActive) {
                await adjustTrackingForSignal(status);
            }
        }, 30000); // 30 seconds
    };

    // Stop device monitoring
    const stopDeviceMonitoring = () => {
        if (batteryCheckIntervalRef.current) {
            clearInterval(batteryCheckIntervalRef.current);
            batteryCheckIntervalRef.current = null;
        }
        if (signalCheckIntervalRef.current) {
            clearInterval(signalCheckIntervalRef.current);
            signalCheckIntervalRef.current = null;
        }
        batteryService.stopMonitoring();
        signalService.stopMonitoring();
    };

    // Adjust tracking interval based on battery level
    const adjustTrackingForBattery = async (batteryStatus) => {
        const optimalInterval = batteryService.getOptimalTrackingInterval();
        const shouldContinue = batteryService.shouldContinueTracking();

        if (!shouldContinue && sosLocationIntervalRef.current) {
            // Battery too low, pause tracking
            console.log('Battery too low, pausing tracking');
            Alert.alert(
                'Low Battery Warning',
                'Your phone battery is critically low. Live tracking will be paused to preserve battery for emergency calls.'
            );
        }
    };

    // Adjust tracking based on signal strength
    const adjustTrackingForSignal = async (signalStatus) => {
        const pauseCheck = await signalService.shouldPauseTracking();

        if (pauseCheck.shouldPause && sosLocationIntervalRef.current) {
            console.log('Signal too weak, adjusting tracking interval');
            setSignalWarning(pauseCheck.reason);
        } else {
            setSignalWarning(null);
        }
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            getCurrentLocation();
        }
    };

    const requestRecordingPermissions = async () => {
        try {
            const cameraPermission = await Camera.requestCameraPermissionsAsync();
            const audioPermission = await Audio.requestPermissionsAsync();
            const mediaPermission = await MediaLibrary.requestPermissionsAsync();

            if (cameraPermission.status === 'granted' &&
                audioPermission.status === 'granted' &&
                mediaPermission.status === 'granted') {
                setHasRecordingPermission(true);
            }
        } catch (error) {
            console.error('Error requesting recording permissions:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const result = await locationService.getCurrentLocation();
            if (result.success) {
                setLocation(result.location);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const loadEmergencyContacts = async () => {
        try {
            if (!userId) return;

            // Load all emergency contacts (default + user-specific)
            const response = await databaseService.fetchAPI('/users/emergency-contacts/all');

            if (response.success && response.data) {
                // Set user contacts
                setEmergencyContacts(response.data.userContacts || []);
                // Set default contacts
                setDefaultContacts(response.data.defaultContacts || []);
            } else {
                // Fallback to legacy API
                const response = await databaseService.getEmergencyContacts(userId);
                if (response.success) {
                    setEmergencyContacts(response.contacts || []);
                }
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            // Try fallback to legacy API
            try {
                const response = await databaseService.getEmergencyContacts(userId);
                if (response.success) {
                    setEmergencyContacts(response.contacts || []);
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
    };

    const loadFakeCallSettings = async () => {
        try {
            // Load user's custom fake call caller name from storage or settings
            if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
                const settings = await AsyncStorage.getItem('fakeCallSettings');
                if (settings) {
                    const parsed = JSON.parse(settings);
                    if (parsed.callerName) {
                        setFakeCallCallerName(parsed.callerName);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading fake call settings:', error);
        }
    };

    const saveFakeCallSettings = async (callerName) => {
        try {
            if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
                const settings = await AsyncStorage.getItem('fakeCallSettings');
                const parsed = settings ? JSON.parse(settings) : {};
                parsed.callerName = callerName;
                await AsyncStorage.setItem('fakeCallSettings', JSON.stringify(parsed));
                setFakeCallCallerName(callerName);
            }
        } catch (error) {
            console.error('Error saving fake call settings:', error);
        }
    };

    const handleEditCallerName = () => {
        setTempCallerName(fakeCallCallerName);
        setShowCallerNameModal(true);
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

        // Validate phone number
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

    // Update contact priority
    const updateContactPriority = async (contact, newPriority) => {
        try {
            const response = await databaseService.updateEmergencyContact(userId, contact.id, {
                priority: newPriority,
            });
            if (response.success) {
                loadEmergencyContacts();
            }
        } catch (error) {
            console.error('Error updating contact priority:', error);
        }
    };

    // Reorder contacts (move up/down)
    const reorderContacts = async (contact, direction) => {
        const currentContacts = [...emergencyContacts].sort((a, b) => a.priority - b.priority);
        const currentIndex = currentContacts.findIndex(c => c.id === contact.id);

        if (direction === 'up' && currentIndex > 0) {
            const newPriority = currentContacts[currentIndex - 1].priority;
            await updateContactPriority(contact, newPriority);
        } else if (direction === 'down' && currentIndex < currentContacts.length - 1) {
            const newPriority = currentContacts[currentIndex + 1].priority;
            await updateContactPriority(contact, newPriority);
        }
    };

    const deleteEmergencyContact = (contact) => {
        // Check minimum contacts requirement
        if (emergencyContacts.length <= 5) {
            Alert.alert(
                'Cannot Delete Contact',
                `You need at least 5 emergency contacts for safety. You currently have ${emergencyContacts.length} contact(s). Please add more contacts before deleting.`,
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Delete Contact',
            `Are you sure you want to delete ${contact.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await databaseService.deleteEmergencyContact(userId, contact.id);
                            if (response.success) {
                                loadEmergencyContacts();
                            }
                        } catch (error) {
                            console.error('Error deleting contact:', error);
                        }
                    },
                },
            ]
        );
    };

    const callContact = (phoneNumber) => {
        const phoneUrl = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
        Linking.canOpenURL(phoneUrl).then((supported) => {
            if (supported) {
                Linking.openURL(phoneUrl);
            } else {
                Alert.alert('Error', 'Phone calls not supported on this device');
            }
        }).catch((error) => {
            console.error('Error opening phone URL:', error);
            Alert.alert('Error', 'Unable to make phone call');
        });
    };

    const sendEmergencyAlert = async (immediate = false) => {
        if (isSending) return;

        Vibration.vibrate([0, 500, 200, 500]);

        // If not immediate mode, show confirmation dialog
        if (!immediate) {
            Alert.alert(
                'EMERGENCY ALERT',
                'This will send your location to emergency contacts and start audio recording for evidence. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'SEND HELP',
                        style: 'destructive',
                        onPress: () => triggerSOSAlert(),
                    },
                ]
            );
        } else {
            // Immediate one-tap SOS activation
            triggerSOSAlert();
        }
    };

    // Internal function to trigger the actual SOS alert
    const triggerSOSAlert = async () => {
        setIsSending(true);
        try {
            // Auto-start recording for evidence collection
            if (autoRecordOnSOS && !isRecording && hasRecordingPermission) {
                try {
                    await startRecording('audio');
                } catch (recError) {
                    console.error('Auto-recording failed:', recError);
                }
            }

            // Use offline service for SOS - handles both online and offline scenarios
            // This will send SMS even when offline using last known location
            const sosResponse = await offlineService.triggerSOSOffline(
                userId,
                userName,
                emergencyContacts
            );

            // Get location for live tracking
            const locationResult = await locationService.getCurrentLocation();

            // Start live location tracking if location available
            if (locationResult.success) {
                startSOSLiveTracking(locationResult);
            }

            // Show appropriate message based on result
            if (sosResponse.success) {
                if (sosResponse.queued) {
                    Alert.alert('Alert Queued', 'Emergency alert has been saved and will be sent when online. SMS has been sent to your emergency contacts with your location.');
                } else {
                    Alert.alert('Alert Sent', 'Emergency contacts have been notified. Recording is in progress for evidence. Your live location is being tracked.');
                }
            }
        } catch (error) {
            console.error('Error sending alert:', error);
            // Fallback: try to send SMS directly even if offline service fails
            try {
                const isAvailable = await SMS.isAvailableAsync();
                if (isAvailable && emergencyContacts.length > 0) {
                    const phoneNumbers = emergencyContacts.map(c => c.phone);
                    const lastLocation = offlineService.getLastKnownLocation();
                    let message = `EMERGENCY! ${userName} needs help!`;
                    if (lastLocation) {
                        message += `\n\nLast Known Location: https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`;
                    }
                    message += `\n\nTime: ${new Date().toLocaleString()}`;
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

    // ==================== LIVE LOCATION TRACKING FOR SOS ====================
    const startSOSLiveTracking = (initialLocation) => {
        setIsSOSActive(true);
        setSosStartTime(Date.now());
        sosLocationHistoryRef.current = [];

        // Track location every 30 seconds and send to contacts
        sosLocationIntervalRef.current = setInterval(async () => {
            try {
                const locationResult = await locationService.getCurrentLocation();

                if (locationResult.success) {
                    // Store location in history
                    sosLocationHistoryRef.current.push({
                        latitude: locationResult.location.latitude,
                        longitude: locationResult.location.longitude,
                        timestamp: new Date().toISOString(),
                        accuracy: locationResult.location.accuracy,
                    });

                    // Send live location update to emergency contacts
                    await sendLiveLocationUpdate(locationResult.location);

                    // Also update via SOS service
                    await sosService.updateSOSLocation({
                        userId,
                        location: {
                            latitude: locationResult.location.latitude,
                            longitude: locationResult.location.longitude,
                        },
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error('Error in live location tracking:', error);
            }
        }, 30000); // Update every 30 seconds

        // Also start continuous watching for more accurate tracking
        locationService.startWatchingLocation(async (loc) => {
            // This is additional high-frequency tracking
            console.log('SOS Live location update:', loc.latitude, loc.longitude);
        }, {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // 10 seconds
            distanceInterval: 5, // 5 meters
        });
    };

    const sendLiveLocationUpdate = async (locationData) => {
        if (emergencyContacts.length === 0) return;

        try {
            const mapsUrl = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
            const message = `🚨 LIVE LOCATION UPDATE - ${userName}\n\nCurrent Location: ${mapsUrl}\n\nAccuracy: ${locationData.accuracy ? Math.round(locationData.accuracy) + 'm' : 'Unknown'}\n\nTime: ${new Date().toLocaleString()}\n\nThis is a live location update during an active emergency alert.`;

            const phoneNumbers = emergencyContacts.map(c => c.phone);
            const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
            console.log('Live location update sent:', result);
        } catch (error) {
            console.error('Error sending live location update:', error);
        }
    };

    const stopSOSLiveTracking = () => {
        if (sosLocationIntervalRef.current) {
            clearInterval(sosLocationIntervalRef.current);
            sosLocationIntervalRef.current = null;
        }

        // Stop watching location
        locationService.stopWatchingLocation();

        setIsSOSActive(false);
        setSosStartTime(null);
        sosLocationHistoryRef.current = [];
    };

    const cancelSOS = () => {
        Alert.alert(
            'Cancel SOS',
            'Are you sure you want to cancel the emergency alert and stop live tracking?',
            [
                { text: 'No, Continue SOS', style: 'cancel' },
                {
                    text: 'Yes, Cancel SOS',
                    style: 'destructive',
                    onPress: async () => {
                        stopSOSLiveTracking();

                        // Stop recording if active
                        if (isRecording) {
                            await stopRecording();
                        }

                        // Notify contacts that SOS is cancelled
                        if (emergencyContacts.length > 0) {
                            const message = `✅ ${userName} has cancelled the emergency alert. You are now safe.`;
                            const phoneNumbers = emergencyContacts.map(c => c.phone);
                            try {
                                await SMS.sendSMSAsync(phoneNumbers, message);
                            } catch (error) {
                                console.error('Error sending cancellation SMS:', error);
                            }
                        }

                        Alert.alert('SOS Cancelled', 'Emergency alert has been cancelled and contacts have been notified.');
                    },
                },
            ]
        );
    };

    // ==================== FAKE CALL FEATURE ====================
    const startFakeCall = async () => {
        try {
            // Use Speech synthesis for the fake call
            setIsFakeCallActive(true);

            // Speak the caller name
            Speech.speak(`Incoming call from ${fakeCallCallerName}`, {
                pitch: 1.0,
                rate: 1.0,
                onStart: () => {
                    console.log('Fake call started');
                },
                onDone: () => {
                    console.log('Fake call speech done');
                },
                onError: (error) => {
                    console.error('Speech error:', error);
                },
            });

            // Set timer (default 5 minutes)
            let timer = 300; // 5 minutes in seconds
            setFakeCallTimer(timer);

            fakeCallInterval.current = setInterval(() => {
                timer -= 1;
                setFakeCallTimer(timer);

                if (timer <= 0) {
                    stopFakeCall();
                }
            }, 1000);

            Alert.alert(
                'Fake Call Started',
                `Incoming call from "${fakeCallCallerName}". Tap to answer or wait for it to end.`,
                [
                    {
                        text: 'Answer Now',
                        onPress: () => {
                            Speech.speak('Hello, are you coming home soon?', {
                                pitch: 1.0,
                                rate: 1.0,
                            });
                            Alert.alert('Call Active', 'Tap "End Call" to stop the fake call');
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error starting fake call:', error);
            Alert.alert('Error', 'Failed to start fake call. Please check audio permissions.');
        }
    };

    const stopFakeCall = async () => {
        try {
            if (fakeCallInterval.current) {
                clearInterval(fakeCallInterval.current);
                fakeCallInterval.current = null;
            }

            // Stop speech
            Speech.stop();

            setIsFakeCallActive(false);
            setFakeCallTimer(0);
        } catch (error) {
            console.error('Error stopping fake call:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ==================== SIREN FEATURE ====================
    const toggleSiren = () => {
        if (isSirenActive) {
            // Stop siren
            try {
                Speech.stop();
                if (sirenTimeoutRef.current) {
                    clearTimeout(sirenTimeoutRef.current);
                    sirenTimeoutRef.current = null;
                }
                setIsSirenActive(false);
            } catch (error) {
                console.error('Error stopping siren:', error);
            }
        } else {
            // Start siren using speech synthesis with alternating pitch
            setIsSirenActive(true);

            let isHigh = true;

            const speakSiren = () => {
                if (!isSirenActive) return;

                const pitch = isHigh ? 2.0 : 0.5;
                Speech.speak('Siren', {
                    pitch: pitch,
                    rate: 0.8,
                    onDone: () => {
                        if (isSirenActive) {
                            speakSiren();
                        }
                    },
                });
                isHigh = !isHigh;
            };

            speakSiren();

            // Auto-stop after 30 seconds as safety measure
            sirenTimeoutRef.current = setTimeout(() => {
                if (isSirenActive) {
                    toggleSiren();
                }
            }, 30000);
        }
    };

    // ==================== SHARE LOCATION FEATURE ====================
    const shareLocation = async () => {
        try {
            await getCurrentLocation();

            if (!location) {
                Alert.alert('Error', 'Unable to get your location. Please enable location services.');
                return;
            }

            const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
            const message = `My current location:\n${mapsUrl}\n\nShared from Women Safety App`;

            const isAvailable = await SMS.isAvailableAsync();

            if (isAvailable && emergencyContacts.length > 0) {
                Alert.alert(
                    'Share Location',
                    'Choose how to share your location',
                    [
                        {
                            text: 'Share via App',
                            onPress: async () => {
                                try {
                                    await Share.share({
                                        message: message,
                                        title: 'My Location',
                                    });
                                } catch (error) {
                                    console.error('Error sharing:', error);
                                }
                            },
                        },
                        {
                            text: 'Send to Emergency Contacts',
                            onPress: async () => {
                                const phoneNumbers = emergencyContacts.map(c => c.phone);
                                const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
                                Alert.alert('Shared', 'Location shared with emergency contacts');
                            },
                        },
                        {
                            text: 'Copy to Clipboard',
                            onPress: async () => {
                                await Clipboard.setStringAsync(mapsUrl);
                                Alert.alert('Copied', 'Location link copied to clipboard');
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Share Location',
                    'Choose how to share your location',
                    [
                        {
                            text: 'Share via App',
                            onPress: async () => {
                                try {
                                    await Share.share({
                                        message: message,
                                        title: 'My Location',
                                    });
                                } catch (error) {
                                    console.error('Error sharing:', error);
                                }
                            },
                        },
                        {
                            text: 'Copy to Clipboard',
                            onPress: async () => {
                                await Clipboard.setStringAsync(mapsUrl);
                                Alert.alert('Copied', 'Location link copied to clipboard');
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error sharing location:', error);
            Alert.alert('Error', 'Failed to share location');
        }
    };

    // ==================== RECORDING FEATURE ====================
    const startRecording = async (type = 'audio') => {
        if (!hasRecordingPermission) {
            Alert.alert('Permission Required', 'Please grant camera and microphone permissions to use recording.');
            return;
        }

        try {
            setRecordingType(type);
            setRecordingDuration(0);
            setIsRecording(true);

            // Start duration timer
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            if (type === 'audio') {
                // Audio recording using expo-av
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                recordingRef.current = recording;
            } else {
                // Video recording - this would require Camera component
                // For now, we'll use audio recording as fallback
                Alert.alert('Video Recording', 'Video recording requires camera. Using audio recording instead.');

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                recordingRef.current = recording;
            }

            Alert.alert(
                'Recording Started',
                `${type === 'audio' ? 'Audio' : 'Video'} recording for evidence collection has started.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error starting recording:', error);
            setIsRecording(false);
            Alert.alert('Error', 'Failed to start recording. Please check permissions.');
        }
    };

    const stopRecording = async () => {
        try {
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
                recordingInterval.current = null;
            }

            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                recordingRef.current = null;

                if (uri) {
                    // Save to local storage
                    try {
                        const asset = await MediaLibrary.createAssetAsync(uri);
                        console.log('Recording saved to media library:', asset.uri);
                    } catch (mediaError) {
                        console.error('Error saving to media library:', mediaError);
                    }

                    // Save locally and try to upload to cloud
                    try {
                        await recordingService.saveRecordingLocally(uri, {
                            userId,
                            type: recordingType,
                            duration: recordingDuration,
                            timestamp: new Date().toISOString(),
                            sosActive: isSOSActive,
                        });

                        // Try to upload to cloud
                        const uploadResult = await recordingService.uploadRecording(uri, {
                            userId,
                            type: recordingType,
                            duration: recordingDuration,
                            timestamp: new Date().toISOString(),
                        });

                        if (uploadResult.success) {
                            Alert.alert(
                                'Recording Saved',
                                'Recording saved locally and uploaded to cloud for evidence collection.'
                            );
                        } else if (uploadResult.queued) {
                            Alert.alert(
                                'Recording Saved',
                                'Recording saved locally. Will be uploaded to cloud when internet is available.'
                            );
                        }
                    } catch (saveError) {
                        console.error('Error saving recording:', saveError);
                        Alert.alert('Recording Complete', 'Recording saved locally.');
                    }
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setIsRecording(false);
            setRecordingDuration(0);
        } catch (error) {
            console.error('Error stopping recording:', error);
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            Alert.alert(
                'Start Recording',
                'Choose recording type for evidence collection',
                [
                    {
                        text: 'Audio Only',
                        onPress: () => startRecording('audio'),
                    },
                    {
                        text: 'Video (with Audio)',
                        onPress: () => startRecording('video'),
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const safetyFeatures = [
        {
            id: 'fakecall',
            title: 'Fake Call',
            icon: 'call',
            color: colors.info,
            isActive: isFakeCallActive,
            onPress: () => {
                if (isFakeCallActive) {
                    Alert.alert(
                        'Fake Call Active',
                        `Time remaining: ${formatTime(fakeCallTimer)}`,
                        [
                            { text: 'Continue', style: 'cancel' },
                            { text: 'End Call', style: 'destructive', onPress: stopFakeCall },
                        ]
                    );
                } else {
                    startFakeCall();
                }
            }
        },
        {
            id: 'siren',
            title: 'Siren',
            icon: 'volume-high',
            color: colors.warning,
            isActive: isSirenActive,
            onPress: toggleSiren
        },
        {
            id: 'share',
            title: 'Share Location',
            icon: 'share',
            color: colors.success,
            onPress: shareLocation
        },
        {
            id: 'liveShare',
            title: 'Live Safety Share',
            icon: 'videocam',
            color: '#EF4444',
            onPress: () => navigation.navigate('LiveShare')
        },
        {
            id: 'record',
            title: isRecording ? `Recording ${formatDuration(recordingDuration)}` : 'Record Evidence',
            icon: isRecording ? 'stop-circle' : 'videocam',
            color: isRecording ? colors.error : '#8B5CF6',
            isActive: isRecording,
            onPress: toggleRecording
        },
        {
            id: 'behavior',
            title: 'Behavior Analysis',
            icon: 'analytics',
            color: '#6366F1',
            onPress: () => navigation.navigate('BehaviorPattern')
        },
        {
            id: 'voiceKeyword',
            title: 'Voice Keyword',
            icon: 'mic',
            color: '#EC4899',
            onPress: () => navigation.navigate('VoiceKeyword')
        },
        {
            id: 'volumeButton',
            title: 'Volume Button',
            icon: 'volume-high',
            color: '#F59E0B',
            onPress: () => navigation.navigate('VolumeButton')
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.error }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="shield" size={48} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Women Safety</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Emergency features to keep you safe
                </Text>
            </View>

            <View style={styles.content}>
                {/* SOS Active Banner */}
                {isSOSActive && (
                    <View style={[styles.sosActiveBanner, { backgroundColor: colors.error }]}>
                        <Ionicons name="locate" size={24} color={colors.white} />
                        <View style={styles.sosActiveInfo}>
                            <Text style={[styles.sosActiveTitle, { color: colors.white }]}>🚨 SOS ACTIVE</Text>
                            <Text style={[styles.sosActiveSubtitle, { color: colors.white }]}>
                                Live location tracking enabled • Sending updates every 30s
                            </Text>
                            {/* Battery and Signal Status */}
                            {(batteryStatus || signalStatus) && (
                                <View style={styles.deviceStatusRow}>
                                    {batteryStatus && (
                                        <View style={[styles.deviceStatusBadge, { backgroundColor: batteryStatus.color + '40' }]}>
                                            <Ionicons
                                                name={batteryStatus.isCharging ? "battery-charging" : "battery-full"}
                                                size={14}
                                                color={colors.white}
                                            />
                                            <Text style={[styles.deviceStatusText, { color: colors.white }]}>
                                                {batteryStatus.level}%
                                            </Text>
                                        </View>
                                    )}
                                    {signalStatus && (
                                        <View style={[styles.deviceStatusBadge, { backgroundColor: signalStatus.network.signalColor + '40' }]}>
                                            <Ionicons
                                                name={signalStatus.network.isConnected ? "signal" : "signal-off"}
                                                size={14}
                                                color={colors.white}
                                            />
                                            <Text style={[styles.deviceStatusText, { color: colors.white }]}>
                                                {signalStatus.network.signalLabel}
                                            </Text>
                                        </View>
                                    )}
                                    {signalStatus && (
                                        <View style={[styles.deviceStatusBadge, { backgroundColor: signalStatus.gps.accuracyColor + '40' }]}>
                                            <Ionicons
                                                name="location"
                                                size={14}
                                                color={colors.white}
                                            />
                                            <Text style={[styles.deviceStatusText, { color: colors.white }]}>
                                                {signalStatus.gps.accuracyLabel}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            {/* Signal Warning */}
                            {signalWarning && (
                                <View style={[styles.signalWarningBanner, { backgroundColor: colors.warning + '30' }]}>
                                    <Ionicons name="warning" size={14} color={colors.white} />
                                    <Text style={[styles.signalWarningText, { color: colors.white }]}>
                                        {signalWarning}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[styles.cancelSOSButton, { backgroundColor: colors.white }]}
                            onPress={cancelSOS}
                        >
                            <Text style={[styles.cancelSOSButtonText, { color: colors.error }]}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.sosButton,
                        { backgroundColor: isSOSActive ? colors.warning : colors.error, ...shadows.large },
                        isSOSActive && styles.sosButtonActive
                    ]}
                    onPress={() => {
                        if (isSOSActive) {
                            cancelSOS();
                        } else {
                            sendEmergencyAlert(true); // Immediate one-tap activation
                        }
                    }}
                    disabled={isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="large" color={colors.white} />
                    ) : (
                        <>
                            <Ionicons name={isSOSActive ? 'close-circle' : 'warning'} size={48} color={colors.white} />
                            <Text style={[styles.sosText, { color: colors.white }]}>
                                {isSOSActive ? 'SOS ACTIVE - TAP TO CANCEL' : 'SOS'}
                            </Text>
                            <Text style={[styles.sosSubtext, { color: colors.white + 'CC' }]}>
                                {isSOSActive ? 'Live tracking your location' : 'Press for Emergency (One-Tap)'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Live Tracking Button */}
                <TouchableOpacity
                    style={[
                        styles.liveTrackingButton,
                        { backgroundColor: colors.primary, ...shadows.medium },
                    ]}
                    onPress={() => navigation.navigate('LiveTracking')}
                >
                    <Ionicons name="location" size={24} color="#fff" />
                    <Text style={[styles.liveTrackingButtonText, { color: '#fff' }]}>
                        Live Tracking
                    </Text>
                </TouchableOpacity>

                {/* Fake Call Caller Name Settings */}
                <View style={[styles.contactsCard, { backgroundColor: colors.card, borderRadius, ...shadows.small, marginBottom: 16 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="call" size={20} color={colors.info} />
                            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>Fake Call Caller Name</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.settingRow, { borderColor: colors.border }]}
                        onPress={handleEditCallerName}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Current Caller</Text>
                            <Text style={[styles.settingValue, { color: colors.gray }]}>{fakeCallCallerName}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                    </TouchableOpacity>
                    <Text style={[styles.settingHint, { color: colors.gray }]}>
                        Customize the name that appears when you trigger a fake call
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Features</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuresScrollContent}
                >
                    <View style={styles.featuresGrid}>
                        {safetyFeatures.map((feature) => (
                            <TouchableOpacity
                                key={feature.id}
                                style={[
                                    styles.featureCard,
                                    {
                                        backgroundColor: colors.card,
                                        borderRadius,
                                        ...shadows.small,
                                        borderWidth: feature.isActive ? 2 : 0,
                                        borderColor: feature.isActive ? colors.error : 'transparent',
                                    }
                                ]}
                                onPress={feature.onPress}
                            >
                                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                                    <Ionicons
                                        name={feature.icon}
                                        size={28}
                                        color={feature.isActive ? colors.error : feature.color}
                                    />
                                </View>
                                <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                                {feature.isActive && (
                                    <View style={[styles.activeIndicator, { backgroundColor: colors.error }]}>
                                        <Text style={styles.activeIndicatorText}>ACTIVE</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.contactsHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAddContact(true)}
                    >
                        <Ionicons name="add" size={20} color={colors.white} />
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.contactsCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    {/* Warning for minimum contacts */}
                    {emergencyContacts.length < 5 && (
                        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="warning" size={20} color={colors.warning} />
                            <Text style={[styles.warningText, { color: colors.warning }]}>
                                Add at least {5 - emergencyContacts.length} more contact(s) for complete safety coverage
                            </Text>
                        </View>
                    )}

                    {emergencyContacts.length > 0 ? (
                        // Sort contacts by priority
                        [...emergencyContacts].sort((a, b) => (a.priority || 99) - (b.priority || 99)).map((contact, index) => (
                            <View
                                key={contact.id}
                                style={[
                                    styles.contactItem,
                                    index < emergencyContacts.length - 1 &&
                                    { borderBottomWidth: 1, borderColor: colors.border }
                                ]}
                            >
                                {/* Priority Badge */}
                                <View style={[styles.priorityBadge, { backgroundColor: index === 0 ? colors.error : colors.primary }]}>
                                    <Text style={styles.priorityBadgeText}>
                                        {index + 1}
                                    </Text>
                                </View>

                                <Ionicons name="person-circle" size={40} color={colors.primary} />
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactPhone, { color: colors.gray }]}>{contact.phone}</Text>
                                    {contact.priority && (
                                        <Text style={[styles.priorityLabel, { color: colors.gray }]}>
                                            Priority: {contact.priority}
                                        </Text>
                                    )}
                                </View>

                                {/* Reorder buttons */}
                                <View style={styles.reorderButtons}>
                                    <TouchableOpacity
                                        onPress={() => reorderContacts(contact, 'up')}
                                        style={styles.reorderButton}
                                        disabled={index === 0}
                                    >
                                        <Ionicons
                                            name="chevron-up"
                                            size={20}
                                            color={index === 0 ? colors.gray + '40' : colors.primary}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => reorderContacts(contact, 'down')}
                                        style={styles.reorderButton}
                                        disabled={index === emergencyContacts.length - 1}
                                    >
                                        <Ionicons
                                            name="chevron-down"
                                            size={20}
                                            color={index === emergencyContacts.length - 1 ? colors.gray + '40' : colors.primary}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => callContact(contact.phone)}
                                    style={styles.contactAction}
                                >
                                    <Ionicons name="call" size={24} color={colors.success} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteEmergencyContact(contact)}
                                    style={styles.contactAction}
                                >
                                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noContactsContainer}>
                            <Ionicons name="person-add" size={48} color={colors.gray + '60'} />
                            <Text style={[styles.noContacts, { color: colors.gray }]}>No emergency contacts added</Text>
                            <Text style={[styles.noContactsSubtext, { color: colors.gray + '80' }]}>
                                Add trusted contacts who will be notified in emergencies
                            </Text>
                        </View>
                    )}
                </View>

                {/* Default Emergency Contacts Section */}
                {defaultContacts.length > 0 && (
                    <View style={[styles.contactsCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={colors.error} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Helpline Numbers</Text>
                        </View>
                        {defaultContacts.map((contact, index) => (
                            <View
                                key={contact.id}
                                style={[
                                    styles.contactItem,
                                    index < defaultContacts.length - 1 &&
                                    { borderBottomWidth: 1, borderColor: colors.border }
                                ]}
                            >
                                <Ionicons name="warning" size={24} color={colors.error} />
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactPhone, { color: colors.gray }]}>{contact.phone}</Text>
                                    {contact.description && (
                                        <Text style={[styles.contactDescription, { color: colors.gray + '80' }]}>
                                            {contact.description}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={() => callContact(contact.phone)}
                                    style={styles.contactAction}
                                >
                                    <Ionicons name="call" size={24} color={colors.success} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Location Status */}
                {location && (
                    <View style={[styles.locationCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={20} color={colors.success} />
                            <Text style={[styles.locationText, { color: colors.text }]}>
                                Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={getCurrentLocation}>
                            <Text style={[styles.refreshLocation, { color: colors.primary }]}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Add Contact Modal */}
            <Modal
                visible={showAddContact}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddContact(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Emergency Contact</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Name"
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

                        {/* Priority Selection */}
                        <View style={styles.prioritySection}>
                            <Text style={[styles.priorityLabel, { color: colors.text }]}>Priority (1 = highest):</Text>
                            <View style={styles.priorityOptions}>
                                {[1, 2, 3, 4, 5].map((priority) => (
                                    <TouchableOpacity
                                        key={priority}
                                        style={[
                                            styles.priorityOption,
                                            { borderColor: colors.border },
                                            newContactPriority === priority && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => setNewContactPriority(priority)}
                                    >
                                        <Text style={[
                                            styles.priorityOptionText,
                                            { color: newContactPriority === priority ? colors.white : colors.text }
                                        ]}>
                                            {priority}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.gray + '30' }]}
                                onPress={() => {
                                    setShowAddContact(false);
                                    setNewContactName('');
                                    setNewContactPhone('');
                                    setNewContactPriority(1);
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={addEmergencyContact}
                                disabled={isAddingContact}
                            >
                                {isAddingContact ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={[styles.modalButtonText, { color: colors.white }]}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Caller Name Modal */}
            <Modal
                visible={showCallerNameModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCallerNameModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Set Fake Call Caller Name</Text>

                        <Text style={[styles.modalSubtitle, { color: colors.gray, marginBottom: 12 }]}>
                            This name will appear when you trigger a fake call
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g., Mom, Dad, Boss"
                            placeholderTextColor={colors.gray}
                            value={tempCallerName}
                            onChangeText={setTempCallerName}
                            maxLength={20}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.gray + '30' }]}
                                onPress={() => setShowCallerNameModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.info }]}
                                onPress={handleSaveCallerName}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.white }]}>Save</Text>
                            </TouchableOpacity>
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
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        padding: 24,
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
    content: {
        padding: 16,
    },
    sosButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderRadius: 100,
        alignSelf: 'center',
        marginVertical: 24,
        width: 180,
        height: 180,
    },
    sosButtonActive: {
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    liveTrackingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignSelf: 'center',
        marginBottom: 16,
    },
    liveTrackingButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    sosActiveBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    sosActiveInfo: {
        flex: 1,
        marginLeft: 12,
    },
    sosActiveTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sosActiveSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    deviceStatusRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    deviceStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    deviceStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    signalWarningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        gap: 4,
    },
    signalWarningText: {
        fontSize: 10,
        flex: 1,
    },
    cancelSOSButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    cancelSOSButtonText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    sosText: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
    },
    sosSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featuresScrollContent: {
        paddingVertical: 8,
    },
    featureCard: {
        alignItems: 'center',
        padding: 16,
        width: 120,
        marginHorizontal: 8,
        marginVertical: 8,
        position: 'relative',
    },
    featureIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeIndicatorText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    contactsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 4,
    },
    contactsCard: {
        padding: 16,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
        fontSize: 14,
        marginTop: 2,
    },
    contactDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    contactAction: {
        padding: 8,
    },
    // Priority and contact management styles
    priorityBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    priorityBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    priorityLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    reorderButtons: {
        flexDirection: 'column',
        marginRight: 4,
    },
    reorderButton: {
        padding: 2,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '500',
    },
    noContactsContainer: {
        alignItems: 'center',
        padding: 24,
    },
    noContacts: {
        textAlign: 'center',
        marginTop: 12,
    },
    noContactsSubtext: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 4,
    },
    locationCard: {
        padding: 16,
        marginTop: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        marginLeft: 8,
    },
    refreshLocation: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'right',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    // Priority modal styles
    prioritySection: {
        marginVertical: 12,
    },
    priorityOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    priorityOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priorityOptionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Setting row styles
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingValue: {
        fontSize: 14,
        marginTop: 2,
    },
    settingHint: {
        fontSize: 12,
        marginTop: 8,
        lineHeight: 18,
    },
    modalSubtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default WomenSafetyScreen;
