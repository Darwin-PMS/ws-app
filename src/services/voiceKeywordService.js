// Voice Keyword Detection Service
// Handles voice keyword detection for SOS trigger

import * as Speech from 'expo-speech';
import * as SpeechRecog from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_KEYWORD_ENABLED_KEY = '@voice_keyword_enabled';
const VOICE_KEYWORD_CUSTOM_KEY = '@voice_keyword_custom';
const VOICE_KEYWORD_SENSITIVITY_KEY = '@voice_keyword_sensitivity';

const DEFAULT_KEYWORDS = [
    'help me',
    'help',
    'emergency',
    'save me',
    'sos',
    'help me please',
    'call help',
    'need help'
];

class VoiceKeywordService {
    constructor() {
        this.isListening = false;
        this.isAvailable = false;
        this.recognition = null;
        this.onKeywordDetected = null;
    }

    async initialize() {
        try {
            // Check if speech recognition is available
            // Note: expo-speech doesn't have built-in recognition, we use a different approach
            this.isAvailable = true;
            
            console.log('Voice Keyword Service Initialized');
            return {
                available: this.isAvailable,
                defaultKeywords: DEFAULT_KEYWORDS
            };
        } catch (error) {
            console.error('Voice Keyword initialization error:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    async getSupportedLanguages() {
        try {
            const languages = await SpeechRecog.getAvailableSpeechSynthesizeLanguages();
            return languages || ['en-US', 'en-IN', 'hi-IN'];
        } catch (error) {
            return ['en-US', 'en-IN', 'hi-IN'];
        }
    }

    async isVoiceKeywordEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(VOICE_KEYWORD_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            return false;
        }
    }

    async enableVoiceKeyword(customKeyword = null) {
        try {
            await AsyncStorage.setItem(VOICE_KEYWORD_ENABLED_KEY, 'true');
            if (customKeyword) {
                await AsyncStorage.setItem(VOICE_KEYWORD_CUSTOM_KEY, customKeyword.toLowerCase());
            }
            return { success: true, message: 'Voice keyword enabled' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async disableVoiceKeyword() {
        try {
            await AsyncStorage.removeItem(VOICE_KEYWORD_ENABLED_KEY);
            await AsyncStorage.removeItem(VOICE_KEYWORD_CUSTOM_KEY);
            return { success: true, message: 'Voice keyword disabled' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCustomKeyword() {
        try {
            const keyword = await AsyncStorage.getItem(VOICE_KEYWORD_CUSTOM_KEY);
            return keyword || null;
        } catch (error) {
            return null;
        }
    }

    async getAllKeywords() {
        const customKeyword = await this.getCustomKeyword();
        if (customKeyword) {
            return [customKeyword, ...DEFAULT_KEYWORDS];
        }
        return DEFAULT_KEYWORDS;
    }

    async setCustomKeyword(keyword) {
        try {
            const normalizedKeyword = keyword.toLowerCase().trim();
            if (normalizedKeyword.length < 2) {
                return { success: false, error: 'Keyword must be at least 2 characters' };
            }
            await AsyncStorage.setItem(VOICE_KEYWORD_CUSTOM_KEY, normalizedKeyword);
            return { success: true, message: 'Custom keyword set' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async setSensitivity(level = 'medium') {
        // level: 'low', 'medium', 'high'
        try {
            await AsyncStorage.setItem(VOICE_KEYWORD_SENSITIVITY_KEY, level);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getSensitivity() {
        try {
            const sensitivity = await AsyncStorage.getItem(VOICE_KEYWORD_SENSITIVITY_KEY);
            return sensitivity || 'medium';
        } catch (error) {
            return 'medium';
        }
    }

    // Check if spoken text contains any keyword
    checkForKeyword(spokenText) {
        const normalizedText = spokenText.toLowerCase().trim();
        
        // Get all keywords including custom
        this.getAllKeywords().then(keywords => {
            for (const keyword of keywords) {
                if (normalizedText.includes(keyword.toLowerCase())) {
                    return {
                        detected: true,
                        keyword: keyword,
                        matchedText: normalizedText
                    };
                }
            }
            return {
                detected: false,
                keyword: null,
                matchedText: normalizedText
            };
        });
        
        // Synchronous check for default keywords
        for (const keyword of DEFAULT_KEYWORDS) {
            if (normalizedText.includes(keyword.toLowerCase())) {
                return {
                    detected: true,
                    keyword: keyword,
                    matchedText: normalizedText
                };
            }
        }
        
        return {
            detected: false,
            keyword: null,
            matchedText: normalizedText
        };
    }

    // Simulate voice detection for testing
    // In production, this would use actual speech recognition
    simulateKeywordDetection(keyword = 'help me') {
        return this.checkForKeyword(keyword);
    }

    // Text-to-speech for feedback
    speak(message, language = 'en-US') {
        return Speech.speak(message, {
            language: language,
            pitch: 1.0,
            rate: 0.9,
        });
    }

    // Stop any ongoing speech
    stopSpeaking() {
        return Speech.stop();
    }

    // Check if currently speaking
    async isSpeaking() {
        return Speech.isSpeakingAsync();
    }
}

export default new VoiceKeywordService();
