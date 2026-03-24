import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import volumeButtonService from '../services/volumeButtonService';

const VolumeButtonScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({ requiredPresses: 5, timeWindow: 2000 });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const enabled = await volumeButtonService.isVolumeButtonEnabled();
            const serviceConfig = volumeButtonService.getConfig();
            
            setIsEnabled(enabled);
            setConfig(serviceConfig);
        } catch (error) {
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (value) => {
        try {
            if (value) {
                const result = await volumeButtonService.enableVolumeButton();
                if (result.success) {
                    setIsEnabled(true);
                    Alert.alert('Success', 'Volume button trigger enabled!\n\nPress volume button 5 times quickly to trigger SOS.');
                } else {
                    Alert.alert('Error', result.error);
                }
            } else {
                const result = await volumeButtonService.disableVolumeButton();
                if (result.success) {
                    setIsEnabled(false);
                    Alert.alert('Success', 'Volume button trigger disabled');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        }
    };

    const testTrigger = () => {
        Alert.alert(
            'Test Volume Button',
            `To test:\n\n1. Press your device's volume UP or DOWN button\n2. Press it ${config.requiredPresses} times within ${config.timeWindow / 1000} seconds\n3. SOS will be triggered`,
            [{ text: 'OK' }]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Ionicons name="volume-high-outline" size={32} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                        Volume Button Trigger
                    </Text>
                    <Text style={[styles.infoText, { color: colors.gray }]}>
                        Press the volume button {config.requiredPresses} times quickly to trigger SOS. This works even when the screen is off.
                    </Text>
                </View>

                {/* Enable Toggle */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="power-outline" size={24} color={colors.primary} />
                            <Text style={[styles.rowTitle, { color: colors.text }]}>
                                Enable Volume Trigger
                            </Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggle}
                        />
                    </View>
                </View>

                {/* Configuration */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        CONFIGURATION
                    </Text>
                    
                    <View style={styles.configItem}>
                        <View style={styles.configLeft}>
                            <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                            <Text style={[styles.configText, { color: colors.text }]}>
                                Required Presses
                            </Text>
                        </View>
                        <View style={[styles.configBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.configBadgeText, { color: colors.primary }]}>
                                {config.requiredPresses} times
                            </Text>
                        </View>
                    </View>

                    <View style={styles.configItem}>
                        <View style={styles.configLeft}>
                            <Ionicons name="timer-outline" size={20} color={colors.primary} />
                            <Text style={[styles.configText, { color: colors.text }]}>
                                Time Window
                            </Text>
                        </View>
                        <View style={[styles.configBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.configBadgeText, { color: colors.primary }]}>
                                {config.timeWindow / 1000} seconds
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Instructions */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        HOW IT WORKS
                    </Text>
                    
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Enable volume button trigger from the toggle above
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Press volume UP or DOWN button {config.requiredPresses} times
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Complete all presses within {config.timeWindow / 1000} seconds
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            SOS will trigger automatically
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Works even when screen is off or app is in background
                        </Text>
                    </View>
                </View>

                {/* Test Button */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        TEST
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.secondary || colors.primary }]}
                        onPress={testTrigger}
                    >
                        <Ionicons name="information-circle-outline" size={20} color={colors.white} />
                        <Text style={styles.buttonText}>How to Test</Text>
                    </TouchableOpacity>
                </View>

                {/* Warning */}
                <View style={[styles.warningCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                    <Ionicons name="warning-outline" size={24} color={colors.warning} />
                    <Text style={[styles.warningText, { color: colors.warning }]}>
                        Make sure to test this feature in a safe environment. Accidental triggers may notify your emergency contacts.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    infoCard: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 16,
        marginLeft: 12,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    configLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configText: {
        fontSize: 15,
        marginLeft: 10,
    },
    configBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    configBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 8,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});

export default VolumeButtonScreen;
