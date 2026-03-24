import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme/theme';

const RecordButton = ({ isRecording, onPressIn, onPressOut, size = 80 }) => {
    const { colors } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording) {
            // Start pulsing animation
            Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.3,
                            duration: 800,
                            easing: Easing.ease,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 800,
                            easing: Easing.ease,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(opacityAnim, {
                            toValue: 0.3,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        } else {
            // Stop animation
            pulseAnim.stopAnimation();
            opacityAnim.stopAnimation();
            pulseAnim.setValue(1);
            opacityAnim.setValue(0);
        }
    }, [isRecording]);

    const iconSize = size * 0.4;

    // Create dynamic styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        pulseRing: {
            position: 'absolute',
            backgroundColor: colors.error,
        },
        button: {
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
        },
        recordingButton: {
            backgroundColor: colors.error,
            shadowColor: colors.error,
        },
    });

    return (
        <View style={[styles.container, { width: size + 40, height: size + 40 }]}>
            {/* Pulse ring */}
            {isRecording && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        {
                            width: size + 20,
                            height: size + 20,
                            borderRadius: (size + 20) / 2,
                            transform: [{ scale: pulseAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                />
            )}

            {/* Main button */}
            <TouchableOpacity
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                    isRecording && styles.recordingButton,
                ]}
            >
                <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={iconSize}
                    color={colors.text}
                />
            </TouchableOpacity>
        </View>
    );
};

export default RecordButton;
