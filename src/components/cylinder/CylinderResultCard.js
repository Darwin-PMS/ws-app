import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import StatusBadge from './StatusBadge';
import ConfidenceIndicator, { ConfidenceDisplay } from './ConfidenceIndicator';
import { SAFETY_MESSAGES, STATUS_CODES } from '../../constants/cylinderStandards';

/**
 * CylinderResultCard Component
 * Displays the complete cylinder verification result
 * 
 * @param {Object} props
 * @param {Object} props.result - The complete verification result object
 * @param {Function} props.onSave - Callback to save the report
 * @param {Function} props.onRetest - Callback to find retest provider
 * @param {Function} props.onScanAnother - Callback to scan another cylinder
 */
const CylinderResultCard = ({
    result,
    onSave,
    onRetest,
    onScanAnother,
}) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    if (!result) {
        return null;
    }

    const { extraction, confidence, status, assessment, compliance, contact } = result;

    // Get safety message for current status
    const safetyMessage = SAFETY_MESSAGES[status?.code] || SAFETY_MESSAGES.UNKNOWN;

    // Format extracted data for display
    const dataFields = [
        { label: 'Cylinder Number', value: extraction?.cylinderNumber, key: 'cylinderNumber' },
        { label: 'Serial Number', value: extraction?.serialNumber, key: 'serialNumber' },
        { label: 'Manufacturer', value: extraction?.manufacturer, key: 'manufacturer' },
        { label: 'Gas Type', value: extraction?.gasType, key: 'gasType' },
        { label: 'Capacity', value: extraction?.capacity, key: 'capacity' },
        { label: 'Manufacture Date', value: extraction?.manufactureDate, key: 'manufactureDate' },
        { label: 'Test Date', value: extraction?.testDate, key: 'testDate' },
        { label: 'Next Test Date', value: extraction?.nextTestDate, key: 'nextTestDate' },
        { label: 'Tare Weight', value: extraction?.tareWeight, key: 'tareWeight' },
        { label: 'Inspection Mark', value: extraction?.inspectionMark, key: 'inspectionMark' },
    ];

    // Filter out null values
    const displayFields = dataFields.filter(field => field.value);

    // Render data row
    const renderDataRow = (field, index) => {
        const fieldConfidence = confidence?.[field.key];

        return (
            <View
                key={field.key}
                style={[
                    styles.dataRow,
                    { borderBottomColor: colors.border },
                ]}
            >
                <View style={styles.dataLabel}>
                    <Text style={[styles.dataLabelText, { color: colors.textMuted }]}>
                        {field.label}
                    </Text>
                    {fieldConfidence != null && fieldConfidence < 0.8 && (
                        <Ionicons
                            name="warning"
                            size={14}
                            color={colors.warning}
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </View>
                <View style={styles.dataValue}>
                    <Text style={[styles.dataValueText, { color: colors.text }]}>
                        {field.value}
                    </Text>
                    {fieldConfidence != null && (
                        <Text style={[styles.confidenceText, { color: colors.textMuted }]}>
                            {Math.round(fieldConfidence * 100)}%
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: status?.color || colors.gray }]}>
                <Ionicons
                    name={safetyMessage.icon}
                    size={32}
                    color="#fff"
                />
                <View style={styles.statusContent}>
                    <Text style={styles.statusTitle}>{safetyMessage.title}</Text>
                    <Text style={styles.statusMessage}>
                        {assessment?.recommendedAction || safetyMessage.message}
                    </Text>
                </View>
            </View>

            {/* Status Details */}
            <View style={[styles.card, { backgroundColor: colors.card, ...shadows.small }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Cylinder Details
                    </Text>
                    <StatusBadge status={status?.code} size="small" />
                </View>

                {/* Data Fields */}
                <View style={[styles.dataContainer, { borderRadius: borderRadius.md }]}>
                    {displayFields.map((field, index) => renderDataRow(field, index))}
                </View>
            </View>

            {/* Confidence Scores */}
            {confidence && (
                <View style={[styles.card, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: spacing.md }]}>
                        Extraction Confidence
                    </Text>
                    <ConfidenceDisplay confidences={confidence} size="small" />
                </View>
            )}

            {/* Compliance Info */}
            {compliance && (
                <View style={[styles.card, { backgroundColor: colors.card, ...shadows.small }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: spacing.md }]}>
                        Compliance Information
                    </Text>
                    <View style={styles.complianceRow}>
                        <Text style={[styles.complianceLabel, { color: colors.textMuted }]}>
                            Region:
                        </Text>
                        <Text style={[styles.complianceValue, { color: colors.text }]}>
                            {compliance.region}
                        </Text>
                    </View>
                    <View style={styles.complianceRow}>
                        <Text style={[styles.complianceLabel, { color: colors.textMuted }]}>
                            Standard:
                        </Text>
                        <Text style={[styles.complianceValue, { color: colors.text }]}>
                            {compliance.standard}
                        </Text>
                    </View>
                    <View style={styles.complianceRow}>
                        <Text style={[styles.complianceLabel, { color: colors.textMuted }]}>
                            Test Interval:
                        </Text>
                        <Text style={[styles.complianceValue, { color: colors.text }]}>
                            {compliance.testInterval}
                        </Text>
                    </View>
                    <View style={styles.complianceRow}>
                        <Text style={[styles.complianceLabel, { color: colors.textMuted }]}>
                            Compliant:
                        </Text>
                        <Ionicons
                            name={compliance.isCompliant ? 'checkmark-circle' : 'close-circle'}
                            size={20}
                            color={compliance.isCompliant ? colors.success : colors.error}
                        />
                    </View>
                </View>
            )}

            {/* Contact Info */}
            {contact && (status?.code === 'OVERDUE' || status?.code === 'DUE_SOON') && (
                <View style={[styles.card, styles.contactCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                    <View style={styles.contactHeader}>
                        <Ionicons name="call" size={24} color={colors.warning} />
                        <Text style={[styles.contactTitle, { color: colors.warning }]}>
                            Need Retest?
                        </Text>
                    </View>
                    <Text style={[styles.contactText, { color: colors.text }]}>
                        {contact.contactInfo}
                    </Text>
                    {contact.emergencyContact && (
                        <Text style={[styles.emergencyText, { color: colors.error }]}>
                            Emergency: {contact.emergencyContact}
                        </Text>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onSave && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={onSave}
                    >
                        <Ionicons name="download" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Save Report</Text>
                    </TouchableOpacity>
                )}

                {onRetest && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.warning }]}
                        onPress={onRetest}
                    >
                        <Ionicons name="location" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Find Retest Center</Text>
                    </TouchableOpacity>
                )}

                {onScanAnother && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.primary }]}
                        onPress={onScanAnother}
                    >
                        <Ionicons name="camera" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                            Scan Another
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                    This tool provides automated analysis. Always verify critical safety
                    information manually. Contact certified testing stations for official validation.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        margin: 16,
        borderRadius: 12,
    },
    statusContent: {
        flex: 1,
        marginLeft: 12,
    },
    statusTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusMessage: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginTop: 4,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    dataContainer: {
        overflow: 'hidden',
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    dataLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dataLabelText: {
        fontSize: 14,
    },
    dataValue: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    dataValueText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'right',
    },
    confidenceText: {
        fontSize: 12,
        marginLeft: 8,
    },
    complianceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    complianceLabel: {
        fontSize: 14,
    },
    complianceValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    contactCard: {
        borderWidth: 1,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    contactText: {
        fontSize: 14,
        marginBottom: 4,
    },
    emergencyText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    actions: {
        paddingHorizontal: 16,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        marginLeft: 8,
        lineHeight: 18,
    },
});

export default CylinderResultCard;
