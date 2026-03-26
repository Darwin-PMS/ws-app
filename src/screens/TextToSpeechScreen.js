import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const TextToSpeechScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const [text, setText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);

    const speak = () => {
        if (!text.trim()) { Alert.alert('Error', 'Please enter some text'); return; }
        setIsSpeaking(true);
        Speech.speak(text, { rate, pitch, onDone: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
    };

    const stop = () => { Speech.stop(); setIsSpeaking(false); };
    const clearText = () => { setText(''); stop(); };

    const sampleTexts = ['Hello! This is a sample text to speech conversion.', 'Welcome to the Women Safety app. Stay safe and connected.', 'Remember to check on your family members regularly.'];

    const presets = [
        { label: 'Slow', rate: 0.5, pitch: 0.8, color: '#3B82F6' },
        { label: 'Normal', rate: 1.0, pitch: 1.0, color: '#10B981' },
        { label: 'Fast', rate: 1.5, pitch: 1.2, color: '#F59E0B' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#EC4899' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="volume-high" size={36} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Text to Speech</Text>
                    <Text style={styles.headerSubtitle}>Convert text to spoken words</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.presetsRow}>
                    {presets.map((preset) => (
                        <TouchableOpacity key={preset.label} style={[styles.presetBtn, { backgroundColor: preset.color + '20', borderColor: preset.color }]} onPress={() => { setRate(preset.rate); setPitch(preset.pitch); }}>
                            <Text style={[styles.presetLabel, { color: preset.color }]}>{preset.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.inputCard, { backgroundColor: colors.card, ...shadows.md }]}>
                    <TextInput style={[styles.input, { color: colors.text }]} placeholder="Enter text to speak..." placeholderTextColor={colors.gray} value={text} onChangeText={setText} multiline numberOfLines={5} maxLength={500} />
                    <Text style={[styles.charCount, { color: colors.gray }]}>{text.length}/500</Text>
                </View>

                <View style={[styles.controlCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                    <View style={styles.sliderRow}>
                        <View style={styles.sliderHeader}>
                            <Ionicons name="speedometer" size={18} color={colors.primary} />
                            <Text style={[styles.sliderLabel, { color: colors.text }]}>Speed</Text>
                            <Text style={[styles.sliderValue, { color: colors.primary }]}>{rate.toFixed(1)}x</Text>
                        </View>
                        <Slider value={rate} onValueChange={setRate} minimumValue={0.5} maximumValue={2.0} step={0.1} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} />
                    </View>
                    <View style={styles.sliderRow}>
                        <View style={styles.sliderHeader}>
                            <Ionicons name="musical-notes" size={18} color={colors.primary} />
                            <Text style={[styles.sliderLabel, { color: colors.text }]}>Pitch</Text>
                            <Text style={[styles.sliderValue, { color: colors.primary }]}>{pitch.toFixed(1)}</Text>
                        </View>
                        <Slider value={pitch} onValueChange={setPitch} minimumValue={0.5} maximumValue={2.0} step={0.1} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} />
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.mainBtn, { backgroundColor: isSpeaking ? '#EF4444' : '#EC4899' }]} onPress={isSpeaking ? stop : speak}>
                        <Ionicons name={isSpeaking ? 'stop' : 'volume-high'} size={26} color="#fff" />
                        <Text style={styles.mainBtnText}>{isSpeaking ? 'Stop' : 'Speak'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.clearBtn, { borderColor: colors.border }]} onPress={clearText}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sample Texts</Text>
                {sampleTexts.map((sample, i) => (
                    <TouchableOpacity key={i} style={[styles.sampleCard, { backgroundColor: colors.card, ...shadows.sm }]} onPress={() => setText(sample)}>
                        <Ionicons name="document-text-outline" size={20} color={colors.gray} />
                        <Text style={[styles.sampleText, { color: colors.gray }]} numberOfLines={2}>{sample}</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerContent: { alignItems: 'center', paddingTop: 40 },
    headerIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    presetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    presetLabel: { fontSize: 13, fontWeight: '600' },
    inputCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
    input: { fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
    charCount: { fontSize: 12, textAlign: 'right', marginTop: 8 },
    controlCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
    sliderRow: { marginBottom: 12 },
    sliderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    sliderLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
    sliderValue: { fontSize: 14, fontWeight: '600' },
    actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    mainBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    clearBtn: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    sampleCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, gap: 12 },
    sampleText: { flex: 1, fontSize: 13 },
    bottomPadding: { height: 30 },
});

export default TextToSpeechScreen;
