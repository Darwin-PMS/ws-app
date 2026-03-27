import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import aiService from '../services/aiService';

const { width } = Dimensions.get('window');

const VisionScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const [image, setImage] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8, base64: true });
        if (!result.canceled) { setImage(result.assets[0]); setAnalysis(''); }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera permission is needed'); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8, base64: true });
        if (!result.canceled) { setImage(result.assets[0]); setAnalysis(''); }
    };

    const analyzeImage = async () => {
        if (!image?.base64) { Alert.alert('Error', 'Please select an image first'); return; }
        setIsAnalyzing(true);
        try {
            const response = await aiService.analyzeImage(image.base64);
            setAnalysis(response.analysis || 'No analysis available');
        } catch (error) {
            console.error('Vision analysis error:', error);
            Alert.alert('Error', error.message || 'Failed to analyze image. Please check your API key in settings.');
        }
        finally { setIsAnalyzing(false); }
    };

    const capabilities = [
        { icon: 'shield-checkmark', label: 'Safety Analysis', desc: 'Identify safety concerns', color: '#10B981' },
        { icon: 'document-text', label: 'Text Recognition', desc: 'Read text from images', color: '#3B82F6' },
        { icon: 'color-palette', label: 'Scene Understanding', desc: 'Analyze image context', color: '#8B5CF6' },
        { icon: 'warning', label: 'Threat Detection', desc: 'Spot potential dangers', color: '#EF4444' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#8B5CF6' }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>AI Vision</Text>
                    <TouchableOpacity style={styles.infoBtn}>
                        <Ionicons name="information-circle-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Analyze images with AI power</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.capabilitiesGrid}>
                    {capabilities.map((cap, i) => (
                        <View key={i} style={[styles.capCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                            <View style={[styles.capIcon, { backgroundColor: cap.color + '15' }]}>
                                <Ionicons name={cap.icon} size={22} color={cap.color} />
                            </View>
                            <Text style={[styles.capLabel, { color: colors.text }]}>{cap.label}</Text>
                            <Text style={[styles.capDesc, { color: colors.gray }]}>{cap.desc}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.captureSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Capture Image</Text>
                    <View style={styles.captureButtons}>
                        <TouchableOpacity style={[styles.captureBtn, { backgroundColor: colors.card, ...shadows.md }]} onPress={pickImage}>
                            <View style={[styles.captureIcon, { backgroundColor: '#3B82F620' }]}>
                                <Ionicons name="images" size={28} color="#3B82F6" />
                            </View>
                            <Text style={[styles.captureLabel, { color: colors.text }]}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.captureBtn, { backgroundColor: colors.card, ...shadows.md }]} onPress={takePhoto}>
                            <View style={[styles.captureIcon, { backgroundColor: '#EF444420' }]}>
                                <Ionicons name="camera" size={28} color="#EF4444" />
                            </View>
                            <Text style={[styles.captureLabel, { color: colors.text }]}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {image && (
                    <View style={styles.previewSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
                        <View style={[styles.imageWrapper, { ...shadows.large }]}>
                            <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
                            <TouchableOpacity style={styles.removeBtn} onPress={() => { setImage(null); setAnalysis(''); }}>
                                <Ionicons name="close-circle" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: isAnalyzing ? colors.gray : '#8B5CF6' }]} onPress={analyzeImage} disabled={isAnalyzing}>
                            {isAnalyzing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="scan" size={22} color="#fff" />
                                    <Text style={styles.analyzeBtnText}>Analyze Image</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {analysis && (
                    <View style={[styles.analysisCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.analysisHeader}>
                            <View style={[styles.analysisIcon, { backgroundColor: '#10B98120' }]}>
                                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                            </View>
                            <Text style={[styles.analysisTitle, { color: colors.text }]}>Analysis Result</Text>
                        </View>
                        <Text style={[styles.analysisText, { color: colors.gray }]}>{analysis}</Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    infoBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    capabilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    capCard: { width: (width - 52) / 2, padding: 16, borderRadius: 16, alignItems: 'center' },
    capIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    capLabel: { fontSize: 13, fontWeight: '600' },
    capDesc: { fontSize: 11, marginTop: 4 },
    captureSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
    captureButtons: { flexDirection: 'row', gap: 14 },
    captureBtn: { flex: 1, alignItems: 'center', paddingVertical: 24, borderRadius: 16 },
    captureIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    captureLabel: { fontSize: 14, fontWeight: '600' },
    previewSection: { marginBottom: 20 },
    imageWrapper: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    image: { width: '100%', height: 280 },
    removeBtn: { position: 'absolute', top: 12, right: 12 },
    analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    analysisCard: { padding: 18, borderRadius: 16 },
    analysisHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    analysisIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    analysisTitle: { fontSize: 16, fontWeight: '700' },
    analysisText: { fontSize: 14, lineHeight: 22 },
    bottomPadding: { height: 30 },
});

export default VisionScreen;
