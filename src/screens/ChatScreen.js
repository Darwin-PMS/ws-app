import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import aiService from '../services/aiService';

const ChatScreen = () => {
    const { colors, spacing, borderRadius } = useTheme();
    const { userName } = useApp();

    const [messages, setMessages] = useState([
        { id: '1', text: `Hello ${userName || 'there'}! How can I help you today?`, isUser: false, timestamp: new Date() },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await aiService.chat(userMessage.text);
            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: response.text || 'I apologize, but I could not process your request.',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
            <View style={[
                styles.messageBubble,
                {
                    backgroundColor: item.isUser ? colors.primary : colors.card,
                    borderRadius,
                },
            ]}>
                <Text style={[styles.messageText, { color: item.isUser ? colors.white : colors.text }]}>
                    {item.text}
                </Text>
                <Text style={[styles.timestamp, { color: item.isUser ? colors.white + '99' : colors.gray }]}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>AI is typing...</Text>
                </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.gray}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.primary }]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Ionicons name="send" size={20} color={colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 12,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    loadingText: {
        fontSize: 12,
        marginLeft: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatScreen;
