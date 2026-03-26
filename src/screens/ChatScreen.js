import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import aiService from '../services/aiService';

const ChatScreen = () => {
    const { colors, shadows } = useTheme();
    const { userName } = useApp();
    const [messages, setMessages] = useState([{ id: '1', text: `Hello ${userName || 'there'}! I'm your AI safety assistant. How can I help you today?`, isUser: false, timestamp: new Date() }]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);
    const inputAnim = useRef(new Animated.Value(0)).current;

    const suggestions = ['Emergency help', 'Safety tips', 'Report incident', 'Find helpline'];

    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(inputAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(inputAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])).start();
    }, []);

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        const userMessage = { id: Date.now().toString(), text: inputText.trim(), isUser: true, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await aiService.chat(userMessage.text);
            const botMessage = { id: (Date.now() + 1).toString(), text: response.text || 'I apologize, but I could not process your request.', isUser: false, timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I encountered an error. Please try again.', isUser: false, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageRow, item.isUser ? styles.userRow : styles.botRow]}>
            {!item.isUser && (
                <View style={[styles.botAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                </View>
            )}
            <View style={[styles.messageBubble, item.isUser ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, ...shadows.sm }, { borderRadius: 20 }]}>
                <Text style={[styles.messageText, { color: item.isUser ? '#fff' : colors.text }]}>{item.text}</Text>
                <Text style={[styles.timestamp, { color: item.isUser ? 'rgba(255,255,255,0.7)' : colors.gray }]}>{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {item.isUser && (
                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{(userName || 'U')[0]}</Text>
                </View>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <View style={[styles.headerAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="sparkles" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>AI Assistant</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.statusText}>Online</Text>
                        </View>
                    </View>
                </View>
            </View>

            {messages.length === 1 && (
                <View style={styles.suggestionsContainer}>
                    <Text style={[styles.suggestionsTitle, { color: colors.gray }]}>Quick actions:</Text>
                    <View style={styles.suggestionsRow}>
                        {suggestions.map((suggestion, i) => (
                            <TouchableOpacity key={i} style={[styles.suggestionChip, { backgroundColor: colors.primary + '15' }]} onPress={() => setInputText(suggestion)}>
                                <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => item.id} contentContainerStyle={styles.messagesList} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />

            {isLoading && (
                <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>AI is thinking...</Text>
                </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colors.card, ...shadows.large }]}>
                <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} placeholder="Ask me anything..." placeholderTextColor={colors.gray} value={inputText} onChangeText={setInputText} multiline maxLength={500} />
                <TouchableOpacity style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.gray + '40' }]} onPress={sendMessage} disabled={!inputText.trim() || isLoading}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    statusText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
    suggestionsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
    suggestionsTitle: { fontSize: 12, marginBottom: 10 },
    suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    suggestionText: { fontSize: 13, fontWeight: '500' },
    messagesList: { padding: 16, paddingBottom: 8 },
    messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    botRow: { justifyContent: 'flex-start' },
    botAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    userAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    messageBubble: { maxWidth: '75%', padding: 14, paddingBottom: 8 },
    messageText: { fontSize: 15, lineHeight: 21 },
    timestamp: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 16, borderRadius: 16, gap: 10 },
    loadingText: { fontSize: 13 },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, marginHorizontal: 12, marginBottom: 16, borderRadius: 24, gap: 10 },
    input: { flex: 1, fontSize: 15, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
    sendButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
