import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const GrievanceScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const [complaintType, setComplaintType] = useState('');
    const [description, setDescription] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const complaintTypes = [
        { id: 'data_privacy', label: 'Data Privacy Issue', icon: 'shield-outline' },
        { id: 'harassment', label: 'Harassment/Abuse', icon: 'alert-circle-outline' },
        { id: 'content', label: 'Inappropriate Content', icon: 'ban-outline' },
        { id: 'account', label: 'Account Issue', icon: 'person-outline' },
        { id: 'safety', label: 'Safety Concern', icon: 'warning-outline' },
        { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
    ];

    const handleSubmit = async () => {
        // Validate required fields
        if (!complaintType) {
            Alert.alert('Required', 'Please select a complaint type');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Required', 'Please describe your complaint');
            return;
        }
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (!phone.trim() && !email.trim()) {
            Alert.alert('Required', 'Please provide either phone or email');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call - in production, this would call your backend
            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                'Complaint Submitted',
                `Your complaint has been registered.\n\nTicket ID: GRV-${Date.now().toString().slice(-8)}\n\nWe will acknowledge your complaint within 24 hours and resolve within 15 days as per IT Rules 2021.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setComplaintType('');
                            setDescription('');
                            setName('');
                            setEmail('');
                            setPhone('');
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Info Banner */}
                <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15', borderRadius }]}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        As per IT Rules 2021, we will acknowledge your complaint within 24 hours and resolve within 15 days.
                    </Text>
                </View>

                {/* Complaint Type Selection */}
                <Text style={[styles.label, { color: colors.text }]}>
                    Complaint Type *
                </Text>
                <View style={styles.typeGrid}>
                    {complaintTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.typeButton,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: complaintType === type.id ? colors.primary : colors.border,
                                    borderWidth: complaintType === type.id ? 2 : 1,
                                },
                            ]}
                            onPress={() => setComplaintType(type.id)}
                        >
                            <Ionicons
                                name={type.icon}
                                size={20}
                                color={complaintType === type.id ? colors.primary : colors.gray}
                            />
                            <Text
                                style={[
                                    styles.typeLabel,
                                    { color: complaintType === type.id ? colors.primary : colors.gray },
                                ]}
                            >
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Description */}
                <Text style={[styles.label, { color: colors.text }]}>
                    Describe Your Complaint *
                </Text>
                <TextInput
                    style={[
                        styles.textArea,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                        },
                    ]}
                    placeholder="Please provide detailed information about your complaint..."
                    placeholderTextColor={colors.gray}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />

                {/* Contact Information */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Your Contact Information
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>
                    Name *
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                        },
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.gray}
                    value={name}
                    onChangeText={setName}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Phone
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Mobile number"
                            placeholderTextColor={colors.gray}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Email
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Email address"
                            placeholderTextColor={colors.gray}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: colors.primary },
                        isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                    </Text>
                </TouchableOpacity>

                {/* Alternative Contact */}
                <View style={[styles.altContact, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.altTitle, { color: colors.text }]}>
                        Other Ways to Contact
                    </Text>
                    <Text style={[styles.altText, { color: colors.gray }]}>
                        Email: grievance@womensafetyapp.in
                    </Text>
                    <Text style={[styles.altText, { color: colors.gray }]}>
                        Grievance Officer: [Name], Resident of India
                    </Text>
                    <Text style={[styles.altText, { color: colors.gray }]}>
                        Address: [Company Address, India]
                    </Text>
                </View>

                {/* GAC Info */}
                <View style={[styles.gacInfo, { backgroundColor: colors.warning + '15', borderRadius }]}>
                    <Ionicons name="arrow-up-circle" size={24} color={colors.warning} />
                    <Text style={[styles.gacText, { color: colors.text }]}>
                        If unsatisfied with our resolution, you may appeal to the Grievance Appellate Committee (GAC) within 30 days as per IT Rules 2021.
                    </Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    typeButton: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: '1%',
        marginBottom: 8,
        borderRadius: 10,
    },
    typeLabel: {
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        minHeight: 120,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
    halfInput: {
        flex: 1,
        paddingHorizontal: 6,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    altContact: {
        padding: 16,
        marginTop: 24,
    },
    altTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    altText: {
        fontSize: 13,
        marginBottom: 4,
    },
    gacInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginTop: 16,
    },
    gacText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 12,
        lineHeight: 18,
    },
    bottomPadding: {
        height: 40,
    },
});

export default GrievanceScreen;
