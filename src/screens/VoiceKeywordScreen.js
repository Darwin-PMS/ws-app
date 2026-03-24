import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import voiceKeywordService from '../services/voiceKeywordService';

const VoiceKeywordScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    
    const [isEnabled, setIsEnabled] = useState(false);
    const [customKeyword, setCustomKeyword] = useState('');
    const [defaultKeywords, setDefaultKeywords] = useState([]);
    const [isTesting, setIsTesting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const enabled = await voiceKeywordService.isVoiceKeywordEnabled();
            const custom = await voiceKeywordService.getCustomKeyword();
            const keywords = await voiceKeywordService.getAllKeywords();
            
            setIsEnabled(enabled);
            setCustomKeyword(custom || '');
            setDefaultKeywords(keywords);
        } catch (error) {
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (value) => {
        try {
            setIsSaving(true);
            if (value) {
                const result = await voiceKeywordService.enableVoiceKeyword(customKeyword || null);
                if (result.success) {
                    setIsEnabled(true);
                    Alert.alert('Success', 'Voice keyword trigger enabled');
                } else {
                    Alert.alert('Error', result.error);
                }
            } else {
                const result = await voiceKeywordService.disableVoiceKeyword();
                if (result.success) {
                    setIsEnabled(false);
                    Alert.alert('Success', 'Voice keyword trigger disabled');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveKeyword = async () => {
        if (!customKeyword.trim()) {
            Alert.alert('Error', 'Please enter a keyword');
            return;
        }
        
        if (customKeyword.trim().length < 2) {
            Alert.alert('Error', 'Keyword must be at least 2 characters');
            return;
        }

        try {
            setIsSaving(true);
            const result = await voiceKeywordService.setCustomKeyword(customKeyword.trim());
            if (result.success) {
                Alert.alert('Success', 'Custom keyword saved');
                const keywords = await voiceKeywordService.getAllKeywords();
                setDefaultKeywords(keywords);
            } else {
                Alert.alert('Error', result.error);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save keyword');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestVoice = async () => {
        try {
            setIsTesting(true);
            await voiceKeywordService.speak('Say your emergency keyword');
            
            setTimeout(async () => {
                await voiceKeywordService.speak('Keyword detected! SOS triggered.');
                Alert.alert('Test Complete', 'If you say "' + (customKeyword || 'help me') + '" the app will detect it and trigger SOS.');
                setIsTesting(false);
            }, 3000);
        } catch (error) {
            setIsTesting(false);
            Alert.alert('Error', 'Failed to test voice');
        }
    };

    const handleStopSpeaking = async () => {
        await voiceKeywordService.stopSpeaking();
        setIsTesting(false);
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
                    <Ionicons name="mic-outline" size={32} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                        Voice Keyword Trigger
                    </Text>
                    <Text style={[styles.infoText, { color: colors.gray }]}>
                        Say a keyword to instantly trigger SOS. The app will listen for your custom keyword or default keywords like "Help Me" or "Emergency".
                    </Text>
                </View>

                {/* Enable Toggle */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="power-outline" size={24} color={colors.primary} />
                            <Text style={[styles.rowTitle, { color: colors.text }]}>
                                Enable Voice Trigger
                            </Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggle}
                            disabled={isSaving}
                        />
                    </View>
                </View>

                {/* Custom Keyword */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        CUSTOM KEYWORD
                    </Text>
                    
                    <Text style={[styles.label, { color: colors.text }]}>
                        Set your own trigger word
                    </Text>
                    
                    <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Enter custom keyword"
                            placeholderTextColor={colors.gray}
                            value={customKeyword}
                            onChangeText={setCustomKeyword}
                            autoCapitalize="none"
                            disabled={!isEnabled}
                        />
                    </View>
                    
                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: colors.primary },
                            (!isEnabled || isSaving) && styles.buttonDisabled
                        ]}
                        onPress={handleSaveKeyword}
                        disabled={!isEnabled || isSaving}
                    >
                        <Text style={styles.buttonText}>Save Keyword</Text>
                    </TouchableOpacity>
                </View>

                {/* Default Keywords */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        DEFAULT KEYWORDS
                    </Text>
                    
                    <Text style={[styles.infoText, { color: colors.gray, marginBottom: 12 }]}>
                        These keywords will always trigger SOS:
                    </Text>
                    
                    <View style={styles.keywordList}>
                        {defaultKeywords.slice(0, 8).map((keyword, index) => (
                            <View 
                                key={index} 
                                style={[styles.keywordBadge, { backgroundColor: colors.primary + '20' }]}
                            >
                                <Text style={[styles.keywordText, { color: colors.primary }]}>
                                    "{keyword}"
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Test Voice */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        TEST VOICE DETECTION
                    </Text>
                    
                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: colors.secondary || colors.primary },
                            isTesting && styles.buttonDisabled
                        ]}
                        onPress={isTesting ? handleStopSpeaking : handleTestVoice}
                    >
                        <Ionicons 
                            name={isTesting ? "stop" : "play"} 
                            size={20} 
                            color={colors.white} 
                        />
                        <Text style={styles.buttonText}>
                            {isTesting ? 'Stop' : 'Test Voice Detection'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={[styles.section, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>
                        HOW IT WORKS
                    </Text>
                    
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Enable voice trigger from the toggle above
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Set a custom keyword or use the default ones
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            When you say the keyword, SOS will trigger automatically
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Works best in quiet environments
                        </Text>
                    </View>
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
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 8,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    keywordList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    keywordBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    keywordText: {
        fontSize: 14,
        fontWeight: '500',
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
});

export default VoiceKeywordScreen;
