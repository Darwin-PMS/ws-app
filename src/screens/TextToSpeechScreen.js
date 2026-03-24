import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';

const TextToSpeechScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [text, setText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);

    const speak = () => {
        if (!text.trim()) {
            Alert.alert('Error', 'Please enter some text');
            return;
        }

        setIsSpeaking(true);
        Speech.speak(text, {
            rate,
            pitch,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const stop = () => {
        Speech.stop();
        setIsSpeaking(false);
    };

    const clearText = () => {
        setText('');
        stop();
    };

    const sampleTexts = [
        'Hello! This is a sample text to speech conversion.',
        'Welcome to the Women Safety app. Stay safe and connected.',
        'Remember to check on your family members regularly.',
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="volume-high" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Text to Speech</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Convert text to spoken words
                </Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter text to speak..."
                        placeholderTextColor={colors.gray}
                        value={text}
                        onChangeText={setText}
                        multiline
                        numberOfLines={6}
                        maxLength={500}
                    />
                    <Text style={[styles.charCount, { color: colors.gray }]}>{text.length}/500</Text>
                </View>

                <View style={styles.controlsContainer}>
                    <View style={styles.sliderContainer}>
                        <Text style={[styles.sliderLabel, { color: colors.text }]}>Speed: {rate.toFixed(1)}x</Text>
                        <Slider
                            value={rate}
                            onValueChange={setRate}
                            minimumValue={0.5}
                            maximumValue={2.0}
                            step={0.1}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                        />
                    </View>

                    <View style={styles.sliderContainer}>
                        <Text style={[styles.sliderLabel, { color: colors.text }]}>Pitch: {pitch.toFixed(1)}</Text>
                        <Slider
                            value={pitch}
                            onValueChange={setPitch}
                            minimumValue={0.5}
                            maximumValue={2.0}
                            step={0.1}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                        />
                    </View>
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.speakButton, { backgroundColor: isSpeaking ? colors.error : colors.primary }]}
                        onPress={isSpeaking ? stop : speak}
                    >
                        <Ionicons
                            name={isSpeaking ? 'stop' : 'volume-high'}
                            size={24}
                            color={colors.white}
                        />
                        <Text style={[styles.speakButtonText, { color: colors.white }]}>
                            {isSpeaking ? 'Stop' : 'Speak'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.clearButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={clearText}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                        <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.samplesTitle, { color: colors.text }]}>Sample Texts:</Text>
                <View style={styles.samplesContainer}>
                    {sampleTexts.map((sample, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.sampleChip, { backgroundColor: colors.card, borderRadius }]}
                            onPress={() => setText(sample)}
                        >
                            <Text style={[styles.sampleText, { color: colors.gray }]} numberOfLines={1}>
                                {sample}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
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
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
    },
    input: {
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    controlsContainer: {
        marginBottom: 24,
    },
    sliderContainer: {
        marginBottom: 16,
    },
    sliderLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    speakButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
    },
    speakButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 24,
        gap: 8,
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    samplesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    samplesContainer: {
        gap: 8,
    },
    sampleChip: {
        padding: 12,
    },
    sampleText: {
        fontSize: 14,
    },
});

export default TextToSpeechScreen;
