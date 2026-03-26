import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const sections = [
        { title: '1. Introduction', content: 'This Privacy Policy governs the collection, processing, storage, use, and disclosure of personal data by Women Safety App, ensuring compliance with DPDP Act 2023.' },
        { title: '2. Data We Collect', content: '• Identity: Name, phone, email, DOB, gender\n• Location: Real-time GPS, saved locations, routes\n• Media: Photos, videos for evidence\n• Device: Device ID, OS, app version\n• Emergency Contacts: Up to 5 trusted contacts' },
        { title: '3. Purpose of Processing', content: 'Your data is used for: Account registration, Emergency SOS alerts, Safe route navigation, Fake call feature, Evidence capture, AI assistance, Family location sharing, Crime reporting.' },
        { title: '4. Consent Mechanism', content: '• Standalone consent notice before collecting data\n• Review and withdraw consent anytime\n• Each purpose requires separate consent\n• Withdrawal effective within 72 hours' },
        { title: '5. Data Sharing', content: 'We may share data with: Emergency services (Police, Ambulance), Trusted contacts for safety alerts, Cloud providers for storage, Legal authorities when required.' },
        { title: '6. Your Rights', content: '• Access your personal data\n• Correction of inaccurate data\n• Erasure (Right to be Forgotten)\n• Data portability\n• Withdraw consent\n• File grievances' },
        { title: '7. Security Measures', content: '• AES-256 encryption\n• TLS 1.3 for transmission\n• Biometric authentication\n• Role-based access controls\n• Regular security audits' },
        { title: '8. Data Breach', content: 'We notify Data Protection Board within 72 hours. Affected users notified without undue delay. Contact: dpo@womensafetyapp.in' },
        { title: '9. Contact', content: 'Data Protection Officer: dpo@womensafetyapp.in\nGrievance: grievance@womensafetyapp.in' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#10B981' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="shield-checkmark" size={40} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <Text style={styles.headerSubtitle}>Last Updated: March 2026</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.complianceBadge, { backgroundColor: '#10B98115' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={[styles.complianceText, { color: '#10B981' }]}>Complies with DPDP Act 2023</Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={[styles.section, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <Text style={[styles.sectionContent, { color: colors.gray }]}>{section.content}</Text>
                    </View>
                ))}

                <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.card, ...shadows.sm }]} onPress={() => navigation.navigate('TermsOfService')}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.text }]}>Terms of Service</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    backBtn: { position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    complianceBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, marginBottom: 16, gap: 8 },
    complianceText: { fontSize: 14, fontWeight: '600' },
    section: { padding: 16, borderRadius: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    sectionContent: { fontSize: 13, lineHeight: 20 },
    linkCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 4, gap: 12 },
    linkText: { flex: 1, fontSize: 15, fontWeight: '500' },
    bottomPadding: { height: 30 },
});

export default PrivacyPolicyScreen;
