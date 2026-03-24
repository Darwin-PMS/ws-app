import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CONFIDENCE_THRESHOLDS } from '../../constants/cylinderStandards';

/**
 * ConfidenceIndicator Component
 * Visual indicator for displaying confidence scores
 * 
 * @param {Object} props
 * @param {number} props.confidence - Confidence score (0-1)
 * @param {string} props.label - Label for the indicator
 * @param {string} props.size - Size variant ('small', 'medium', 'large')
 * @param {boolean} props.showValue - Whether to show the percentage value
 * @param {boolean} props.showIcon - Whether to show the icon
 */
const ConfidenceIndicator = ({
    confidence,
    label,
    size = 'medium',
    showValue = true,
    showIcon = true,
}) => {
    const { colors, spacing, borderRadius } = useTheme();

    // Determine confidence level and styling
    const getConfidenceLevel = (score) => {
        if (score >= CONFIDENCE_THRESHOLDS.critical.nextTestDate) return 'high';
        if (score >= CONFIDENCE_THRESHOLDS.warning) return 'medium';
        if (score >= CONFIDENCE_THRESHOLDS.minimum) return 'low';
        return 'critical';
    };

    const getConfidenceColor = (level) => {
        switch (level) {
            case 'high':
                return '#22C55E'; // green
            case 'medium':
                return '#F59E0B'; // amber
            case 'low':
                return '#EF4444'; // red
            case 'critical':
                return '#DC2626'; // dark red
            default:
                return colors.gray;
        }
    };

    const getIconName = (level) => {
        switch (level) {
            case 'high':
                return 'checkmark-circle';
            case 'medium':
                return 'alert-circle';
            case 'low':
                return 'warning';
            case 'critical':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const getSizeStyles = (sizeVariant) => {
        switch (sizeVariant) {
            case 'small':
                return {
                    container: { height: 8, iconSize: 12, fontSize: 10 },
                    bar: { height: 6 },
                };
            case 'large':
                return {
                    container: { height: 20, iconSize: 20, fontSize: 14 },
                    bar: { height: 12 },
                };
            default:
                return {
                    container: { height: 14, iconSize: 16, fontSize: 12 },
                    bar: { height: 8 },
                };
        }
    };

    const level = getConfidenceLevel(confidence);
    const color = getConfidenceColor(level);
    const iconName = getIconName(level);
    const sizeStyles = getSizeStyles(size);
    const percentage = Math.round(confidence * 100);

    return (
        <View style={styles.container}>
            {(label || showIcon) && (
                <View style={styles.labelContainer}>
                    {showIcon && (
                        <Ionicons
                            name={iconName}
                            size={sizeStyles.iconSize}
                            color={color}
                            style={styles.icon}
                        />
                    )}
                    {label && (
                        <Text style={[styles.label, { fontSize: sizeStyles.fontSize, color: colors.text }]}>
                            {label}
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.barContainer}>
                <View
                    style={[
                        styles.barBackground,
                        { height: sizeStyles.bar.height, backgroundColor: colors.border },
                    ]}
                >
                    <View
                        style={[
                            styles.barFill,
                            {
                                width: `${percentage}%`,
                                height: sizeStyles.bar.height,
                                backgroundColor: color,
                            },
                        ]}
                    />
                </View>
            </View>

            {showValue && (
                <Text style={[styles.value, { color: color, fontSize: sizeStyles.fontSize }]}>
                    {percentage}%
                </Text>
            )}
        </View>
    );
};

/**
 * ConfidenceDisplay Component
 * Displays multiple confidence indicators in a list
 * 
 * @param {Object} props
 * @param {Object} props.confidences - Object with field names as keys and confidence scores as values
 * @param {string} props.size - Size variant
 * @param {boolean} props.showValues - Whether to show percentage values
 */
export const ConfidenceDisplay = ({
    confidences = {},
    size = 'medium',
    showValues = true,
}) => {
    const { colors, spacing } = useTheme();

    const formatFieldName = (field) => {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    };

    // Filter out null/undefined confidences
    const validConfidences = Object.entries(confidences).filter(
        ([_, value]) => value != null && typeof value === 'number'
    );

    if (validConfidences.length === 0) {
        return null;
    }

    return (
        <View style={[styles.displayContainer, { marginTop: spacing.md }]}>
            {validConfidences.map(([field, confidence]) => (
                <ConfidenceIndicator
                    key={field}
                    confidence={confidence}
                    label={formatFieldName(field)}
                    size={size}
                    showValue={showValues}
                    showIcon={true}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80,
    },
    icon: {
        marginRight: 4,
    },
    label: {
        fontWeight: '500',
    },
    barContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    barBackground: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    barFill: {
        borderRadius: 10,
    },
    value: {
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'right',
    },
    displayContainer: {
        gap: 12,
    },
});

export default ConfidenceIndicator;
