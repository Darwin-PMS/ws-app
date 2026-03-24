import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import aiService from '../services/aiService';

const ThoughtGeneratorScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [prompt, setPrompt] = useState('');
    const [thought, setThought] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateThought = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const response = await aiService.generateThought(prompt);
            setThought(response.thought || 'Unable to generate thought');
        } catch (error) {
            setThought('An error occurred while generating the thought.');
        } finally {
            setIsGenerating(false);
        }
    };

    const shareThought = async () => {
        try {
            await Share.share({
                message: thought,
                title: 'Generated Thought',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const copyToClipboard = () => {
        // Clipboard functionality would go here
    };

    const promptSuggestions = [
        'Give me a motivational quote for today',
        'Share a positive affirmation',
        'Generate a creative writing prompt',
        'Give me relationship advice',
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="sparkles" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Thought Generator</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Generate inspiring thoughts and ideas
                </Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter a prompt or topic..."
                        placeholderTextColor={colors.gray}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                    />
                </View>

                <Text style={[styles.suggestionsTitle, { color: colors.gray }]}>Suggestions:</Text>
                <View style={styles.suggestionsContainer}>
                    {promptSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.suggestionChip, { backgroundColor: colors.primary + '15', borderRadius }]}
                            onPress={() => setPrompt(suggestion)}
                        >
                            <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.generateButton, { backgroundColor: colors.secondary }]}
                    onPress={generateThought}
                    disabled={!prompt.trim() || isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={20} color={colors.white} />
                            <Text style={[styles.generateButtonText, { color: colors.white }]}>Generate Thought</Text>
                        </>
                    )}
                </TouchableOpacity>

                {thought ? (
                    <View style={[styles.thoughtContainer, { backgroundColor: colors.card, borderRadius, ...shadows.medium }]}>
                        <Text style={[styles.thoughtTitle, { color: colors.text }]}>Generated Thought</Text>
                        <Text style={[styles.thoughtText, { color: colors.gray }]}>{thought}</Text>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.iconButton} onPress={shareThought}>
                                <Ionicons name="share-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={copyToClipboard}>
                                <Ionicons name="copy-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
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
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    input: {
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    suggestionsTitle: {
        fontSize: 12,
        marginBottom: 8,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    suggestionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    suggestionText: {
        fontSize: 12,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    thoughtContainer: {
        padding: 20,
    },
    thoughtTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    thoughtText: {
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    iconButton: {
        padding: 8,
    },
});

export default ThoughtGeneratorScreen;
