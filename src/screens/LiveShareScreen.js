import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
    Dimensions, Modal, FlatList, Platform, Animated, ActivityIndicator, SectionList, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import liveStreamService from '../services/liveStreamService';
import databaseService from '../services/databaseService';
import familyService from '../services/familyService';
import globalSocketManager from '../services/globalSocketManager';
import { API_CONFIG } from '../services/api/endpoints';

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
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [viewers, setViewers] = useState([]);
    const [pendingViewers, setPendingViewers] = useState([]);
    const [isViewingShared, setIsViewingShared] = useState(false);
    const [sharedLocation, setSharedLocation] = useState(null);
    const [sharedSessionId, setSharedSessionId] = useState(null);
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const timerRef = useRef(null);
    const locationSubscription = useRef(null);

    useEffect(() => {
        loadContacts();
        requestPermissions();
        initSocket();
        
        globalSocketManager.on('connected', () => {
            console.log('>>> Global Socket connected event received');
            setSocketStatus('connected');
        });
        
        globalSocketManager.on('disconnected', (data) => {
            console.log('>>> Global Socket disconnected event received:', data);
            setSocketStatus('disconnected');
        });
        
        globalSocketManager.on('error', (data) => {
            console.log('>>> Global Socket error event received:', data);
            setSocketStatus('error');
        });
        
        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])).start();
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (locationSubscription.current) locationSubscription.current.remove();
            if (locationUpdateInterval) clearInterval(locationUpdateInterval);
            globalSocketManager.off('liveShareRequest');
            globalSocketManager.off('liveShareAccept');
            globalSocketManager.off('liveShareDecline');
            globalSocketManager.off('liveShareEnded');
            globalSocketManager.off('liveShareViewerJoined');
            globalSocketManager.off('liveShareLocationUpdate');
            globalSocketManager.off('liveShareAcceptConfirmed');
            globalSocketManager.off('connected');
            globalSocketManager.off('liveShareStarted');
            globalSocketManager.off('globalLiveShareRequest');
        };
    }, []);

    const forceReconnect = async () => {
        setIsReconnecting(true);
        console.log('Force reconnecting global socket...');
        
        globalSocketManager.disconnect();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (databaseService.token) {
            globalSocketManager.initialize(databaseService.token);
        }
        
        setTimeout(() => setIsReconnecting(false), 1000);
    };

    const checkConnectedUsers = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/ws/stats`);
            const data = await response.json();
            if (data.success) {
                setConnectedUsers(data.stats.connectedUsers || []);
            }
        } catch (e) {
            console.log('Error fetching connected users:', e);
        }
    };

    const initSocket = () => {
        if (databaseService.token) {
            setSocketStatus('connecting');
            
            if (!globalSocketManager.isConnected) {
                globalSocketManager.initialize(databaseService.token);
            } else {
                setSocketStatus('connected');
            }
            
            globalSocketManager.on('liveShareRequest', handleIncomingShareRequest);
            globalSocketManager.on('liveShareAccept', handleShareAccepted);
            globalSocketManager.on('liveShareDecline', handleShareDeclined);
            globalSocketManager.on('liveShareEnded', handleShareEnded);
            globalSocketManager.on('liveShareViewerJoined', handleViewerJoined);
            globalSocketManager.on('liveShareLocationUpdate', handleLocationUpdateFromSharer);
            globalSocketManager.on('liveShareAcceptConfirmed', handleAcceptConfirmed);
            globalSocketManager.on('connected', () => {
                console.log('Global Socket connected for live sharing');
            });
            
            globalSocketManager.on('liveShareStarted', (data) => {
                console.log('Live share started on server:', data);
                if (data.onlineRecipients?.length > 0) {
                    Alert.alert('Live Share Started', `Your location is now being shared with ${data.onlineRecipients.length} online contact(s).`);
                }
            });
        }
    };

    const handleIncomingShareRequest = (data) => {
        console.log('═══════════════════════════════════════');
        console.log('!!! INCOMING SHARE REQUEST !!!');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('═══════════════════════════════════════');
        
        setIncomingRequest(data);
        setShowRequestModal(true);
        
        if (data.isOnline) {
            Alert.alert(
                '🚨 Location Share Request!',
                `${data.sharerName} wants to share their live location with you!\n\nTap to respond.`,
                [
                    { text: 'Decline', style: 'cancel', onPress: () => declineShareRequest() },
                    { text: 'Accept', style: 'default', onPress: () => acceptShareRequest() },
                ],
                { 
                    cancelable: false,
                    onDismiss: () => {}
                }
            );
        }
    };

    const handleShareAccepted = (data) => {
        console.log('Share accepted:', data);
        if (data.userId !== userId) {
            setViewers(prev => [...prev, { id: data.userId, name: data.userName, accepted: true }]);
        }
    };

    const handleShareDeclined = (data) => {
        console.log('Share declined:', data);
        Alert.alert('Share Declined', `${data.userName} declined your live location sharing.`);
    };

    const handleShareEnded = (data) => {
        console.log('Share ended:', data);
        setIsStreaming(false);
        setSessionId(null);
        setViewers([]);
        setPendingViewers([]);
        Alert.alert('Live Sharing Ended', `${data.sharerName || 'The user'} has stopped sharing their location.`);
    };

    const handleViewerJoined = (data) => {
        console.log('Viewer joined:', data);
        setViewers(prev => [...prev.filter(v => v.id !== data.userId), { id: data.userId, name: data.userName, accepted: true }]);
        setPendingViewers(prev => prev.filter(v => v.id !== data.userId));
    };

    const handleLocationUpdateFromSharer = (data) => {
        setCurrentLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy
        });
    };

    const acceptShareRequest = () => {
        if (incomingRequest) {
            globalSocketManager.acceptLiveShare(incomingRequest.sessionId);
            setShowRequestModal(false);
            
            setIsViewingShared(true);
            setSharedSessionId(incomingRequest.sessionId);
            
            if (incomingRequest.sharerLocation) {
                setSharedLocation({
                    ...incomingRequest.sharerLocation,
                    name: incomingRequest.sharerName
                });
            }
            
            Alert.alert('Share Accepted', `You are now viewing ${incomingRequest.sharerName}'s live location. Location will update in real-time.`);
            
            setIncomingRequest(null);
        }
    };

    const declineShareRequest = () => {
        if (incomingRequest) {
            globalSocketManager.declineLiveShare(incomingRequest.sessionId, 'User declined');
            setShowRequestModal(false);
            setIncomingRequest(null);
        }
    };
    
    const handleAcceptConfirmed = (data) => {
        console.log('Accept confirmed:', data);
        if (data.currentLocation) {
            setSharedLocation({
                latitude: data.currentLocation.latitude,
                longitude: data.currentLocation.longitude,
                accuracy: data.currentLocation.accuracy,
                name: data.sharerName
            });
        }
    };

    useEffect(() => {
        if (isViewingShared) {
            globalSocketManager.on('liveShareEnded', (data) => {
                if (data.sessionId === sharedSessionId) {
                    setIsViewingShared(false);
                    setSharedLocation(null);
                    setSharedSessionId(null);
                    Alert.alert('Sharing Ended', `${data.sharerName || 'The user'} has stopped sharing their location.`);
                }
            });
            
            globalSocketManager.on('liveShareLocationUpdate', (data) => {
                if (data.sessionId === sharedSessionId) {
                    setSharedLocation({
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy: data.accuracy,
                        name: data.sharerName,
                        timestamp: data.timestamp
                    });
                }
            });
        }
        
        return () => {
            globalSocketManager.off('liveShareEnded');
            globalSocketManager.off('liveShareLocationUpdate');
            globalSocketManager.off('liveShareAcceptConfirmed');
        };
    }, [isViewingShared, sharedSessionId]);

    const requestPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (Platform.OS === 'android') await Notifications.requestPermissionsAsync();
    };

    const loadContacts = async () => {
        setLoadingContacts(true);
        try {
            console.log('Loading contacts for userId:', userId);
            
            const allContacts = [];
            
            // 1. Load Emergency Contacts (user-added + default)
            try {
                const emergencyResponse = await databaseService.fetchAPI('/users/emergency-contacts/all-with-support');
                console.log('Emergency Response:', JSON.stringify(emergencyResponse, null, 2));
                
                if (emergencyResponse.success && emergencyResponse.data) {
                    // User-added contacts
                    const userContacts = emergencyResponse.data.userContacts || [];
                    console.log('User contacts found:', userContacts.length);
                    
                    userContacts.forEach(c => {
                        const contactType = c.contactType || c.contact_type || 'personal';
                        const isAppUser = c.isAppUser || !!c.userId;
                        let category = 'My Emergency Contacts';
                        let displayRole = c.relationship || 'Contact';
                        
                        if (contactType === 'friend') {
                            category = 'Trusted Friends';
                            displayRole = c.relationship || 'Friend';
                        } else if (contactType === 'family') {
                            category = 'Family Contacts';
                            displayRole = c.relationship || 'Family Member';
                        } else if (contactType === 'work') {
                            category = 'Work Contacts';
                            displayRole = c.relationship || 'Colleague';
                        }
                        
                        allContacts.push({
                            id: c.userId || c.id,
                            originalId: c.id,
                            name: c.name || c.firstName || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unknown',
                            email: c.email,
                            phone: c.phone,
                            role: displayRole,
                            contactType: contactType,
                            source: 'emergency',
                            isPrimary: c.isPrimary || c.is_primary || false,
                            category: category,
                            isAppUser: isAppUser,
                        });
                    });
                    
                    // Default emergency contacts (helplines)
                    const defaultContacts = emergencyResponse.data.defaultContacts || [];
                    console.log('Default contacts found:', defaultContacts.length);
                    
                    defaultContacts.forEach(c => {
                        allContacts.push({
                            id: c.id,
                            name: c.name || 'Emergency Service',
                            email: null,
                            phone: c.phone,
                            role: c.description || 'Emergency Helpline',
                            source: 'default',
                            isPrimary: false,
                            category: 'Emergency Helplines',
                        });
                    });
                    
                    // Support Team
                    const supportTeam = emergencyResponse.data.supportTeam || [];
                    console.log('Support team found:', supportTeam.length);
                    
                    supportTeam.forEach(s => {
                        const roleLabel = s.role === 'admin' ? 'App Admin' : 
                                         s.role === 'support' ? 'Support Team' : 
                                         s.role === 'responder' ? 'First Responder' : 
                                         s.role === 'supervisor' ? 'Supervisor' : 'Support Staff';
                        allContacts.push({
                            id: s.id,
                            name: s.name,
                            email: s.email,
                            phone: s.phone,
                            role: roleLabel,
                            source: 'support',
                            isPrimary: false,
                            category: 'App Support Team',
                        });
                    });
                }
            } catch (err) {
                console.log('Emergency contacts API error:', err.message);
            }
            
            // 2. Load Family Members
            try {
                const familiesResponse = await familyService.getMyFamilies();
                console.log('Families Response:', JSON.stringify(familiesResponse, null, 2));
                
                if (familiesResponse.success) {
                    const families = familiesResponse.families || [];
                    console.log('Families found:', families.length);
                    
                    for (const family of families) {
                        try {
                            const membersResponse = await familyService.getFamilyMembers(family.id);
                            if (membersResponse.success) {
                                const members = membersResponse.members || [];
                                console.log(`Family ${family.name} members:`, members.length);
                                
                                members.forEach(member => {
                                    const memberUserId = member.user_id || member.userId;
                                    if (memberUserId && memberUserId !== userId) {
                                        const memberName = member.nickname || 
                                            `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
                                            member.email || 'Family Member';
                                        
                                        const familyRole = member.role === 'head' ? 'Family Head' : 
                                                         member.role === 'admin' ? 'Family Admin' : 
                                                         'Family Member';
                                        
                                        allContacts.push({
                                            id: memberUserId,
                                            name: memberName,
                                            email: member.email,
                                            phone: member.phone,
                                            role: familyRole,
                                            source: 'family',
                                            familyId: family.id,
                                            familyName: family.name,
                                            isPrimary: false,
                                            category: `My Family: ${family.name}`,
                                        });
                                    }
                                });
                            }
                        } catch (e) {
                            console.log('Error getting family members:', e.message);
                        }
                    }
                }
            } catch (err) {
                console.log('Family API error:', err.message);
            }

            const sortedContacts = allContacts.sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                return a.name.localeCompare(b.name);
            });
            
            console.log('Final contacts loaded:', sortedContacts.length);
            console.log('Contacts by source:', {
                emergency: sortedContacts.filter(c => c.source === 'emergency').length,
                default: sortedContacts.filter(c => c.source === 'default').length,
                family: sortedContacts.filter(c => c.source === 'family').length,
                support: sortedContacts.filter(c => c.source === 'support').length,
            });
            
            setContacts(sortedContacts);
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
            if (selectedContacts.length === 0 && contacts.length > 0) {
                const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
                setSelectedContacts([primaryContact]);
            }
            
            if (selectedContacts.length === 0) {
                Alert.alert('No Contacts Selected', 'Please select at least one contact to share your live location with.');
                return;
            }

            const coords = await getCurrentLocation();
            
            const appUsers = selectedContacts.filter(c => c.isAppUser || c.source === 'family' || c.source === 'support');
            const nonAppUsers = selectedContacts.filter(c => !c.isAppUser && c.source === 'emergency' && c.source !== 'family' && c.source !== 'support');
            
            console.log('═══════════════════════════════════════');
            console.log('STARTING LIVE STREAM');
            console.log('User ID (Sharer):', userId);
            console.log('Selected contacts:', selectedContacts.map(c => ({ id: c.id, name: c.name, source: c.source, isAppUser: c.isAppUser })));
            console.log('App users (will receive alerts):', appUsers.map(c => ({ id: c.id, name: c.name })));
            console.log('Non-app users (will be skipped):', nonAppUsers.map(c => ({ id: c.id, name: c.name })));
            console.log('═══════════════════════════════════════');
            
            if (appUsers.length === 0) {
                Alert.alert(
                    'No App Users Selected',
                    'None of the selected contacts have the app installed. Please select family members or support team who have the app installed to receive real-time alerts.',
                    [{ text: 'OK' }]
                );
                return;
            }
            
            const recipients = appUsers.map(c => c.id);
            const nonAppNames = nonAppUsers.map(c => c.name).join(', ');
            
            console.log('Starting live stream with recipients:', recipients);
            console.log('Contacts without app (will be skipped):', nonAppNames);
            
            const newSessionId = `share_${userId}_${Date.now()}`;
            setSessionId(newSessionId);
            setIsStreaming(true);
            setDuration(0);
            setViewers([]);
            setPendingViewers(appUsers.map(c => ({ id: c.id, name: c.name })));
            
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
            
            globalSocketManager.startLiveShare(
                newSessionId,
                userId,
                userName || 'User',
                recipients,
                coords,
                'Live location sharing request'
            );
            
            let infoMessage = `Your live location is being shared with ${appUsers.length} contact(s) who have the app.`;
            if (nonAppUsers.length > 0) {
                infoMessage += `\n\nNote: ${nonAppNames} don't have the app, so they won't receive alerts.`;
            }
            Alert.alert('Live Tracking Started', infoMessage);

            const interval = setInterval(async () => {
                try {
                    const loc = await getCurrentLocation();
                    if (loc && newSessionId) {
                        globalSocketManager.sendLiveShareLocation(newSessionId, loc.latitude, loc.longitude, loc.accuracy, 0);
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
                        const loc = { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy };
                        setCurrentLocation(loc);
                        if (newSessionId) {
                            try {
                                globalSocketManager.sendLiveShareLocation(newSessionId, loc.latitude, loc.longitude, loc.accuracy, location.coords.speed || 0);
                            } catch (e) {
                                console.log('Location update error:', e);
                            }
                        }
                    }
                );
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
                    if (sessionId) {
                        globalSocketManager.stopLiveShare(sessionId);
                    }
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (locationUpdateInterval) clearInterval(locationUpdateInterval);
                    if (locationSubscription.current) locationSubscription.current.remove();
                    setIsStreaming(false);
                    setSessionId(null);
                    setDuration(0);
                    setActiveStreams({ screen: false, frontCamera: false, backCamera: false });
                    setLocationUpdateInterval(null);
                    setViewers([]);
                    setPendingViewers([]);
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
        const isSelected = selectedContacts.some(c => c.id === contact.id);
        if (isSelected) {
            setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts(prev => [...prev, contact]);
        }
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderContactItem = ({ item, section }) => {
        const isSelected = selectedContacts.some(c => c.id === item.id);
        const contactName = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Unknown';
        const isPrimary = item.isPrimary;
        
        const getAvatarIcon = () => {
            if (item.source === 'default') return 'call';
            if (item.source === 'family') return 'people';
            if (item.source === 'support') return 'shield-checkmark';
            if (item.contactType === 'friend') return 'heart';
            if (item.contactType === 'work') return 'briefcase';
            return 'person';
        };
        
        const getAvatarColor = () => {
            if (item.source === 'default') return colors.error;
            if (item.source === 'family') return '#10B981';
            if (item.source === 'support') return '#8B5CF6';
            if (item.contactType === 'friend') return '#EC4899';
            if (item.contactType === 'work') return '#3B82F6';
            return colors.primary;
        };
        
        const getBadgeText = () => {
            if (isPrimary) return 'Primary';
            if (item.source === 'support') return 'App Team';
            if (item.contactType === 'friend') return 'Friend';
            if (item.contactType === 'work') return 'Work';
            return null;
        };
        
        const badgeText = getBadgeText();
        
        return (
            <TouchableOpacity 
                style={[
                    styles.contactItem, 
                    { backgroundColor: isSelected ? colors.primary + '15' : colors.background, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 },
                ]} 
                onPress={() => toggleContactSelection(item)}
            >
                <View style={[styles.avatar, { backgroundColor: getAvatarColor() + '20' }]}>
                    <Ionicons name={getAvatarIcon()} size={24} color={getAvatarColor()} />
                </View>
                <View style={styles.contactInfo}>
                    <View style={styles.contactNameRow}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{contactName}</Text>
                        {badgeText && (
                            <View style={[styles.badge, { backgroundColor: getAvatarColor() + '20' }]}>
                                <Text style={[styles.badgeText, { color: getAvatarColor() }]}>{badgeText}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.contactPhone, { color: colors.gray }]}>{item.phone || 'No phone'}</Text>
                    <Text style={[styles.contactRelation, { color: colors.gray }]}>
                        {item.role || 'Contact'}
                    </Text>
                </View>
                {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                ) : (
                    <View style={[styles.checkCircle, { backgroundColor: colors.border }]}>
                        <Ionicons name="add" size={16} color={colors.gray} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const getSectionData = () => {
        const sections = {};
        contacts.forEach(contact => {
            const category = contact.category || 'Other';
            if (!sections[category]) {
                sections[category] = [];
            }
            sections[category].push(contact);
        });
        
        return Object.keys(sections).map(key => ({
            title: key,
            data: sections[key],
        }));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: isStreaming ? '#EF4444' : colors.primary }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Live Location Share</Text>
                        <Text style={styles.headerSubtitle}>{isStreaming ? 'Sharing active' : 'Share location with connected contacts'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 5 }}>
                        <View style={{
                            width: 10, height: 10, borderRadius: 5,
                            backgroundColor: socketStatus === 'connected' ? '#10B981' : socketStatus === 'connecting' ? '#F59E0B' : '#EF4444',
                            marginRight: 6
                        }} />
                        <Text style={{ color: '#fff', fontSize: 11 }}>{socketStatus}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={forceReconnect}
                        disabled={isReconnecting}
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)', 
                            paddingHorizontal: 10, 
                            paddingVertical: 6, 
                            borderRadius: 15,
                            marginRight: 8 
                        }}
                    >
                        {isReconnecting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="refresh" size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {!isStreaming ? (
                    <View style={styles.startSection}>
                        <Animated.View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15', transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="videocam-outline" size={56} color={colors.primary} />
                        </Animated.View>
                        <Text style={[styles.mainTitle, { color: colors.text }]}>Start Live Safety Share</Text>
                        <Text style={[styles.mainDesc, { color: colors.gray }]}>Share your live location with trusted contacts, family members, and app support team during emergencies</Text>

                        {__DEV__ && (
                            <View style={[styles.debugCard, { backgroundColor: '#1a1a1a', marginBottom: 15 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="bug-outline" size={16} color="#10B981" />
                                        <Text style={{ color: '#10B981', marginLeft: 8, fontSize: 12 }}>
                                            User: {userId?.substring(0, 8)}... | Socket: {socketStatus}
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={checkConnectedUsers}
                                        style={{ backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 10 }}>Check WS</Text>
                                    </TouchableOpacity>
                                </View>
                                {connectedUsers.length > 0 && (
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={{ color: '#10B981', fontSize: 10 }}>Connected Users ({connectedUsers.length}):</Text>
                                        {connectedUsers.slice(0, 3).map((uid, i) => (
                                            <Text key={i} style={{ color: uid === userId ? '#F59E0B' : '#888', fontSize: 10 }}>
                                                {uid === userId ? '★ ' : '  '}{uid?.substring(0, 8)}...
                                            </Text>
                                        ))}
                                        {connectedUsers.length > 3 && (
                                            <Text style={{ color: '#888', fontSize: 10 }}>  +{connectedUsers.length - 3} more</Text>
                                        )}
                                    </View>
                                )}
                                <TouchableOpacity 
                                    style={{ marginTop: 8, backgroundColor: '#333', padding: 8, borderRadius: 4 }}
                                    onPress={() => {
                                        Alert.alert(
                                            'Debug Info',
                                            `User ID: ${userId}\nSocket Status: ${socketStatus}\nContacts: ${contacts.length}\nSelected: ${selectedContacts.length}\n\nConnected Users:\n${connectedUsers.map(u => u?.substring(0, 8)).join('\n') || 'None'}`,
                                            [{ text: 'OK' }]
                                        );
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center' }}>Tap for Full Debug</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.selectContactsCard, { backgroundColor: colors.card, ...shadows.md }]} onPress={() => { loadContacts(); setShowContactModal(true); }}>
                            <View style={[styles.selectIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="people-outline" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.selectInfo}>
                                <Text style={[styles.selectTitle, { color: colors.text }]}>
                                    {selectedContacts.length > 0 ? `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} selected` : 'Select Who Can View'}
                                </Text>
                                <Text style={[styles.selectSubtitle, { color: colors.gray }]}>
                                    {contacts.length > 0 ? `${contacts.length} connected contacts` : 'Your emergency contacts & family'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={22} color={colors.gray} />
                        </TouchableOpacity>

                        <View style={styles.featureList}>
                            {[
                                { icon: 'location-outline', text: 'Real-time location with your connected contacts', color: '#10B981' },
                                { icon: 'people-outline', text: 'Share with family, friends & emergency contacts', color: '#3B82F6' },
                                { icon: 'shield-checkmark-outline', text: 'App support team monitoring available', color: '#8B5CF6' },
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
                            <Text style={styles.startBtnText}>Start Live Tracking</Text>
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
                                    {selectedContacts.map((contact) => {
                                        const contactName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown';
                                        const isFamily = contact.source === 'family';
                                        const isDefault = contact.source === 'default';
                                        const isSupport = contact.source === 'support';
                                        const itemColor = isFamily ? '#10B981' : (isDefault ? colors.error : (isSupport ? '#8B5CF6' : colors.primary));
                                        const icon = isFamily ? 'people' : (isDefault ? 'call' : (isSupport ? 'shield-checkmark' : 'person'));
                                        
                                        return (
                                            <View key={contact.id} style={[styles.sharedItem, { backgroundColor: itemColor + '15' }]}>
                                                <Ionicons name={icon} size={14} color={itemColor} />
                                                <Text style={[styles.sharedItemText, { color: colors.text }]}>{contactName}</Text>
                                                {contact.isPrimary && <View style={[styles.primaryDot, { backgroundColor: colors.error }]} />}
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : <Text style={[styles.defaultText, { color: colors.gray }]}>No contacts selected</Text>}
                        </View>

                        {(viewers.length > 0 || pendingViewers.length > 0) && (
                            <View style={[styles.viewersSection, { backgroundColor: colors.card, ...shadows.md }]}>
                                <Text style={[styles.viewersSectionTitle, { color: colors.text }]}>
                                    Viewers ({viewers.length} accepted, {pendingViewers.length} pending)
                                </Text>
                                {viewers.map((viewer) => (
                                    <View key={viewer.id} style={styles.viewerItem}>
                                        <View style={styles.viewerAvatar}>
                                            <Ionicons name="person" size={18} color="#10B981" />
                                        </View>
                                        <Text style={styles.viewerName}>{viewer.name}</Text>
                                        <Text style={styles.viewerStatus}>Watching</Text>
                                    </View>
                                ))}
                                {pendingViewers.map((viewer) => (
                                    <View key={viewer.id} style={styles.viewerItem}>
                                        <View style={[styles.viewerAvatar, { backgroundColor: '#F59E0B20' }]}>
                                            <Ionicons name="person-outline" size={18} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.viewerName}>{viewer.name}</Text>
                                        <Text style={[styles.viewerStatus, styles.pendingStatus]}>Pending</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={[styles.stopBtn, { backgroundColor: '#EF4444' }]} onPress={stopStreaming} activeOpacity={0.8}>
                            <Ionicons name="stop-circle-outline" size={26} color="#fff" />
                            <Text style={styles.stopBtnText}>Stop Sharing</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {isViewingShared && sharedLocation && (
                <View style={[styles.viewerModeContainer, { backgroundColor: colors.card, ...shadows.lg }]}>
                    <View style={styles.viewerModeHeader}>
                        <View style={styles.viewerModeInfo}>
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                            <Text style={[styles.viewerModeName, { color: colors.text }]}>
                                Viewing {sharedLocation.name}'s Location
                            </Text>
                            <Text style={[styles.viewerModeSubtitle, { color: colors.gray }]}>
                                Real-time location sharing active
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.stopViewingBtn}
                            onPress={() => {
                                setIsViewingShared(false);
                                setSharedLocation(null);
                                setSharedSessionId(null);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.locationCard}>
                        <View style={styles.locationRow}>
                            <Ionicons name="navigate" size={20} color="#10B981" />
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, { color: colors.gray }]}>Latitude</Text>
                                <Text style={[styles.locationValue, { color: colors.text }]}>
                                    {sharedLocation.latitude?.toFixed(6)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.locationRow}>
                            <Ionicons name="compass" size={20} color="#10B981" />
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, { color: colors.gray }]}>Longitude</Text>
                                <Text style={[styles.locationValue, { color: colors.text }]}>
                                    {sharedLocation.longitude?.toFixed(6)}
                                </Text>
                            </View>
                        </View>
                        {sharedLocation.accuracy && (
                            <View style={styles.locationRow}>
                                <Ionicons name="radio" size={20} color="#10B981" />
                                <View style={styles.locationInfo}>
                                    <Text style={[styles.locationLabel, { color: colors.gray }]}>Accuracy</Text>
                                    <Text style={[styles.locationValue, { color: colors.text }]}>
                                        ±{sharedLocation.accuracy?.toFixed(1)}m
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <Text style={[styles.viewerModeNote, { color: colors.gray }]}>
                        Location updates automatically as they move. Sharing will end when they stop.
                    </Text>
                </View>
            )}

            <Modal visible={showContactModal} animationType="slide" transparent onRequestClose={() => setShowContactModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Share With</Text>
                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>
                        {selectedContacts.length > 0 && (
                            <View style={[styles.selectedCountBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                                    {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                                </Text>
                            </View>
                        )}
                        {loadingContacts ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.gray }]}>Loading your contacts...</Text>
                            </View>
                        ) : contacts.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color={colors.gray} />
                                <Text style={[styles.emptyText, { color: colors.gray, marginTop: 12 }]}>No connected contacts yet.</Text>
                                <Text style={[styles.emptySubtext, { color: colors.gray }]}>Add emergency contacts in Safety screen{'\n'}or join a family to share location.</Text>
                            </View>
                        ) : (
                            <SectionList
                                sections={getSectionData()}
                                renderItem={renderContactItem}
                                renderSectionHeader={({ section }) => (
                                    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
                                        <Text style={[styles.sectionCount, { color: colors.gray }]}>{section.data.length} contact{section.data.length > 1 ? 's' : ''}</Text>
                                    </View>
                                )}
                                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                                style={styles.contactList}
                                stickySectionHeadersEnabled={false}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: selectedContacts.length > 0 ? colors.primary : colors.gray + '50' }]} onPress={() => setShowContactModal(false)}>
                                <Text style={styles.confirmBtnText}>
                                    {selectedContacts.length > 0 ? `Share with ${selectedContacts.length} Contact${selectedContacts.length > 1 ? 's' : ''}` : 'Select contacts to continue'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showRequestModal} transparent animationType="fade" onRequestClose={() => {}}>
                <TouchableOpacity 
                    style={styles.requestModalOverlay} 
                    activeOpacity={1}
                    onPress={() => {}}
                >
                    <View style={styles.requestModalContent}>
                        <View style={[styles.requestIconWrapper, { backgroundColor: '#EF444420' }]}>
                            <Ionicons name="location" size={50} color="#EF4444" />
                        </View>
                        <Text style={[styles.requestTitle, { color: '#1a1a1a' }]}>🚨 Location Share Request</Text>
                        <Text style={[styles.requestMessage, { color: '#666' }]}>
                            {incomingRequest?.sharerName} wants to share their live location with you
                        </Text>
                        {incomingRequest?.sharerLocation && (
                            <View style={styles.locationPreview}>
                                <Ionicons name="navigate" size={16} color="#10B981" />
                                <Text style={[styles.requestMessage, { color: '#10B981', marginTop: 0 }]}>
                                    Location: {incomingRequest.sharerLocation.latitude?.toFixed(4)}, {incomingRequest.sharerLocation.longitude?.toFixed(4)}
                                </Text>
                            </View>
                        )}
                        <Text style={[styles.requestWarning, { color: '#EF4444' }]}>
                            ⚠️ This will give you real-time access to their location until they stop sharing
                        </Text>
                        <View style={styles.requestButtons}>
                            <TouchableOpacity style={styles.declineBtn} onPress={declineShareRequest}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                <Text style={styles.declineBtnText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn} onPress={acceptShareRequest}>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.acceptBtnText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
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
    debugCard: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' },
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
    sharedCard: { padding: 18, borderRadius: 16, marginBottom: 24, maxHeight: 200 },
    sharedTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    sharedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sharedItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    sharedItemText: { fontSize: 13, fontWeight: '500' },
    primaryDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
    moreText: { fontSize: 13, fontWeight: '600', alignSelf: 'center' },
    defaultText: { fontSize: 13, fontStyle: 'italic' },
    stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 12 },
    stopBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    bottomPadding: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40, maxHeight: '85%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    selectedCountBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
    selectedCountText: { fontSize: 13, fontWeight: '600' },
    contactList: { maxHeight: 400 },
    listContent: { paddingBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginTop: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionCount: { fontSize: 12 },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactName: { fontSize: 15, fontWeight: '600' },
    contactPhone: { fontSize: 12, marginTop: 2 },
    contactRelation: { fontSize: 11, marginTop: 2 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    checkCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '500' },
    emptySubtext: { textAlign: 'center', fontSize: 12, marginTop: 4 },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { fontSize: 14, marginTop: 12 },
    modalFooter: { paddingTop: 8 },
    confirmBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    requestModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    requestModalContent: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    requestIconWrapper: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    requestTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
    requestMessage: { fontSize: 15, textAlign: 'center', marginBottom: 8 },
    locationPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#10B98110', borderRadius: 12, marginTop: 8 },
    requestWarning: { fontSize: 12, textAlign: 'center', marginTop: 12, fontWeight: '500' },
    requestButtons: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    declineBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FEE2E2', flexDirection: 'row', gap: 8, justifyContent: 'center' },
    declineBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
    acceptBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#10B981', flexDirection: 'row', gap: 8, justifyContent: 'center' },
    acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    viewerModeContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    viewerModeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    viewerModeInfo: { flex: 1 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    liveText: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
    viewerModeName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    viewerModeSubtitle: { fontSize: 13 },
    stopViewingBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
    locationCard: { backgroundColor: '#10B98110', borderRadius: 16, padding: 16, marginBottom: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    locationInfo: { marginLeft: 12, flex: 1 },
    locationLabel: { fontSize: 12 },
    locationValue: { fontSize: 15, fontWeight: '600' },
    viewerModeNote: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});

export default LiveShareScreen;
