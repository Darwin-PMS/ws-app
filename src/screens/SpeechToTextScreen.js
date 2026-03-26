import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SpeechToTextScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const [recording, setRecording] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        } catch (error) {
            console.log('Permission error:', error);
        }
    };

    const startRecording = async () => {
        if (!hasPermission) { Alert.alert('Permission Required', 'Microphone access is needed'); return; }
        try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
            setIsRecording(true);
        } catch (error) { console.error('Failed to start recording:', error); }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        setRecording(null);
        setTranscription('This is a simulated transcription. In production, this would be the actual transcribed text from your speech.');
    };

    const features = [
        { icon: 'mic', label: 'Voice Recognition', desc: 'Powered by AI' },
        { icon: 'language', label: 'Multi-language', desc: 'Supports 50+ languages' },
        { icon: 'speedometer', label: 'Real-time', desc: 'Fast transcription' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#10B981' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="mic" size={36} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Speech to Text</Text>
                    <Text style={styles.headerSubtitle}>Convert your voice to text instantly</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.featuresGrid}>
                    {features.map((feat, i) => (
                        <View key={i} style={[styles.featureCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                            <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                                <Ionicons name={feat.icon} size={22} color="#10B981" />
                            </View>
                            <Text style={[styles.featureLabel, { color: colors.text }]}>{feat.label}</Text>
                            <Text style={[styles.featureDesc, { color: colors.gray }]}>{feat.desc}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.recordBtn, { backgroundColor: isRecording ? '#EF4444' : '#10B981' }]}
                    onPress={isRecording ? stopRecording : startRecording}
                >
                    <View style={[styles.recordIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#fff" />
                    </View>
                    <Text style={styles.recordLabel}>{isRecording ? 'Tap to Stop' : 'Tap to Record'}</Text>
                    {isRecording && <View style={styles.recordingIndicator}><View style={styles.recordingDot} /><Text style={styles.recordingText}>Recording...</Text></View>}
                </TouchableOpacity>

                {transcription && (
                    <View style={[styles.resultCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.resultHeader}>
                            <View style={[styles.resultIcon, { backgroundColor: '#10B98120' }]}>
                                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                            </View>
                            <Text style={[styles.resultTitle, { color: colors.text }]}>Transcription</Text>
                        </View>
                        <Text style={[styles.resultText, { color: colors.gray }]}>{transcription}</Text>
                        <View style={styles.resultActions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="copy-outline" size={20} color={colors.primary} />
                                <Text style={[styles.actionLabel, { color: colors.primary }]}>Copy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF444415' }]}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

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
    featuresGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    featureCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16 },
    featureIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    featureLabel: { fontSize: 12, fontWeight: '600' },
    featureDesc: { fontSize: 10, marginTop: 2 },
    recordBtn: { alignItems: 'center', paddingVertical: 32, borderRadius: 24, marginBottom: 24 },
    recordIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    recordLabel: { fontSize: 18, fontWeight: '600', color: '#fff' },
    recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
    recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
    recordingText: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    resultCard: { padding: 18, borderRadius: 20 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    resultIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    resultTitle: { fontSize: 17, fontWeight: '700' },
    resultText: { fontSize: 14, lineHeight: 22 },
    resultActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8 },
    actionLabel: { fontSize: 14, fontWeight: '600' },
    bottomPadding: { height: 30 },
});

export default SpeechToTextScreen;
