import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import biometricService from '../services/biometricService';
import silentModeService from '../services/silentModeService';
import userService from '../services/userService';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

const SettingsScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows, isDark, toggleTheme } = useTheme();
    const { logout, userId } = useApp();

    // User Settings State
    const [userSettings, setUserSettings] = useState({
        location_sharing: true,
        notification_enabled: true,
        auto_sos: false,
        shake_to_sos: false,
        sos_timer: 30,
        volume_press_enabled: false,
        power_press_enabled: false,
        voice_enabled: false,
        auto_sos_enabled: false,
        location_enabled: true,
        family_agent_enabled: true,
    });

    // Permission states
    const [locationPermission, setLocationPermission] = useState('undetermined');
    const [cameraPermission, setCameraPermission] = useState('undetermined');
    const [microphonePermission, setMicrophonePermission] = useState('undetermined');
    const [notificationPermission, setNotificationPermission] = useState('undetermined');

    // Biometric states
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometric');

    // Silent/Vibration Mode states
    const [silentMode, setSilentMode] = useState(false);
    const [vibrationMode, setVibrationMode] = useState(true);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [silentDuration, setSilentDuration] = useState(0);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Duration options for silent mode
    const durationOptions = [
        { id: 15, label: '15 minutes' },
        { id: 30, label: '30 minutes' },
        { id: 60, label: '1 hour' },
        { id: 120, label: '2 hours' },
        { id: 480, label: '8 hours' },
        { id: 0, label: 'Until turned off' },
    ];

    // SOS Timer options
    const sosTimerOptions = [
        { id: 10, label: '10 seconds' },
        { id: 30, label: '30 seconds' },
        { id: 60, label: '1 minute' },
        { id: 120, label: '2 minutes' },
    ];

    useEffect(() => {
        checkBiometricStatus();
        loadSilentVibrationSettings();
        loadUserSettings();
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
            setLocationPermission(locationStatus);

            const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
            setCameraPermission(cameraStatus);

            const { status: microphoneStatus } = await Audio.getPermissionsAsync();
            setMicrophonePermission(microphoneStatus);

            const { status: notificationStatus } = await Notifications.getPermissionsAsync();
            setNotificationPermission(notificationStatus);
        } catch (error) {
            console.log('Error checking permissions:', error);
        }
    };

    const requestPermission = async (permission, type) => {
        try {
            let status;
            switch (type) {
                case 'location':
                    const locationResult = await Location.requestForegroundPermissionsAsync();
                    status = locationResult.status;
                    break;
                case 'camera':
                    const cameraResult = await Camera.requestCameraPermissionsAsync();
                    status = cameraResult.status;
                    break;
                case 'microphone':
                    const audioResult = await Audio.requestPermissionsAsync();
                    status = audioResult.status;
                    break;
                case 'notification':
                    const notifResult = await Notifications.requestPermissionsAsync();
                    status = notifResult.status;
                    break;
            }

            if (type === 'location') setLocationPermission(status);
            if (type === 'camera') setCameraPermission(status);
            if (type === 'microphone') setMicrophonePermission(status);
            if (type === 'notification') setNotificationPermission(status);

            if (status === 'granted') {
                Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} permission granted`);
            } else {
                Alert.alert('Permission Denied', `Please enable ${type} permission in your device settings`);
            }
        } catch (error) {
            console.log('Error requesting permission:', error);
        }
    };

    const loadUserSettings = async () => {
        try {
            const response = await userService.getUserSettings(userId);
            if (response.success && response.settings) {
                setUserSettings({
                    location_sharing: response.settings.location_sharing !== 0,
                    notification_enabled: response.settings.notification_enabled !== 0,
                    auto_sos: response.settings.auto_sos === 1,
                    shake_to_sos: response.settings.shake_to_sos === 1,
                    sos_timer: response.settings.sos_timer || 30,
                    volume_press_enabled: response.settings.volume_press_enabled === 1,
                    power_press_enabled: response.settings.power_press_enabled === 1,
                    voice_enabled: response.settings.voice_enabled === 1,
                    auto_sos_enabled: response.settings.auto_sos_enabled === 1,
                    location_enabled: response.settings.location_enabled === 1,
                    family_agent_enabled: response.settings.family_agent_enabled === 1,
                });
            }
        } catch (error) {
            console.log('Error loading user settings:', error);
        }
    };

    const updateUserSetting = async (key, value) => {
        try {
            const settingsToUpdate = { [key]: value ? 1 : 0 };
            const response = await userService.updateUserSettings(userId, settingsToUpdate);
            if (response.success) {
                setUserSettings(prev => ({ ...prev, [key]: value }));
            }
        } catch (error) {
            console.log('Error updating user setting:', error);
            Alert.alert('Error', 'Failed to update setting');
        }
    };

    const checkBiometricStatus = async () => {
        try {
            const result = await biometricService.initialize();
            const isEnabled = await biometricService.isBiometricEnabled();

            setBiometricAvailable(result.available && result.enrolled);
            setBiometricEnabled(isEnabled);

            if (result.types && result.types.length > 0) {
                if (result.types.includes(1)) {
                    setBiometricType('Face ID');
                } else if (result.types.includes(2)) {
                    setBiometricType('Fingerprint');
                }
            }
        } catch (error) {
            console.log('Biometric check error:', error);
        }
    };

    // Load Silent/Vibration Mode settings
    const loadSilentVibrationSettings = async () => {
        try {
            const settings = await silentModeService.getSettings();
            setSilentMode(settings.silentMode);
            setVibrationMode(settings.vibrationMode);
        } catch (error) {
            console.log('Error loading silent/vibration settings:', error);
        }
    };

    // Handle Silent Mode toggle
    const handleSilentModeToggle = async (value) => {
        if (value) {
            // Show duration picker when enabling
            setShowDurationModal(true);
        } else {
            // Disable silent mode
            await silentModeService.setSilentMode(false);
            setSilentMode(false);
            Alert.alert('Silent Mode', 'Silent mode disabled');
        }
    };

    // Handle duration selection for silent mode
    const handleDurationSelect = async (duration) => {
        setSilentDuration(duration);
        await silentModeService.setSilentMode(true, duration);
        setSilentMode(true);
        setShowDurationModal(false);

        const durationText = duration === 0 ? 'Until turned off' : `${duration} minutes`;
        Alert.alert('Silent Mode', `Silent mode enabled for ${durationText}`);
    };

    // Handle Vibration Mode toggle
    const handleVibrationModeToggle = async (value) => {
        await silentModeService.setVibrationMode(value);
        setVibrationMode(value);
        Alert.alert(
            'Vibration Mode',
            value ? 'Vibration enabled' : 'Vibration disabled'
        );
    };

    const handleBiometricToggle = async (value) => {
        if (value) {
            // Enable biometric
            const result = await biometricService.enableBiometric(userId, null);
            if (result.success) {
                setBiometricEnabled(true);
                Alert.alert('Success', `${biometricType} login enabled successfully!`);
            } else {
                Alert.alert('Error', result.error || 'Failed to enable biometric login');
            }
        } else {
            // Disable biometric
            Alert.alert(
                'Disable Biometric',
                'Are you sure you want to disable biometric login?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            const result = await biometricService.disableBiometric();
                            if (result.success) {
                                setBiometricEnabled(false);
                                Alert.alert('Success', 'Biometric login disabled');
                            } else {
                                Alert.alert('Error', 'Failed to disable biometric login');
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleSOSSettingChange = async (key, value) => {
        try {
            const settingsToUpdate = { [key]: value ? 1 : 0 };
            const response = await userService.updateUserSettings(userId, settingsToUpdate);
            if (response.success) {
                setUserSettings(prev => ({ ...prev, [key]: value }));
                if (key === 'sos_timer') {
                    Alert.alert('SOS Timer', `Timer set to ${value} seconds`);
                }
            }
        } catch (error) {
            console.log('Error updating SOS setting:', error);
        }
    };

    const handleSOSDurationSelect = async (duration) => {
        await handleSOSSettingChange('sos_timer', duration);
        setShowSOSModal(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setIsChangingPassword(true);
        try {
            // Call the API to change password
            const response = await userService.updateProfile(userId, {
                currentPassword,
                newPassword,
            });

            if (response.success) {
                Alert.alert('Success', 'Password changed successfully');
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', response.message || 'Failed to change password');
            }
        } catch (error) {
            console.log('Error changing password:', error);
            Alert.alert('Error', 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const getPermissionStatus = (status) => {
        switch (status) {
            case 'granted':
                return 'Granted';
            case 'denied':
                return 'Denied';
            default:
                return 'Not Set';
        }
    };

    const getPermissionColor = (status) => {
        switch (status) {
            case 'granted':
                return colors.success;
            case 'denied':
                return colors.error;
            default:
                return colors.warning;
        }
    };

    const settingsGroups = [
        {
            title: 'Permissions',
            items: [
                {
                    id: 'location',
                    title: 'Location',
                    icon: 'location-outline',
                    type: 'permission',
                    status: locationPermission,
                    onPress: () => requestPermission(null, 'location'),
                },
                {
                    id: 'camera',
                    title: 'Camera',
                    icon: 'camera-outline',
                    type: 'permission',
                    status: cameraPermission,
                    onPress: () => requestPermission(null, 'camera'),
                },
                {
                    id: 'microphone',
                    title: 'Microphone',
                    icon: 'mic-outline',
                    type: 'permission',
                    status: microphonePermission,
                    onPress: () => requestPermission(null, 'microphone'),
                },
                {
                    id: 'notifications',
                    title: 'Notifications',
                    icon: 'notifications-outline',
                    type: 'permission',
                    status: notificationPermission,
                    onPress: () => requestPermission(null, 'notification'),
                },
            ],
        },
        {
            title: 'Appearance',
            items: [
                { id: 'darkMode', title: 'Dark Mode', icon: 'moon-outline', type: 'switch', value: isDark, onValueChange: toggleTheme },
            ],
        },
        {
            title: 'Location & Sharing',
            items: [
                {
                    id: 'location_enabled',
                    title: 'Location Tracking',
                    icon: 'location-outline',
                    type: 'switch',
                    value: userSettings.location_enabled,
                    onValueChange: (val) => updateUserSetting('location_enabled', val),
                    subtitle: 'Enable location tracking'
                },
                {
                    id: 'location_sharing',
                    title: 'Share Location',
                    icon: 'share-outline',
                    type: 'switch',
                    value: userSettings.location_sharing,
                    onValueChange: (val) => updateUserSetting('location_sharing', val),
                    subtitle: 'Allow family to see your location'
                },
                {
                    id: 'family_agent_enabled',
                    title: 'Family Agent',
                    icon: 'people-outline',
                    type: 'switch',
                    value: userSettings.family_agent_enabled,
                    onValueChange: (val) => updateUserSetting('family_agent_enabled', val),
                    subtitle: 'Enable family agent features'
                },
            ],
        },
        {
            title: 'Security',
            items: [
                {
                    id: 'biometric',
                    title: `${biometricType} Login`,
                    icon: biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline',
                    type: biometricAvailable ? 'switch' : 'info',
                    value: biometricEnabled,
                    onValueChange: handleBiometricToggle,
                    disabled: !biometricAvailable,
                    subtitle: biometricAvailable ? (biometricEnabled ? 'Enabled' : 'Disabled') : 'Not available on this device'
                },
                { id: 'profile', title: 'Edit Profile', icon: 'person-outline', type: 'link', onPress: () => navigation.navigate('Profile') },
                { id: 'password', title: 'Change Password', icon: 'lock-closed-outline', type: 'link', onPress: () => setShowPasswordModal(true) },
            ],
        },
        {
            title: 'SOS Settings',
            items: [
                {
                    id: 'auto_sos',
                    title: 'Auto SOS',
                    icon: 'warning-outline',
                    type: 'switch',
                    value: userSettings.auto_sos,
                    onValueChange: (val) => updateUserSetting('auto_sos', val),
                    subtitle: 'Automatically send SOS when triggered'
                },
                {
                    id: 'shake_to_sos',
                    title: 'Shake to SOS',
                    icon: 'phone-landscape-outline',
                    type: 'switch',
                    value: userSettings.shake_to_sos,
                    onValueChange: (val) => updateUserSetting('shake_to_sos', val),
                    subtitle: 'Shake phone to trigger SOS'
                },
                {
                    id: 'sos_timer',
                    title: 'SOS Timer',
                    icon: 'timer-outline',
                    type: 'link',
                    onPress: () => setShowSOSModal(true),
                    value: `${userSettings.sos_timer}s`
                },
                {
                    id: 'volume_press',
                    title: 'Volume Press SOS',
                    icon: 'volume-high-outline',
                    type: 'switch',
                    value: userSettings.volume_press_enabled,
                    onValueChange: (val) => updateUserSetting('volume_press_enabled', val),
                    subtitle: 'Press volume button 3 times'
                },
                {
                    id: 'power_press',
                    title: 'Power Press SOS',
                    icon: 'power-outline',
                    type: 'switch',
                    value: userSettings.power_press_enabled,
                    onValueChange: (val) => updateUserSetting('power_press_enabled', val),
                    subtitle: 'Press power button 3 times'
                },
            ],
        },
        {
            title: 'Notifications',
            items: [
                {
                    id: 'notification_enabled',
                    title: 'Push Notifications',
                    icon: 'notifications-outline',
                    type: 'switch',
                    value: userSettings.notification_enabled,
                    onValueChange: (val) => updateUserSetting('notification_enabled', val)
                },
                { id: 'silentMode', title: 'Silent Mode', icon: 'volume-mute-outline', type: 'switch', value: silentMode, onValueChange: handleSilentModeToggle, subtitle: silentMode ? 'Enabled' : 'Disabled' },
                { id: 'vibrationMode', title: 'Vibration', icon: 'phone-portrait-outline', type: 'switch', value: vibrationMode, onValueChange: handleVibrationModeToggle, subtitle: vibrationMode ? 'Enabled' : 'Disabled' },
            ],
        },
        {
            title: 'Safety Resources',
            items: [
                { id: 'helpline', title: 'Emergency Helplines', icon: 'call-outline', type: 'link', onPress: () => navigation.navigate('EmergencyHelpline') },
                { id: 'grievance', title: 'File Complaint', icon: 'document-text-outline', type: 'link', onPress: () => navigation.navigate('Grievance') },
                { id: 'help', title: 'Help Center', icon: 'help-circle-outline', type: 'link', onPress: () => Alert.alert('Coming Soon', 'Help feature coming soon') },
                { id: 'feedback', title: 'Send Feedback', icon: 'chatbubble-outline', type: 'link', onPress: () => Alert.alert('Coming Soon', 'Feedback feature coming soon') },
                { id: 'privacy', title: 'Privacy Policy', icon: 'shield-outline', type: 'link', onPress: () => navigation.navigate('PrivacyPolicy') },
                { id: 'terms', title: 'Terms of Service', icon: 'document-text-outline', type: 'link', onPress: () => navigation.navigate('TermsOfService') },
            ],
        },
        {
            title: 'About',
            items: [
                { id: 'about', title: 'About App', icon: 'information-circle-outline', type: 'link', onPress: () => Alert.alert('Women Safety App v1.0.0', 'Your safety is our priority') },
            ],
        },
    ];

    const renderItem = (item, index, total) => {
        const isLast = index === total - 1;

        if (item.type === 'permission') {
            return (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]}
                    onPress={item.onPress}
                >
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                    <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.settingSubtext, { color: getPermissionColor(item.status) }]}>
                            {getPermissionStatus(item.status)}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>
            );
        }

        return (
            <View
                key={item.id}
                style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]}
            >
                <Ionicons name={item.icon} size={22} color={item.disabled ? colors.gray : colors.primary} />
                <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingText, { color: item.disabled ? colors.gray : colors.text }]}>{item.title}</Text>
                    {item.subtitle && (
                        <Text style={[styles.settingSubtext, { color: colors.gray }]}>{item.subtitle}</Text>
                    )}
                    {item.value !== undefined && item.type !== 'switch' && item.type !== 'permission' && (
                        <Text style={[styles.settingValue, { color: colors.primary }]}>{item.value}</Text>
                    )}
                </View>
                {item.type === 'switch' ? (
                    <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        disabled={item.disabled}
                    />
                ) : item.type === 'info' ? (
                    <View style={styles.linkContainer}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.gray} />
                    </View>
                ) : (
                    <TouchableOpacity onPress={item.onPress} style={styles.linkContainer}>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {settingsGroups.map((group) => (
                    <View key={group.title} style={{ marginBottom: spacing.lg }}>
                        <Text style={[styles.groupTitle, { color: colors.gray }]}>{group.title}</Text>
                        <View style={[styles.card, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                            {group.items.map((item, index) => renderItem(item, index, group.items.length))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
                    onPress={() => Alert.alert('Logout', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Logout', style: 'destructive', onPress: logout },
                    ])}
                >
                    <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Silent Mode Duration Picker Modal */}
            <Modal
                visible={showDurationModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDurationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Duration</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>Choose how long to keep silent mode on</Text>

                        {durationOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.durationOption,
                                    silentDuration === option.id && { backgroundColor: colors.primary + '20' }
                                ]}
                                onPress={() => handleDurationSelect(option.id)}
                            >
                                <Text style={[
                                    styles.durationOptionText,
                                    { color: colors.text },
                                    silentDuration === option.id && { color: colors.primary, fontWeight: '600' }
                                ]}>
                                    {option.label}
                                </Text>
                                {silentDuration === option.id && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={() => setShowDurationModal(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* SOS Timer Modal */}
            <Modal
                visible={showSOSModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowSOSModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>SOS Timer</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>Time before SOS is sent automatically</Text>

                        {sosTimerOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.durationOption,
                                    userSettings.sos_timer === option.id && { backgroundColor: colors.primary + '20' }
                                ]}
                                onPress={() => handleSOSDurationSelect(option.id)}
                            >
                                <Text style={[
                                    styles.durationOptionText,
                                    { color: colors.text },
                                    userSettings.sos_timer === option.id && { color: colors.primary, fontWeight: '600' }
                                ]}>
                                    {option.label}
                                </Text>
                                {userSettings.sos_timer === option.id && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={() => setShowSOSModal(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Current Password"
                            placeholderTextColor={colors.gray}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="New Password"
                            placeholderTextColor={colors.gray}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Confirm New Password"
                            placeholderTextColor={colors.gray}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleChangePassword}
                            disabled={isChangingPassword}
                        >
                            <Text style={styles.submitButtonText}>
                                {isChangingPassword ? 'Changing...' : 'Change Password'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={() => setShowPasswordModal(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
                        </TouchableOpacity>
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
    content: {
        padding: 16,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    settingText: {
        flex: 1,
        fontSize: 16,
    },
    settingSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    settingValue: {
        fontSize: 14,
        marginTop: 2,
    },
    linkContainer: {
        padding: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
        marginBottom: 40,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    durationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    durationOptionText: {
        fontSize: 16,
    },
    cancelButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        textAlign: 'center',
    },
    // Input styles
    input: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        fontSize: 16,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default SettingsScreen;
