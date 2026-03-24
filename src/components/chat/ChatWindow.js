// Chat Window Component
// Full-featured chat interface with message bubbles and input

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../theme/theme';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatWindow = ({
    messages = [],
    onSendMessage,
    loading = false,
    placeholder = 'Ask about child care...',
    showHeader = true,
    headerTitle = 'Child Care Assistant',
    onClearHistory,
}) => {
    const { colors } = useTheme();
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    // Create dynamic styles with current theme colors
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerTitleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.sm,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        clearButton: {
            padding: spacing.xs,
        },
        messagesList: {
            flex: 1,
        },
        messagesContent: {
            padding: spacing.md,
            paddingBottom: spacing.lg,
        },
        messageContainer: {
            flexDirection: 'row',
            marginBottom: spacing.md,
            alignItems: 'flex-end',
        },
        userMessageContainer: {
            justifyContent: 'flex-end',
        },
        assistantMessageContainer: {
            justifyContent: 'flex-start',
        },
        avatarContainer: {
            marginHorizontal: spacing.xs,
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        userAvatar: {
            backgroundColor: colors.secondary,
        },
        messageBubble: {
            maxWidth: '75%',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
        },
        userBubble: {
            backgroundColor: colors.primary,
            borderBottomRightRadius: 4,
        },
        assistantBubble: {
            backgroundColor: colors.card,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
        },
        messageText: {
            fontSize: 15,
            lineHeight: 22,
        },
        userMessageText: {
            color: '#fff',
        },
        assistantMessageText: {
            color: colors.text,
        },
        suggestionsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: spacing.sm,
            gap: spacing.xs,
        },
        suggestionButton: {
            backgroundColor: colors.primary + '15',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.primary + '30',
        },
        suggestionText: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '500',
        },
        timestamp: {
            fontSize: 10,
            color: colors.textSecondary,
            marginTop: spacing.xs,
            alignSelf: 'flex-end',
        },
        loadingContainer: {
            padding: spacing.sm,
            backgroundColor: colors.card,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: spacing.md,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        inputWrapper: {
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            maxHeight: 120,
        },
        input: {
            fontSize: 15,
            color: colors.text,
            maxHeight: 100,
        },
        sendButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: spacing.sm,
        },
        sendButtonDisabled: {
            backgroundColor: colors.border,
        },
        emptyChat: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: spacing.xxl * 2,
        },
        emptyText: {
            marginTop: spacing.md,
            fontSize: 14,
            color: colors.textSecondary,
        },
    }), [colors]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const handleSend = () => {
        if (inputText.trim() && !loading) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.role === 'user';
        const isAssistant = item.role === 'assistant';

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.assistantMessageContainer
                ]}
                accessibilityLabel={`${item.role} message`}
            >
                {isAssistant && (
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="bot" size={16} color="#fff" />
                        </View>
                    </View>
                )}

                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.assistantMessageText
                    ]}>
                        {item.text}
                    </Text>

                    {/* Suggested Actions */}
                    {item.suggestedActions && item.suggestedActions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {item.suggestedActions.map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionButton}
                                    onPress={() => onSendMessage(action)}
                                >
                                    <Text style={styles.suggestionText}>{action}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.timestamp}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>

                {isUser && (
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.userAvatar]}>
                            <Ionicons name="person" size={16} color="#fff" />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const keyExtractor = (item) => item.id || Date.now().toString();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            {showHeader && (
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="happy" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.headerTitle}>{headerTitle}</Text>
                    </View>
                    {onClearHistory && (
                        <TouchableOpacity
                            onPress={onClearHistory}
                            style={styles.clearButton}
                            accessibilityLabel="Clear chat history"
                        >
                            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={keyExtractor}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <View style={styles.emptyChat}>
                        <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>Start a conversation</Text>
                    </View>
                }
            />

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <LoadingSpinner size="small" message="Thinking..." />
                </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={2000}
                        accessibilityLabel="Message input"
                    />
                </View>
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!inputText.trim() || loading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || loading}
                    accessibilityLabel="Send message"
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={inputText.trim() && !loading ? '#fff' : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatWindow;
