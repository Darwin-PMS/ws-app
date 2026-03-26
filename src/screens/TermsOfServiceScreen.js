import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TermsOfServiceScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const sections = [
        { title: '1. Acceptance', content: 'By downloading or using the Women Safety App, you agree to be bound by these Terms. You must be at least 18 years of age.' },
        { title: '2. Services', content: '• Emergency SOS alerts\n• Real-time location sharing\n• Evidence capture (photo/video)\n• AI safety assistance\n• Fake call simulation\n• Family safety features' },
        { title: '3. User Account', content: 'Create an account with valid phone number. You are responsible for maintaining account confidentiality and all activities under your account.' },
        { title: '4. Prohibited Use', content: 'You shall NOT: Impersonate others, violate privacy, post obscene content, harass on basis of gender, submit false emergency alerts, or use for illegal activities.' },
        { title: '5. Emergency Disclaimer', content: '⚠️ IMPORTANT: The App is NOT a substitute for emergency services. This is a safety assistance tool only. Always dial 112 for emergencies.' },
        { title: '6. Limitation of Liability', content: 'The App is provided "AS IS" without warranties. We are NOT liable for failure or delay in emergency response. Total liability capped at ₹10,000.' },
        { title: '7. Termination', content: 'We may terminate accounts for violation of Terms, illegal use, security reasons, or extended inactivity.' },
        { title: '8. Contact', content: 'Support: support@womensafetyapp.in\nGrievance: grievance@womensafetyapp.in' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#3B82F6' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="document-text" size={40} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <Text style={styles.headerSubtitle}>Last Updated: March 2026</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.warningCard, { backgroundColor: '#EF444415', borderColor: '#EF4444' }]}>
                    <Ionicons name="warning" size={22} color="#EF4444" />
                    <Text style={[styles.warningText, { color: '#EF4444' }]}>This App is a safety tool, NOT a substitute for emergency services. Always dial 112.</Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={[styles.section, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <Text style={[styles.sectionContent, { color: colors.gray }]}>{section.content}</Text>
                    </View>
                ))}

                <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.card, ...shadows.sm }]} onPress={() => navigation.navigate('PrivacyPolicy')}>
                    <Ionicons name="shield-outline" size={24} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.text }]}>Privacy Policy</Text>
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
    warningCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16, gap: 10 },
    warningText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
    section: { padding: 16, borderRadius: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    sectionContent: { fontSize: 13, lineHeight: 20 },
    linkCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 4, gap: 12 },
    linkText: { flex: 1, fontSize: 15, fontWeight: '500' },
    bottomPadding: { height: 30 },
});

export default TermsOfServiceScreen;
