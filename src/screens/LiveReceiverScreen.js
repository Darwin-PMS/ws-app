import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const LiveReceiverScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { sessionId, userName, userId } = route.params || {};

    const [activeTab, setActiveTab] = useState(0);
    const [isLive, setIsLive] = useState(true);
    const [duration, setDuration] = useState(0);
    const [location, setLocation] = useState(null);
    const [streams, setStreams] = useState({
        screen: false,
        frontCamera: false,
        backCamera: false,
    });

    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        try {
            const userLocation = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
            });
        } catch (error) {
            console.error('Error getting location:', error);
        }
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

    const openInMaps = () => {
        if (location) {
            const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
            Linking.openURL(url);
        }
    };

    const makeEmergencyCall = () => {
        Linking.openURL('tel:112');
    };

    const tabs = [
        { id: 'screen', label: 'Screen', icon: 'monitor' },
        { id: 'frontCamera', label: 'Front Cam', icon: 'camera' },
        { id: 'backCamera', label: 'Back Cam', icon: 'videocam' },
    ];

    const renderStreamView = () => {
        const activeStreamId = tabs[activeTab].id;
        const isStreamActive = streams[activeStreamId];

        if (!isStreamActive) {
            return (
                <View style={[styles.placeholderView, { backgroundColor: colors.card }]}>
                    <Ionicons name="videocam-off" size={60} color={colors.textSecondary} />
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                        {userName} hasn't enabled {tabs[activeTab].label.toLowerCase()} sharing
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.streamView, { backgroundColor: '#000' }]}>
                <View style={styles.streamPlaceholder}>
                    <Ionicons name="radio-button-on" size={40} color="#fff" />
                    <Text style={styles.streamPlaceholderText}>
                        Live {tabs[activeTab].label} Feed
                    </Text>
                    <Text style={styles.streamNoteText}>
                        (WebRTC integration required for actual video)
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Watching {userName || 'User'}
                    </Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.liveBadge, { backgroundColor: '#ff4444' }]}>
                            <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                        <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                            {formatDuration(duration)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.streamContainer}>
                {renderStreamView()}

                <View style={styles.tabBar}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === index && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => setActiveTab(index)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={20}
                                color={activeTab === index ? '#fff' : colors.textSecondary}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: activeTab === index ? '#fff' : colors.textSecondary }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
                {location ? (
                    <View style={styles.locationContainer}>
                        <View style={styles.mapPlaceholder}>
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            >
                                <Marker
                                    coordinate={location}
                                    title={userName}
                                />
                            </MapView>
                        </View>
                        <TouchableOpacity
                            style={[styles.mapButton, { backgroundColor: colors.primary }]}
                            onPress={openInMaps}
                        >
                            <Ionicons name="navigate" size={20} color="#fff" />
                            <Text style={styles.mapButtonText}>Open in Maps</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.noLocationText, { color: colors.textSecondary }]}>
                        Location not available
                    </Text>
                )}
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={makeEmergencyCall}
                >
                    <Ionicons name="call" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Call Emergency</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
                    onPress={() => {
                        Alert.alert(
                            'Report Emergency',
                            'This will alert authorities about the emergency.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Report', style: 'destructive' },
                            ]
                        );
                    }}
                >
                    <Ionicons name="alert-circle" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Report Emergency</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    liveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 10,
    },
    liveBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    durationText: {
        fontSize: 14,
    },
    streamContainer: {
        flex: 1,
        margin: 16,
    },
    streamView: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    streamPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streamPlaceholderText: {
        color: '#fff',
        fontSize: 18,
        marginTop: 10,
    },
    streamNoteText: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    placeholderView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    placeholderText: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    tabBar: {
        flexDirection: 'row',
        marginTop: 10,
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    tabLabel: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
    },
    infoSection: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    locationContainer: {
        flex: 1,
    },
    mapPlaceholder: {
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
    },
    map: {
        flex: 1,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    noLocationText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 0,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default LiveReceiverScreen;