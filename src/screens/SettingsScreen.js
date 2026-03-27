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
import settingsService from '../services/settingsService';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

const CATEGORY_COLORS = {
    Permissions: '#3B82F6',
    Appearance: '#8B5CF6',
    'Location & Sharing': '#10B981',
    Security: '#EF4444',
    'SOS Settings': '#F59E0B',
    Notifications: '#EC4899',
    'Safety Resources': '#14B8A6',
    About: '#6B7280',
};

const SettingsScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows, isDark, toggleTheme } = useTheme();
    const { logout, userId } = useApp();

    const [userSettings, setUserSettings] = useState({
        location_sharing: true, notification_enabled: true, auto_sos: false,
        shake_to_sos: false, sos_timer: 30, volume_press_enabled: false,
        power_press_enabled: false, voice_enabled: false, auto_sos_enabled: false,
        location_enabled: true, family_agent_enabled: true,
    });

    const [locationPermission, setLocationPermission] = useState('undetermined');
    const [cameraPermission, setCameraPermission] = useState('undetermined');
    const [microphonePermission, setMicrophonePermission] = useState('undetermined');
    const [notificationPermission, setNotificationPermission] = useState('undetermined');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometric');
    const [silentMode, setSilentMode] = useState(false);
    const [vibrationMode, setVibrationMode] = useState(true);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [groqApiKey, setGroqApiKey] = useState('');
    const [silentDuration, setSilentDuration] = useState(0);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const durationOptions = [
        { id: 15, label: '15 minutes' }, { id: 30, label: '30 minutes' },
        { id: 60, label: '1 hour' }, { id: 120, label: '2 hours' },
        { id: 480, label: '8 hours' }, { id: 0, label: 'Until turned off' },
    ];

    const sosTimerOptions = [
        { id: 10, label: '10 seconds' }, { id: 30, label: '30 seconds' },
        { id: 60, label: '1 minute' }, { id: 120, label: '2 minutes' },
    ];

    useEffect(() => {
        checkBiometricStatus();
        loadSilentVibrationSettings();
        loadUserSettings();
        checkPermissions();
        loadGroqApiKey();
    }, []);

    const loadGroqApiKey = async () => {
        try {
            const key = await settingsService.getGroqApiKey();
            if (key) setGroqApiKey(key);
        } catch (error) {
            console.log('Error loading Groq API key:', error);
        }
    };

    const handleSaveApiKey = async () => {
        if (!groqApiKey.trim()) {
            Alert.alert('Error', 'Please enter a valid API key');
            return;
        }
        const success = await settingsService.saveGroqApiKey(groqApiKey.trim());
        if (success) {
            Alert.alert('Success', 'Groq API key saved successfully');
            setShowApiKeyModal(false);
        } else {
            Alert.alert('Error', 'Failed to save API key');
        }
    };

    const handleClearApiKey = async () => {
        Alert.alert('Clear API Key', 'Are you sure you want to remove your Groq API key?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: async () => {
                await settingsService.clearLocalGroqKey();
                setGroqApiKey('');
                Alert.alert('Success', 'API key removed');
            }},
        ]);
    };

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
        } catch (error) { console.log('Error checking permissions:', error); }
    };

    const requestPermission = async (permission, type) => {
        try {
            let status;
            switch (type) {
                case 'location': const locationResult = await Location.requestForegroundPermissionsAsync(); status = locationResult.status; break;
                case 'camera': const cameraResult = await Camera.requestCameraPermissionsAsync(); status = cameraResult.status; break;
                case 'microphone': const audioResult = await Audio.requestPermissionsAsync(); status = audioResult.status; break;
                case 'notification': const notifResult = await Notifications.requestPermissionsAsync(); status = notifResult.status; break;
            }
            if (type === 'location') setLocationPermission(status);
            if (type === 'camera') setCameraPermission(status);
            if (type === 'microphone') setMicrophonePermission(status);
            if (type === 'notification') setNotificationPermission(status);
            if (status === 'granted') Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} permission granted`);
            else Alert.alert('Permission Denied', `Please enable ${type} permission in your device settings`);
        } catch (error) { console.log('Error requesting permission:', error); }
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
        } catch (error) { console.log('Error loading user settings:', error); }
    };

    const updateUserSetting = async (key, value) => {
        try {
            const settingsToUpdate = { [key]: value ? 1 : 0 };
            const response = await userService.updateUserSettings(userId, settingsToUpdate);
            if (response.success) setUserSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) { Alert.alert('Error', 'Failed to update setting'); }
    };

    const checkBiometricStatus = async () => {
        try {
            const result = await biometricService.initialize();
            const isEnabled = await biometricService.isBiometricEnabled();
            setBiometricAvailable(result.available && result.enrolled);
            setBiometricEnabled(isEnabled);
            if (result.types && result.types.length > 0) {
                if (result.types.includes(1)) setBiometricType('Face ID');
                else if (result.types.includes(2)) setBiometricType('Fingerprint');
            }
        } catch (error) { console.log('Biometric check error:', error); }
    };

    const loadSilentVibrationSettings = async () => {
        try {
            const settings = await silentModeService.getSettings();
            setSilentMode(settings.silentMode);
            setVibrationMode(settings.vibrationMode);
        } catch (error) { console.log('Error loading silent/vibration settings:', error); }
    };

    const handleSilentModeToggle = async (value) => {
        if (value) setShowDurationModal(true);
        else {
            await silentModeService.setSilentMode(false);
            setSilentMode(false);
            Alert.alert('Silent Mode', 'Silent mode disabled');
        }
    };

    const handleDurationSelect = async (duration) => {
        setSilentDuration(duration);
        await silentModeService.setSilentMode(true, duration);
        setSilentMode(true);
        setShowDurationModal(false);
        const durationText = duration === 0 ? 'Until turned off' : `${duration} minutes`;
        Alert.alert('Silent Mode', `Silent mode enabled for ${durationText}`);
    };

    const handleVibrationModeToggle = async (value) => {
        await silentModeService.setVibrationMode(value);
        setVibrationMode(value);
    };

    const handleBiometricToggle = async (value) => {
        if (value) {
            const result = await biometricService.enableBiometric(userId, null);
            if (result.success) {
                setBiometricEnabled(true);
                Alert.alert('Success', `${biometricType} login enabled successfully!`);
            } else Alert.alert('Error', result.error || 'Failed to enable biometric login');
        } else {
            Alert.alert('Disable Biometric', 'Are you sure you want to disable biometric login?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Disable', style: 'destructive', onPress: async () => {
                    const result = await biometricService.disableBiometric();
                    if (result.success) { setBiometricEnabled(false); Alert.alert('Success', 'Biometric login disabled'); }
                    else Alert.alert('Error', 'Failed to disable biometric login');
                }},
            ]);
        }
    };

    const handleSOSSettingChange = async (key, value) => {
        try {
            const settingsToUpdate = { [key]: value ? 1 : 0 };
            const response = await userService.updateUserSettings(userId, settingsToUpdate);
            if (response.success) {
                setUserSettings(prev => ({ ...prev, [key]: value }));
                if (key === 'sos_timer') Alert.alert('SOS Timer', `Timer set to ${value} seconds`);
            }
        } catch (error) { console.log('Error updating SOS setting:', error); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return; }
        if (newPassword !== confirmPassword) { Alert.alert('Error', 'New passwords do not match'); return; }
        if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
        setIsChangingPassword(true);
        try {
            const response = await userService.updateProfile(userId, { currentPassword, newPassword });
            if (response.success) {
                Alert.alert('Success', 'Password changed successfully');
                setShowPasswordModal(false);
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else Alert.alert('Error', response.message || 'Failed to change password');
        } catch (error) { Alert.alert('Error', 'Failed to change password'); }
        finally { setIsChangingPassword(false); }
    };

    const getPermissionStatus = (status) => status === 'granted' ? 'Granted' : status === 'denied' ? 'Denied' : 'Not Set';
    const getPermissionColor = (status) => status === 'granted' ? colors.success : status === 'denied' ? colors.error : colors.warning;

    const settingsGroups = [
        { title: 'Permissions', items: [
            { id: 'location', title: 'Location', icon: 'location-outline', type: 'permission', status: locationPermission, onPress: () => requestPermission(null, 'location') },
            { id: 'camera', title: 'Camera', icon: 'camera-outline', type: 'permission', status: cameraPermission, onPress: () => requestPermission(null, 'camera') },
            { id: 'microphone', title: 'Microphone', icon: 'mic-outline', type: 'permission', status: microphonePermission, onPress: () => requestPermission(null, 'microphone') },
            { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', type: 'permission', status: notificationPermission, onPress: () => requestPermission(null, 'notification') },
        ]},
        { title: 'Appearance', items: [
            { id: 'darkMode', title: 'Dark Mode', icon: 'moon-outline', type: 'switch', value: isDark, onValueChange: toggleTheme },
        ]},
        { title: 'Location & Sharing', items: [
            { id: 'location_enabled', title: 'Location Tracking', icon: 'location-outline', type: 'switch', value: userSettings.location_enabled, onValueChange: (val) => updateUserSetting('location_enabled', val) },
            { id: 'location_sharing', title: 'Share Location', icon: 'share-outline', type: 'switch', value: userSettings.location_sharing, onValueChange: (val) => updateUserSetting('location_sharing', val) },
            { id: 'family_agent_enabled', title: 'Family Agent', icon: 'people-outline', type: 'switch', value: userSettings.family_agent_enabled, onValueChange: (val) => updateUserSetting('family_agent_enabled', val) },
        ]},
        { title: 'Security', items: [
            { id: 'biometric', title: `${biometricType} Login`, icon: biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline', type: biometricAvailable ? 'switch' : 'info', value: biometricEnabled, onValueChange: handleBiometricToggle, disabled: !biometricAvailable },
            { id: 'profile', title: 'Edit Profile', icon: 'person-outline', type: 'link', onPress: () => navigation.navigate('Profile') },
            { id: 'password', title: 'Change Password', icon: 'lock-closed-outline', type: 'link', onPress: () => setShowPasswordModal(true) },
        ]},
        { title: 'SOS Settings', items: [
            { id: 'auto_sos', title: 'Auto SOS', icon: 'warning-outline', type: 'switch', value: userSettings.auto_sos, onValueChange: (val) => updateUserSetting('auto_sos', val) },
            { id: 'shake_to_sos', title: 'Shake to SOS', icon: 'phone-landscape-outline', type: 'switch', value: userSettings.shake_to_sos, onValueChange: (val) => updateUserSetting('shake_to_sos', val) },
            { id: 'sos_timer', title: 'SOS Timer', icon: 'timer-outline', type: 'link', onPress: () => setShowSOSModal(true), value: `${userSettings.sos_timer}s` },
            { id: 'volume_press', title: 'Volume Press SOS', icon: 'volume-high-outline', type: 'switch', value: userSettings.volume_press_enabled, onValueChange: (val) => updateUserSetting('volume_press_enabled', val) },
            { id: 'power_press', title: 'Power Press SOS', icon: 'power-outline', type: 'switch', value: userSettings.power_press_enabled, onValueChange: (val) => updateUserSetting('power_press_enabled', val) },
        ]},
        { title: 'Notifications', items: [
            { id: 'notification_enabled', title: 'Push Notifications', icon: 'notifications-outline', type: 'switch', value: userSettings.notification_enabled, onValueChange: (val) => updateUserSetting('notification_enabled', val) },
            { id: 'silentMode', title: 'Silent Mode', icon: 'volume-mute-outline', type: 'switch', value: silentMode, onValueChange: handleSilentModeToggle },
            { id: 'vibrationMode', title: 'Vibration', icon: 'phone-portrait-outline', type: 'switch', value: vibrationMode, onValueChange: handleVibrationModeToggle },
        ]},
        { title: 'AI Settings', items: [
            { id: 'groq_api_key', title: 'Groq API Key', icon: 'key-outline', type: 'link', onPress: () => setShowApiKeyModal(true), value: groqApiKey ? 'Configured' : 'Not Set' },
        ]},
        { title: 'Safety Resources', items: [
            { id: 'helpline', title: 'Emergency Helplines', icon: 'call-outline', type: 'link', onPress: () => navigation.navigate('EmergencyHelpline') },
            { id: 'grievance', title: 'File Complaint', icon: 'document-text-outline', type: 'link', onPress: () => navigation.navigate('Grievance') },
        ]},
        { title: 'About', items: [
            { id: 'about', title: 'About App', icon: 'information-circle-outline', type: 'link', onPress: () => navigation.navigate('AboutApp') },
            { id: 'privacy', title: 'Privacy Policy', icon: 'shield-outline', type: 'link', onPress: () => navigation.navigate('PrivacyPolicy') },
            { id: 'terms', title: 'Terms of Service', icon: 'document-text-outline', type: 'link', onPress: () => navigation.navigate('TermsOfService') },
        ]},
    ];

    const renderItem = (item, index, total) => {
        const isLast = index === total - 1;
        const categoryColor = CATEGORY_COLORS[item.groupTitle] || colors.primary;

        if (item.type === 'permission') {
            return (
                <TouchableOpacity key={item.id} style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]} onPress={item.onPress}>
                    <View style={[styles.itemIcon, { backgroundColor: getPermissionColor(item.status) + '15' }]}>
                        <Ionicons name={item.icon} size={20} color={getPermissionColor(item.status)} />
                    </View>
                    <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.settingSubtext, { color: getPermissionColor(item.status) }]}>{getPermissionStatus(item.status)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>
            );
        }

        if (item.type === 'link') {
            return (
                <TouchableOpacity key={item.id} style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]} onPress={item.onPress}>
                    <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
                        {item.value && <Text style={[styles.settingValue, { color: colors.primary }]}>{item.value}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>
            );
        }

        if (item.type === 'info') {
            return (
                <View key={item.id} style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]}>
                    <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
                        {item.value && <Text style={[styles.settingValue, { color: colors.primary }]}>{item.value}</Text>}
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity 
                key={item.id} 
                style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderColor: colors.border }]} 
                onPress={item.onPress}
                disabled={item.disabled || item.type === 'switch'}
            >
                <View style={[styles.itemIcon, { backgroundColor: item.disabled ? colors.gray + '15' : colors.primary + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.disabled ? colors.gray : colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingText, { color: item.disabled ? colors.gray : colors.text }]}>{item.title}</Text>
                    {item.value !== undefined && item.type !== 'switch' && item.type !== 'permission' && (
                        <Text style={[styles.settingValue, { color: colors.primary }]}>{item.value}</Text>
                    )}
                </View>
                {item.type === 'switch' ? (
                    <Switch value={item.value} onValueChange={item.onValueChange} disabled={item.disabled} trackColor={{ true: colors.primary + '60' }} thumbColor={item.value ? colors.primary : colors.gray + '50'} />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                )}
            </TouchableOpacity>
        );
    };

    const ModalOption = ({ option, isSelected, onPress }) => (
        <TouchableOpacity style={[styles.optionItem, isSelected && { backgroundColor: colors.primary + '15' }]} onPress={onPress}>
            <Text style={[styles.optionText, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: '600' }]}>{option.label}</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Customize your experience</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {settingsGroups.map((group) => (
                    <View key={group.title} style={styles.groupSection}>
                        <View style={styles.groupHeader}>
                            <View style={[styles.groupIcon, { backgroundColor: (CATEGORY_COLORS[group.title] || colors.primary) + '20' }]}>
                                <Ionicons name={group.title === 'Permissions' ? 'key' : group.title === 'Appearance' ? 'color-palette' : group.title === 'Security' ? 'shield' : group.title === 'SOS Settings' ? 'warning' : group.title === 'Notifications' ? 'notifications' : group.title === 'About' ? 'information-circle' : 'settings'} size={16} color={CATEGORY_COLORS[group.title] || colors.primary} />
                            </View>
                            <Text style={[styles.groupTitle, { color: colors.text }]}>{group.title}</Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: colors.card, ...shadows.md }]}>
                            {group.items.map((item, index) => renderItem(item, index, group.items.length))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.error }]} onPress={() => Alert.alert('Logout', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: logout },
                ])}>
                    <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>

            <Modal visible={showDurationModal} animationType="slide" transparent onRequestClose={() => setShowDurationModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Duration</Text>
                        {durationOptions.map((option) => <ModalOption key={option.id} option={option} isSelected={silentDuration === option.id} onPress={() => handleDurationSelect(option.id)} />)}
                        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setShowDurationModal(false)}><Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showSOSModal} animationType="slide" transparent onRequestClose={() => setShowSOSModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>SOS Timer</Text>
                        {sosTimerOptions.map((option) => <ModalOption key={option.id} option={option} isSelected={userSettings.sos_timer === option.id} onPress={() => { handleSOSSettingChange('sos_timer', option.id); setShowSOSModal(false); }} />)}
                        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setShowSOSModal(false)}><Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPasswordModal} animationType="slide" transparent onRequestClose={() => setShowPasswordModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
                            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Current Password" placeholderTextColor={colors.gray} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                        </View>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
                            <TextInput style={[styles.input, { color: colors.text }]} placeholder="New Password" placeholderTextColor={colors.gray} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                        </View>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
                            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Confirm Password" placeholderTextColor={colors.gray} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                        </View>
                        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleChangePassword} disabled={isChangingPassword}>
                            <Text style={styles.submitButtonText}>{isChangingPassword ? 'Changing...' : 'Change Password'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setShowPasswordModal(false)}><Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showApiKeyModal} animationType="slide" transparent onRequestClose={() => setShowApiKeyModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Groq API Key</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>Enter your Groq API key to enable AI features like Vision analysis.</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Ionicons name="key-outline" size={20} color={colors.gray} />
                            <TextInput style={[styles.input, { color: colors.text }]} placeholder="gsk_..." placeholderTextColor={colors.gray} value={groqApiKey} onChangeText={setGroqApiKey} autoCapitalize="none" autoCorrect={false} secureTextEntry />
                        </View>
                        <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#8B5CF6' }]} onPress={handleSaveApiKey}>
                            <Text style={styles.submitButtonText}>Save API Key</Text>
                        </TouchableOpacity>
                        {groqApiKey ? (
                            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.error, marginTop: 8 }]} onPress={handleClearApiKey}>
                                <Text style={[styles.cancelButtonText, { color: colors.error }]}>Remove API Key</Text>
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border, marginTop: 8 }]} onPress={() => setShowApiKeyModal(false)}>
                            <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    scrollView: { flex: 1 },
    groupSection: { paddingHorizontal: 16, marginTop: 20 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 4 },
    groupIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    groupTitle: { fontSize: 16, fontWeight: '700', marginLeft: 10 },
    card: { borderRadius: 16, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
    itemIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingTextContainer: { flex: 1, marginLeft: 12 },
    settingText: { fontSize: 15, fontWeight: '500' },
    settingSubtext: { fontSize: 12, marginTop: 2 },
    settingValue: { fontSize: 13, marginTop: 2 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 32, padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
    logoutText: { fontSize: 16, fontWeight: '600' },
    bottomPadding: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, marginBottom: 16 },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
    optionText: { fontSize: 16 },
    cancelButton: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8 },
    cancelButtonText: { fontSize: 16, textAlign: 'center' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, marginBottom: 12 },
    input: { flex: 1, fontSize: 16, marginLeft: 10, paddingVertical: 14 },
    submitButton: { padding: 16, borderRadius: 12, marginTop: 8 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

export default SettingsScreen;
