import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import aiService from '../services/aiService';

const VisionScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [image, setImage] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
            setAnalysis('');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to take photos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
            setAnalysis('');
        }
    };

    const analyzeImage = async () => {
        if (!image?.base64) {
            Alert.alert('Error', 'Please select an image first');
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await aiService.analyzeImage(image.base64);
            setAnalysis(response.analysis || 'No analysis available');
        } catch (error) {
            Alert.alert('Error', 'Failed to analyze image');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="camera" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>AI Vision</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Analyze images with AI
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.imageActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                        onPress={pickImage}
                    >
                        <Ionicons name="images-outline" size={28} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                        onPress={takePhoto}
                    >
                        <Ionicons name="camera-outline" size={28} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>
                </View>

                {image && (
                    <View style={[styles.imageContainer, { borderRadius, ...shadows.medium }]}>
                        <Image source={{ uri: image.uri }} style={styles.image} resizeMode="contain" />
                    </View>
                )}

                {image && (
                    <TouchableOpacity
                        style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                        onPress={analyzeImage}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <>
                                <Ionicons name="scan" size={20} color={colors.white} />
                                <Text style={[styles.analyzeButtonText, { color: colors.white }]}>
                                    Analyze Image
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {analysis ? (
                    <View style={[styles.analysisContainer, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                        <Text style={[styles.analysisTitle, { color: colors.text }]}>Analysis</Text>
                        <Text style={[styles.analysisText, { color: colors.gray }]}>{analysis}</Text>
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
    imageActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    actionButton: {
        alignItems: 'center',
        padding: 20,
        width: 100,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
    imageContainer: {
        overflow: 'hidden',
        marginBottom: 24,
    },
    image: {
        width: '100%',
        height: 300,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
    },
    analyzeButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    analysisContainer: {
        padding: 16,
    },
    analysisTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    analysisText: {
        fontSize: 14,
        lineHeight: 22,
    },
});

export default VisionScreen;
