import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_CODES, getStatusByCode } from '../../constants/cylinderStandards';

/**
 * StatusBadge - A colored badge component for displaying cylinder verification status
 * 
 * @param {Object} props
 * @param {'VALID' | 'DUE_SOON' | 'OVERDUE' | 'EXPIRED' | 'UNKNOWN'} props.status - The status code
 * @param {'small' | 'medium' | 'large'} [props.size='medium'] - Size variant of the badge
 * @param {boolean} [props.showIcon=true] - Whether to show the status icon
 * @param {boolean} [props.showLabel=true] - Whether to show the status label text
 * @param {Object} [props.style] - Additional style overrides
 */
const StatusBadge = ({
    status,
    size = 'medium',
    showIcon = true,
    showLabel = true,
    style,
}) => {
    // Get status configuration from STATUS_CODES
    const statusConfig = getStatusByCode(status) || STATUS_CODES.UNKNOWN;

    // Animation value for subtle scale animation on status change
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Animate on status change
    useEffect(() => {
        // Pulse animation on status change
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [status]);

    // Size configurations
    const sizeConfig = {
        small: {
            containerHeight: 24,
            iconSize: 12,
            fontSize: 10,
            paddingHorizontal: 8,
            iconMargin: 2,
        },
        medium: {
            containerHeight: 32,
            iconSize: 16,
            fontSize: 12,
            paddingHorizontal: 12,
            iconMargin: 4,
        },
        large: {
            containerHeight: 48,
            iconSize: 24,
            fontSize: 16,
            paddingHorizontal: 16,
            iconMargin: 6,
        },
    };

    const currentSize = sizeConfig[size] || sizeConfig.medium;

    // Icon mapping based on status
    const getIconName = (statusCode) => {
        const iconMap = {
            VALID: 'checkmark-circle',
            DUE_SOON: 'warning',
            OVERDUE: 'alert-circle',
            EXPIRED: 'close-circle',
            UNKNOWN: 'help-circle',
        };
        return iconMap[statusCode] || 'help-circle';
    };

    // Determine text color based on background brightness
    const getTextColor = (backgroundColor) => {
        // Simple brightness calculation
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Return white for dark backgrounds, dark gray for light backgrounds
        return brightness > 128 ? '#1F2937' : '#FFFFFF';
    };

    const backgroundColor = statusConfig.color || STATUS_CODES.UNKNOWN.color;
    const textColor = getTextColor(backgroundColor);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor,
                    height: currentSize.containerHeight,
                    paddingHorizontal: currentSize.paddingHorizontal,
                    transform: [{ scale: scaleAnim }],
                },
                style,
            ]}
            accessibilityLabel={`Status: ${statusConfig.name}`}
            accessibilityRole="text"
            accessibilityTraits="none"
        >
            {showIcon && (
                <Ionicons
                    name={getIconName(status)}
                    size={currentSize.iconSize}
                    color={textColor}
                    style={{ marginRight: showLabel ? currentSize.iconMargin : 0 }}
                />
            )}
            {showLabel && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: textColor,
                            fontSize: currentSize.fontSize,
                            lineHeight: currentSize.containerHeight - 4,
                        },
                    ]}
                >
                    {statusConfig.name}
                </Text>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    label: {
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default StatusBadge;
