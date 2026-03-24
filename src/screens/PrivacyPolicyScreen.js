import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const sections = [
        {
            title: '1. Introduction and Overview',
            content: `This Privacy Policy governs the collection, processing, storage, use, and disclosure of personal data by Women Safety App, a women's safety mobile application operated from India. This Policy ensures compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Digital Personal Data Protection Rules, 2024.`,
        },
        {
            title: '2. Types of Personal Data Collected',
            content: `We collect:\n\n• Identity Information: Name, phone number, email, date of birth, gender\n• Location Data: Real-time GPS, saved locations, travel routes\n• Communication Data: Chat messages, voice recordings\n• Media Data: Photos, videos for evidence capture\n• Device Data: Device ID, operating system, app version\n• Emergency Contacts: Up to 5 trusted contacts`,
        },
        {
            title: '3. Purpose of Data Processing',
            content: `Your data is processed for:\n\n• Account Registration & Management\n• Emergency SOS Alerts\n• Safe Route Navigation\n• Fake Call Feature\n• Evidence Capture\n• AI-Powered Assistance\n• Family/Friend Location Sharing\n• Crime Reporting to Authorities`,
        },
        {
            title: '4. Consent Mechanism (DPDP Rules)',
            content: `In compliance with DPDP Rules 2024:\n\n• We provide a standalone consent notice before collecting data\n• You can give, review, manage, and withdraw consent anytime\n• Each purpose requires separate consent\n• You may withdraw consent through App Settings > Privacy\n• Withdrawal takes effect within 72 hours`,
        },
        {
            title: '5. Data Sharing and Disclosure',
            content: `We may share data with:\n\n• Emergency Services (Police, Ambulance) - for SOS response\n• Trusted Contacts - for safety alerts\n• Cloud Service Providers - for data storage\n• Legal Authorities - when required by law\n\nAll third parties are bound by Data Processing Agreements.`,
        },
        {
            title: '6. Data Retention',
            content: `Retention periods:\n\n• Location Data: 24 hours (auto-deleted)\n• Chat Messages: Until user deletes\n• SOS Alerts: 1 year\n• Account Data: Active + 2 years post-deletion\n• Consent Records: Until expiry of limitation period + 1 year`,
        },
        {
            title: '7. Your Rights Under DPDP Act',
            content: `You have the right to:\n\n• Access: Get a copy of your personal data\n• Correction: Request correction of inaccurate data\n• Erasure: Request deletion (Right to be Forgotten)\n• Data Portability: Receive data in machine-readable format\n• Withdraw Consent: At any time\n• Grievance Redressal: File complaints\n\nTo exercise: App Settings > Privacy`,
        },
        {
            title: '8. Security Measures',
            content: `We implement:\n\n• AES-256 encryption for stored data\n• TLS 1.3 for data transmission\n• Biometric authentication\n• Role-based access controls\n• Regular security audits\n• ISO 27001 & SOC 2 compliance`,
        },
        {
            title: '9. Data Breach Notification',
            content: `In case of a personal data breach:\n\n• We will notify the Data Protection Board within 72 hours\n• Affected users will be notified without undue delay\n• We follow CERT-In guidelines (report within 6 hours)\n\nContact: dpo@womensafetyapp.in`,
        },
        {
            title: '10. Grievance Redressal',
            content: `Grievance Officer:\n[Name to be appointed - Resident of India]\n\nTimeline:\n• Acknowledgment: Within 24 hours\n• Resolution: Within 15 days\n\nIf unsatisfied, you may appeal to Grievance Appellate Committee (GAC) within 30 days.\n\nEmail: grievance@womensafetyapp.in`,
        },
        {
            title: '11. Children\'s Data',
            content: `Our App is not intended for children under 18 years. We do not knowingly collect personal data from children. For the Child Care feature, we process only minimum necessary data with parental consent.`,
        },
        {
            title: '12. Updates to This Policy',
            content: `We may update this Policy periodically. Material changes will be notified through the App at least 30 days before taking effect. Your continued use constitutes acceptance.`,
        },
        {
            title: '13. Government Helplines',
            content: `For immediate assistance:\n\n• National Cybercrime Reporting: cybercrime.gov.in\n• Cybercrime Helpline: 1930\n• Women Helpline: 1091\n• Police Emergency: 112\n• CERT-In: incident@cert-in.org.in`,
        },
        {
            title: '14. Contact Information',
            content: `Data Protection Officer: dpo@womensafetyapp.in\n\nGeneral Inquiries: privacy@womensafetyapp.in\n\nRegistered Office:\n[Company Name]\n[Full Address]\nIndia`,
        },
    ];

    const handleLinkPress = (url) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open link');
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { backgroundColor: colors.primary + '15', borderRadius, padding: spacing.lg }]}>
                    <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                        Effective Date: March 12, 2026
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                        Last Updated: March 12, 2026
                    </Text>
                </View>

                <Text style={[styles.intro, { color: colors.text }]}>
                    This Privacy Policy describes how we collect, use, disclose, and safeguard your information
                    when you use our Women Safety App. Please read this privacy policy carefully.
                </Text>

                <Text style={[styles.compliance, { color: colors.primary }]}>
                    ✅ Complies with DPDP Act 2023 & IT Rules 2021 (as amended 2026)
                </Text>

                {sections.map((section, index) => (
                    <View
                        key={index}
                        style={[styles.section, { backgroundColor: colors.card, borderRadius }]}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {section.title}
                        </Text>
                        <Text style={[styles.sectionContent, { color: colors.gray }]}>
                            {section.content}
                        </Text>
                    </View>
                ))}

                <View style={[styles.footerSection, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.footerTitle, { color: colors.text }]}>
                        Related Documents
                    </Text>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => navigation.navigate('TermsOfService')}
                    >
                        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        <Text style={[styles.linkText, { color: colors.primary }]}>
                            Terms of Service
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
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
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    intro: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 16,
        textAlign: 'justify',
    },
    compliance: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    section: {
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'justify',
    },
    footerSection: {
        padding: 16,
        marginTop: 8,
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    linkText: {
        flex: 1,
        fontSize: 15,
        marginLeft: 12,
    },
    bottomPadding: {
        height: 40,
    },
});

export default PrivacyPolicyScreen;
