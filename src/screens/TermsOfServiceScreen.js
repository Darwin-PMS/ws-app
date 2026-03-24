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

const TermsOfServiceScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: `By downloading, installing, accessing, or using the Women Safety App, you acknowledge that you have read, understood, and agree to be bound by these Terms. You must be at least 18 years of age to use this App.`,
        },
        {
            title: '2. Description of Services',
            content: `Our App provides:\n\n• Emergency Assistance: SOS alerts, emergency contacts\n• Location Services: Real-time sharing, safe routes\n• Evidence Capture: Photo/video recording\n• AI Assistance: Safety tips, threat detection\n• Fake Call: Simulated incoming calls\n• Family Safety: Location sharing\n• Information: Safety laws, news, tutorials`,
        },
        {
            title: '3. User Registration',
            content: `To access features, you must create an account by providing:\n\n• Valid phone number (required)\n• Email address (optional)\n• Basic profile information\n\nYou are responsible for maintaining account confidentiality and all activities under your account.`,
        },
        {
            title: '4. Prohibited Activities',
            content: `You shall NOT:\n\n• Impersonate any person\n• Violate privacy of any individual\n• Post obscene or sexually explicit content\n• Harass on basis of gender\n• Share non-consensual intimate imagery\n• Create deepfake/synthetic content\n• Defame or spread hate speech\n• Use for illegal activities\n• Submit false emergency alerts\n• Attempt to reverse engineer the App`,
        },
        {
            title: '5. Emergency Features Disclaimer',
            content: `⚠️ IMPORTANT DISCLAIMERS:\n\n• The App is NOT a substitute for emergency services\n• We do NOT guarantee emergency alerts will be received\n• Location data may not always be accurate\n• Response times depend on local authorities\n• You are responsible for taking personal safety precautions\n\nThis is a safety assistance tool only.`,
        },
        {
            title: '6. Intellectual Property',
            content: `The App, including all content, features, and technology, is owned by [Company Name] and protected by copyright and trademark laws. You may not copy, modify, distribute, or reverse engineer the App without authorization.`,
        },
        {
            title: '7. User-Generated Content',
            content: `By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content. You represent that you own or have rights to your content.`,
        },
        {
            title: '8. Privacy & Data Protection',
            content: `Your privacy is protected under the Digital Personal Data Protection Act, 2023. By using the App, you consent to collection and processing of your personal data as described in our Privacy Policy.\n\nAccess: App Settings > Privacy`,
        },
        {
            title: '9. Third-Party Services',
            content: `The App may include links to third-party services including:\n\n• Government portals (cybercrime.gov.in, 1930)\n• Social media platforms\n• Analytics providers\n\nWe do not endorse or assume responsibility for third-party services.`,
        },
        {
            title: '10. Termination',
            content: `We may terminate or suspend your account for:\n\n• Violation of these Terms\n• Illegal or unauthorized use\n• Security reasons\n• Extended inactivity\n\nYou may also delete your account at any time through App Settings.`,
        },
        {
            title: '11. Limitation of Liability',
            content: `⚠️ KEY LIMITATIONS:\n\nTHE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES.\n\nWe are NOT liable for:\n• Failure or delay in emergency response\n• Outcomes from using emergency features\n• Acts of emergency services\n• Inability to prevent harmful situations\n\nTotal liability capped at ₹10,000 or amount paid in past 12 months.`,
        },
        {
            title: '12. Indemnification',
            content: `You agree to indemnify and hold us harmless from any claims, liabilities, damages, or expenses arising from:\n\n• Your use of the App\n• Your violation of these Terms\n• Your violation of third-party rights\n• Your content or submissions`,
        },
        {
            title: '13. Dispute Resolution',
            content: `Process:\n\n1. Attempt informal resolution first\n2. Use our Grievance Redressal Mechanism\n3. If unsatisfied, appeal to Grievance Appellate Committee (GAC)\n\nTimeline:\n• Acknowledgment: 24 hours\n• Resolution: 15 days`,
        },
        {
            title: '14. Government Reporting',
            content: `The App integrates with:\n\n• cybercrime.gov.in - Cybercrime reporting\n• 1930 - Cybercrime emergency\n• 1091 - Women Helpline\n• 112 - Police Emergency\n• SHe-Box - Workplace harassment\n\nWe are not responsible for government service availability.`,
        },
        {
            title: '15. Changes to Terms',
            content: `We may modify these Terms at any time. Material changes will be notified through the App at least 30 days before taking effect. Your continued use after notice constitutes acceptance.`,
        },
        {
            title: '16. Contact Information',
            content: `General Inquiries: support@womensafetyapp.in\n\nGrievance Officer: grievance@womensafetyapp.in\n\nData Protection Officer: dpo@womensafetyapp.in\n\nRegistered Office:\n[Company Name]\n[Full Address]\nIndia`,
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
                    <Ionicons name="document-text" size={48} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                        Effective Date: March 12, 2026
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.gray }]}>
                        Last Updated: March 12, 2026
                    </Text>
                </View>

                <Text style={[styles.intro, { color: colors.text }]}>
                    Please read these Terms of Service carefully before using our Women Safety App.
                    These terms govern your use of the App and constitute a legal agreement.
                </Text>

                <Text style={[styles.warning, { color: colors.error }]}>
                    ⚠️ Important: This App is a safety assistance tool and NOT a substitute for
                    professional emergency services. Always dial 112 for emergencies.
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

                <View style={[styles.acknowledgment, { backgroundColor: colors.primary + '10', borderRadius, borderColor: colors.primary, borderWidth: 1 }]}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    <Text style={[styles.ackTitle, { color: colors.text }]}>
                        Acknowledgment
                    </Text>
                    <Text style={[styles.ackContent, { color: colors.gray }]}>
                        By using this App, you acknowledge that you have read, understood, and agree
                        to be bound by these Terms. You confirm you are at least 18 years of age
                        and have legal capacity to enter this agreement.
                    </Text>
                </View>

                <View style={[styles.footerSection, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.footerTitle, { color: colors.text }]}>
                        Related Documents
                    </Text>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                        <Ionicons name="shield-outline" size={20} color={colors.primary} />
                        <Text style={[styles.linkText, { color: colors.primary }]}>
                            Privacy Policy
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
    warning: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        lineHeight: 20,
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
    acknowledgment: {
        padding: 16,
        marginTop: 8,
        marginBottom: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        borderWidth: 1,
    },
    ackTitle: {
        fontSize: 15,
        fontWeight: '600',
        width: '100%',
        marginTop: 8,
        marginBottom: 4,
    },
    ackContent: {
        fontSize: 12,
        lineHeight: 18,
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

export default TermsOfServiceScreen;
