import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme/theme';

const MessageBubble = ({ role, content, timestamp }) => {
    const isUser = role === 'user';
    const { colors } = useTheme();

    // Create dynamic styles with current theme colors
    const styles = useMemo(() => StyleSheet.create({
        container: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            flexDirection: 'row',
        },
        userContainer: {
            justifyContent: 'flex-end',
        },
        aiContainer: {
            justifyContent: 'flex-start',
        },
        bubble: {
            maxWidth: '85%',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
        },
        userBubble: {
            backgroundColor: colors.userBubble,
            borderBottomRightRadius: spacing.xs,
        },
        aiBubble: {
            backgroundColor: colors.aiBubble,
            borderColor: colors.aiBubbleBorder,
            borderWidth: 1,
            borderBottomLeftRadius: spacing.xs,
        },
        content: {
            fontSize: 15,
            lineHeight: 22,
        },
        userContent: {
            color: colors.text,
        },
        aiContent: {
            color: colors.text,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.xs,
        },
        copyButton: {
            paddingVertical: 2,
            paddingHorizontal: spacing.xs,
        },
        copyText: {
            fontSize: 11,
            color: colors.textMuted,
        },
        timestamp: {
            fontSize: 10,
            color: colors.textMuted,
        },
    }), [colors]);

    const formatTime = (ts) => {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(content);
        Alert.alert('Copied', 'Message copied to clipboard');
    };

    return (
        <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.content, isUser ? styles.userContent : styles.aiContent]}>
                    {content}
                </Text>
                <View style={styles.footer}>
                    <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                        <Text style={styles.copyText}>Copy</Text>
                    </TouchableOpacity>
                    {timestamp && (
                        <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

export default MessageBubble;
