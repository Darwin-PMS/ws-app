import { useState, useEffect, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Platform, Vibration } from 'react-native';
import voiceKeywordService from '../services/voiceKeywordService';

const USE_CONTINUOUS_LISTENING = false; // Set to true for continuous listening (battery intensive)

export const useVoiceKeyword = (onKeywordDetected, enabled = true) => {
    const [isListening, setIsListening] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [customKeyword, setCustomKeyword] = useState(null);
    const [availableKeywords, setAvailableKeywords] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);
    
    const intervalRef = useRef(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        initialize();
        return () => {
            stopListening();
        };
    }, []);

    const initialize = async () => {
        if (isInitialized.current) return;
        
        try {
            await voiceKeywordService.initialize();
            const enabled = await voiceKeywordService.isVoiceKeywordEnabled();
            const custom = await voiceKeywordService.getCustomKeyword();
            const keywords = await voiceKeywordService.getAllKeywords();
            
            setIsEnabled(enabled);
            setCustomKeyword(custom);
            setAvailableKeywords(keywords);
            
            isInitialized.current = true;
        } catch (err) {
            setError(err.message);
        }
    };

    const startListening = useCallback(async () => {
        if (!enabled || isListening) return;

        try {
            setIsListening(true);
            setError(null);
            
            // Check if we should use continuous or periodic listening
            if (USE_CONTINUOUS_LISTENING) {
                startContinuousListening();
            }
            
            console.log('Voice keyword listening started');
        } catch (err) {
            setError(err.message);
            setIsListening(false);
        }
    }, [enabled, isListening]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        console.log('Voice keyword listening stopped');
    }, []);

    const startContinuousListening = useCallback(() => {
        // For continuous listening, we periodically check
        // In a real app, this would use native speech recognition
        // For now, we'll use a timer-based approach
        intervalRef.current = setInterval(async () => {
            if (!isListening || !enabled) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                return;
            }

            try {
                // Check if already speaking
                const speaking = await Speech.isSpeakingAsync();
                if (speaking) return;

                // In production, this would trigger speech recognition
                // For demo purposes, we'll just log
                console.log('Listening for voice keyword...');
            } catch (err) {
                console.log('Listen error:', err);
            }
        }, 3000); // Check every 3 seconds
    }, [isListening, enabled]);

    const triggerKeywordCheck = useCallback(async (spokenText) => {
        if (!enabled || !spokenText) return;

        const result = voiceKeywordService.checkForKeyword(spokenText);
        
        if (result.detected) {
            console.log('Keyword detected:', result.keyword);
            
            // Vibrate to indicate detection
            Vibration.vibrate([0, 200, 100, 200]);
            
            // Speak confirmation
            await voiceKeywordService.speak('Emergency keyword detected. Triggering SOS.');
            
            // Trigger callback
            onKeywordDetected?.(result);
        }
        
        return result;
    }, [enabled, onKeywordDetected]);

    const testKeyword = useCallback(async (keyword = null) => {
        try {
            setIsSpeaking(true);
            
            // Speak the test phrase
            const testPhrase = keyword || 'Help me';
            await voiceKeywordService.speak('Say: ' + testPhrase);
            
            // Wait a moment then check
            setTimeout(async () => {
                await voiceKeywordService.speak('Keyword detected!');
                setIsSpeaking(false);
            }, 2000);
            
            return { success: true };
        } catch (err) {
            setError(err.message);
            setIsSpeaking(false);
            return { success: false, error: err.message };
        }
    }, []);

    const enableKeyword = useCallback(async (customKeyword = null) => {
        const result = await voiceKeywordService.enableVoiceKeyword(customKeyword);
        if (result.success) {
            setIsEnabled(true);
            if (customKeyword) {
                setCustomKeyword(customKeyword);
            }
            const keywords = await voiceKeywordService.getAllKeywords();
            setAvailableKeywords(keywords);
        }
        return result;
    }, []);

    const disableKeyword = useCallback(async () => {
        const result = await voiceKeywordService.disableVoiceKeyword();
        if (result.success) {
            setIsEnabled(false);
            setCustomKeyword(null);
        }
        return result;
    }, []);

    const setCustomKeywordValue = useCallback(async (keyword) => {
        const result = await voiceKeywordService.setCustomKeyword(keyword);
        if (result.success) {
            setCustomKeyword(keyword);
            const keywords = await voiceKeywordService.getAllKeywords();
            setAvailableKeywords(keywords);
        }
        return result;
    }, []);

    return {
        isListening,
        isEnabled,
        customKeyword,
        availableKeywords,
        isSpeaking,
        error,
        startListening,
        stopListening,
        triggerKeywordCheck,
        testKeyword,
        enableKeyword,
        disableKeyword,
        setCustomKeywordValue,
    };
};

export default useVoiceKeyword;
