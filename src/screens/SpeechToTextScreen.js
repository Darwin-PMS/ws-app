import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { useTheme } from '../context/ThemeContext';

const SpeechToTextScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [recording, setRecording] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const startRecording = async () => {
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Microphone access is needed');
            return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        // In a real app, you would send the audio to a speech-to-text service
        setTranscription('This is a simulated transcription. In production, this would be the actual transcribed text from your speech.');
    };

    const clearTranscription = () => {
        setTranscription('');
    };

    const copyTranscription = () => {
        // Clipboard functionality
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="mic" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Speech to Text</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Convert your speech to text
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.recordContainer}>
                    <TouchableOpacity
                        style={[
                            styles.recordButton,
                            {
                                backgroundColor: isRecording ? colors.error : colors.primary,
                                ...shadows.large,
                            },
                        ]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Ionicons
                            name={isRecording ? 'stop' : 'mic'}
                            size={40}
                            color={colors.white}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.recordText, { color: colors.text }]}>
                        {isRecording ? 'Tap to Stop' : 'Tap to Record'}
                    </Text>
                </View>

                {isRecording && (
                    <View style={styles.waveformContainer}>
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 20 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 40 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 30 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 50 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 25 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 45 }]} />
                        <View style={[styles.waveformBar, { backgroundColor: colors.primary, height: 35 }]} />
                    </View>
                )}

                {transcription ? (
                    <View style={[styles.transcriptionContainer, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                        <View style={styles.transcriptionHeader}>
                            <Text style={[styles.transcriptionTitle, { color: colors.text }]}>Transcription</Text>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={copyTranscription} style={styles.actionButton}>
                                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={clearTranscription} style={styles.actionButton}>
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={[styles.transcriptionText, { color: colors.gray }]}>{transcription}</Text>
                    </View>
                ) : null}
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
    recordContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 16,
    },
    waveformContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginBottom: 24,
        height: 60,
    },
    waveformBar: {
        width: 6,
        borderRadius: 3,
    },
    transcriptionContainer: {
        padding: 16,
    },
    transcriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    transcriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    transcriptionText: {
        fontSize: 16,
        lineHeight: 24,
    },
});

export default SpeechToTextScreen;
