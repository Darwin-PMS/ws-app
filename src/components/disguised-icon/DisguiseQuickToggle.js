import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDisguiseConfig, getQuickDisguises } from '../../utils/DisguisedIconManager';

const ICON_MAP = {
    'shield-check': 'shield-checkmark',
    'calculator': 'calculator',
    'note-text': 'document-text',
    'weather-cloudy': 'cloudy',
    'calendar': 'calendar',
    'heart-pulse': 'heart',
    'music': 'musical-notes',
    'cart': 'cart',
};

/**
 * DisguiseQuickToggle - A compact widget for quick access to disguise mode
 * 
 * This component can be added to any screen for quick toggle access.
 * Shows current disguise status and allows quick switching.
 */
const DisguiseQuickToggle = ({ onPress, size = 'medium' }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [currentDisguise, setCurrentDisguise] = useState(null);
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        loadStatus();

        // Pulse animation when enabled
        if (isEnabled) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isEnabled]);

    const loadStatus = async () => {
        const config = await getDisguiseConfig();
        setIsEnabled(config.isEnabled);
        setCurrentDisguise(config.disguise);
    };

    const sizeConfig = {
        small: { container: 40, icon: 20, text: 10 },
        medium: { container: 48, icon: 24, text: 12 },
        large: { container: 56, icon: 28, text: 14 },
    };

    const config = sizeConfig[size];
    const iconName = currentDisguise
        ? (ICON_MAP[currentDisguise.icon] || 'help-circle')
        : 'shield-checkmark';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Animated.View
                style={[
                    styles.container,
                    {
                        width: config.container,
                        height: config.container,
                        transform: [{ scale: pulseAnim }],
                    },
                    isEnabled && styles.containerEnabled,
                    isEnabled && { backgroundColor: currentDisguise?.color || '#10B981' },
                ]}
            >
                <Ionicons
                    name={iconName}
                    size={config.icon}
                    color="#FFFFFF"
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerEnabled: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});

export default DisguiseQuickToggle;
