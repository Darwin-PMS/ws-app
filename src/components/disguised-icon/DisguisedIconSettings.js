import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    DISGUISE_OPTIONS,
    getDisguiseConfig,
    setDisguise,
    setDisguiseEnabled,
    getIconChangeInstructions,
} from '../../utils/DisguisedIconManager';

// Icon mapping for Ionicons
const ICON_MAP = {
    'shield-check': 'shield-checkmark',
    'calculator': 'calculator',
    'note-text': 'document-text',
    'weather-cloudy': 'cloudy',
    'calendar': 'calendar',
    'heart-pulse': 'heart',
    'music': 'musical-notes',
    'cart': 'cart',
};

/**
 * DisguisedIconSettings - Component for managing app icon disguises
 * 
 * Features:
 * - Toggle disguise mode on/off
 * - Select from multiple disguise options
 * - View instructions for changing icon on device
 * - Quick disguise suggestions
 */
const DisguisedIconSettings = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    const [isEnabled, setIsEnabled] = useState(false);
    const [selectedDisguise, setSelectedDisguise] = useState(DISGUISE_OPTIONS[0]);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        loadDisguiseConfig();
    }, []);

    const loadDisguiseConfig = async () => {
        const config = await getDisguiseConfig();
        setIsEnabled(config.isEnabled);
        setSelectedDisguise(config.disguise);
    };

    const handleToggleEnabled = async (value) => {
        setIsEnabled(value);
        await setDisguiseEnabled(value);
    };

    const handleSelectDisguise = async (disguise) => {
        setSelectedDisguise(disguise);
        await setDisguise(disguise.id);
        Alert.alert(
            'Disguise Selected',
            `You have selected "${disguise.name}" disguise. Go to your device settings to change the app icon.`,
            [{ text: 'OK' }]
        );
    };

    const handleShowInstructions = () => {
        setShowInstructions(true);
    };

    const renderDisguiseItem = (disguise) => {
        const isSelected = selectedDisguise.id === disguise.id;
        const iconName = ICON_MAP[disguise.icon] || 'help-circle';

        return (
            <TouchableOpacity
                key={disguise.id}
                style={[
                    styles.disguiseItem,
                    isSelected && styles.disguiseItemSelected,
                ]}
                onPress={() => handleSelectDisguise(disguise)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: disguise.color }]}>
                    <Ionicons name={iconName} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.disguiseInfo}>
                    <Text style={styles.disguiseName}>{disguise.name}</Text>
                    <Text style={styles.disguiseDescription}>{disguise.description}</Text>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
            </TouchableOpacity>
        );
    };

    const instructions = getIconChangeInstructions(Platform.OS);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Disguised App Icon</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <Text style={styles.infoText}>
                            Disguise your app to appear as another application for your safety.
                            The app will look like a different app on your phone.
                        </Text>
                    </View>

                    {/* Enable/Disable Toggle */}
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleTitle}>Enable Disguise Mode</Text>
                            <Text style={styles.toggleSubtitle}>
                                {isEnabled ? 'Your app is currently disguised' : 'Turn on to disguise your app'}
                            </Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggleEnabled}
                            trackColor={{ false: '#374151', true: '#10B981' }}
                            thumbColor={isEnabled ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {/* Selected Disguise Preview */}
                    {isEnabled && (
                        <View style={styles.previewSection}>
                            <Text style={styles.sectionTitle}>Current Disguise</Text>
                            <View style={styles.previewCard}>
                                <View style={[styles.previewIcon, { backgroundColor: selectedDisguise.color }]}>
                                    <Ionicons
                                        name={ICON_MAP[selectedDisguise.icon] || 'help-circle'}
                                        size={32}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <Text style={styles.previewName}>{selectedDisguise.name}</Text>
                                <Text style={styles.previewDescription}>{selectedDisguise.description}</Text>
                            </View>
                        </View>
                    )}

                    {/* Available Disguises */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Available Disguises</Text>
                        {DISGUISE_OPTIONS.map(renderDisguiseItem)}
                    </View>

                    {/* Instructions Button */}
                    <TouchableOpacity
                        style={styles.instructionsButton}
                        onPress={handleShowInstructions}
                    >
                        <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
                        <Text style={styles.instructionsButtonText}>
                            How to Change App Icon
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                    </TouchableOpacity>

                    {/* Safety Tips */}
                    <View style={styles.tipsSection}>
                        <Text style={styles.tipsTitle}>Safety Tips</Text>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                            <Text style={styles.tipText}>Choose a disguise that matches your daily apps</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                            <Text style={styles.tipText}>Test the disguise in front of someone you trust first</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                            <Text style={styles.tipText}>Remember your emergency contacts even when disguised</Text>
                        </View>
                    </View>

                    <View style={styles.bottomPadding} />
                </ScrollView>

                {/* Instructions Modal */}
                <Modal
                    visible={showInstructions}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setShowInstructions(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setShowInstructions(false)}>
                        <View style={styles.instructionsModal}>
                            <View style={styles.instructionsHeader}>
                                <Text style={styles.instructionsTitle}>{instructions?.title}</Text>
                                <TouchableOpacity onPress={() => setShowInstructions(false)}>
                                    <Ionicons name="close" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.instructionsContent}>
                                {instructions?.steps.map((step, index) => (
                                    <View key={index} style={styles.instructionStep}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowInstructions(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F14',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1E3A5F',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#93C5FD',
        lineHeight: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1F2937',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    toggleSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
    },
    previewSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    previewCard: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    previewIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    previewName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    previewDescription: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    disguiseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    disguiseItemSelected: {
        borderWidth: 2,
        borderColor: '#10B981',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disguiseInfo: {
        flex: 1,
        marginLeft: 12,
    },
    disguiseName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disguiseDescription: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    instructionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E3A5F',
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
    },
    instructionsButtonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#3B82F6',
    },
    tipsSection: {
        backgroundColor: '#1F2937',
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#D1D5DB',
    },
    bottomPadding: {
        height: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    instructionsModal: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        width: '100%',
        maxWidth: 340,
        overflow: 'hidden',
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    instructionsTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    instructionsContent: {
        padding: 16,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#D1D5DB',
        lineHeight: 20,
    },
    modalCloseButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default DisguisedIconSettings;
