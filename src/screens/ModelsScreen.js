import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ModelsScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [models, setModels] = useState([
        {
            id: 'llama-3.1-8b',
            name: 'Llama 3.1 8B',
            description: 'Fast and efficient for most tasks',
            provider: 'Meta',
            isActive: true,
        },
        {
            id: 'llama-3.1-70b',
            name: 'Llama 3.1 70B',
            description: 'More powerful for complex tasks',
            provider: 'Meta',
            isActive: false,
        },
        {
            id: 'mixtral-8x7b',
            name: 'Mixtral 8x7B',
            description: 'Excellent for reasoning tasks',
            provider: 'Mistral',
            isActive: false,
        },
        {
            id: 'gemma-2-9b',
            name: 'Gemma 2 9B',
            description: 'Google\'s efficient model',
            provider: 'Google',
            isActive: false,
        },
    ]);

    const selectModel = (selectedId) => {
        setModels(prev =>
            prev.map(model => ({
                ...model,
                isActive: model.id === selectedId,
            }))
        );
        Alert.alert('Model Selected', `The AI will now use ${models.find(m => m.id === selectedId)?.name}`);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="cube" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>AI Models</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Select your preferred AI model
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Models</Text>
                <View style={[styles.modelsCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    {models.map((model, index) => (
                        <TouchableOpacity
                            key={model.id}
                            style={[
                                styles.modelItem,
                                model.isActive && { backgroundColor: colors.primary + '10' },
                                index < models.length - 1 && { borderBottomWidth: 1, borderColor: colors.border },
                            ]}
                            onPress={() => selectModel(model.id)}
                        >
                            <View style={styles.modelInfo}>
                                <View style={styles.modelHeader}>
                                    <Text style={[styles.modelName, { color: colors.text }]}>{model.name}</Text>
                                    {model.isActive && (
                                        <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                                            <Text style={[styles.activeText, { color: colors.white }]}>Active</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.modelDescription, { color: colors.gray }]}>
                                    {model.description}
                                </Text>
                                <Text style={[styles.providerText, { color: colors.primary }]}>
                                    by {model.provider}
                                </Text>
                            </View>
                            <Ionicons
                                name={model.isActive ? 'radio-button-on' : 'radio-button-off'}
                                size={24}
                                color={model.isActive ? colors.primary : colors.gray}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.info + '15', borderRadius, marginTop: spacing.lg }]}>
                    <Ionicons name="information-circle" size={24} color={colors.info} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        Larger models provide better responses but may be slower. The default model balances speed and quality.
                    </Text>
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    modelsCard: {
        overflow: 'hidden',
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    modelInfo: {
        flex: 1,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modelName: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    modelDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    providerText: {
        fontSize: 12,
        marginTop: 4,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default ModelsScreen;
