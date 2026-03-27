import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AboutAppScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const coreValues = [
        { icon: 'shield-checkmark', title: 'Safety First', desc: 'Every feature is designed with your safety as the top priority' },
        { icon: 'people', title: 'Community Driven', desc: 'Built with input from safety experts and survivors' },
        { icon: 'lock-closed', title: 'Privacy Protected', desc: 'Your data stays encrypted and under your control' },
        { icon: 'accessibility', title: 'Accessible', desc: 'Designed for everyone, everywhere, anytime' },
    ];

    const features = [
        { icon: 'warning', title: 'SOS Alerts', desc: 'One-tap emergency alerts to contacts and authorities' },
        { icon: 'location', title: 'Live Location', desc: 'Share real-time location with trusted contacts' },
        { icon: 'navigate', title: 'Safe Routes', desc: 'AI-powered safe route suggestions' },
        { icon: 'call', title: 'Fake Call', desc: 'Discreet escape with simulated incoming calls' },
        { icon: 'videocam', title: 'Live Share', desc: 'Stream camera feed to emergency contacts' },
        { icon: 'scan', title: 'Vision AI', desc: 'AI-powered image analysis for threat detection' },
        { icon: 'musical-notes', title: 'Audio Evidence', desc: 'Discreet audio recording in emergencies' },
        { icon: 'people-circle', title: 'Family Circle', desc: 'Stay connected with your loved ones' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#EC4899' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="heart" size={40} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>About Us</Text>
                <Text style={styles.headerSubtitle}>Your Safety, Our Mission</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.missionCard, { backgroundColor: colors.card, ...shadows.md }]}>
                    <View style={[styles.missionIcon, { backgroundColor: '#EC489920' }]}>
                        <Ionicons name="flag" size={28} color="#EC4899" />
                    </View>
                    <Text style={[styles.missionTitle, { color: colors.text }]}>Our Mission</Text>
                    <Text style={[styles.missionText, { color: colors.gray }]}>
                        To empower women with technology that enhances their safety, independence, and confidence in daily life. We believe every woman deserves to feel secure, whether at home, work, or on the go.
                    </Text>
                </View>

                <View style={[styles.visionCard, { backgroundColor: colors.card, ...shadows.md }]}>
                    <View style={[styles.visionIcon, { backgroundColor: '#8B5CF620' }]}>
                        <Ionicons name="eye" size={28} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.visionTitle, { color: colors.text }]}>Our Vision</Text>
                    <Text style={[styles.visionText, { color: colors.gray }]}>
                        A world where no woman has to compromise her freedom or safety. We envision a future where technology acts as a silent guardian, enabling women to live boldly without fear.
                    </Text>
                </View>

                <View style={[styles.goalCard, { backgroundColor: colors.card, ...shadows.md }]}>
                    <View style={[styles.goalIcon, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="trophy" size={28} color="#10B981" />
                    </View>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>Our Goals</Text>
                    <View style={styles.goalsList}>
                        <Text style={[styles.goalItem, { color: colors.gray }]}>
                            • Create India's most trusted women safety platform
                        </Text>
                        <Text style={[styles.goalItem, { color: colors.gray }]}>
                            • Reduce response time to emergency situations
                        </Text>
                        <Text style={[styles.goalItem, { color: colors.gray }]}>
                            • Build a community of informed and prepared women
                        </Text>
                        <Text style={[styles.goalItem, { color: colors.gray }]}>
                            • Integrate with government emergency services
                        </Text>
                        <Text style={[styles.goalItem, { color: colors.gray }]}>
                            • Make safety accessible in regional languages
                        </Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Values</Text>
                {coreValues.map((value, index) => (
                    <View key={index} style={[styles.valueCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={[styles.valueIcon, { backgroundColor: '#EC489915' }]}>
                            <Ionicons name={value.icon} size={22} color="#EC4899" />
                        </View>
                        <View style={styles.valueContent}>
                            <Text style={[styles.valueTitle, { color: colors.text }]}>{value.title}</Text>
                            <Text style={[styles.valueDesc, { color: colors.gray }]}>{value.desc}</Text>
                        </View>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
                {features.map((feature, index) => (
                    <View key={index} style={[styles.featureCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={[styles.featureIcon, { backgroundColor: '#3B82F615' }]}>
                            <Ionicons name={feature.icon} size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureDesc, { color: colors.gray }]}>{feature.desc}</Text>
                        </View>
                    </View>
                ))}

                <View style={[styles.statsCard, { backgroundColor: '#EC4899' }]}>
                    <Text style={styles.statsTitle}>Making a Difference</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>50K+</Text>
                            <Text style={styles.statLabel}>Active Users</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1K+</Text>
                            <Text style={styles.statLabel}>Emergencies Averted</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>24/7</Text>
                            <Text style={styles.statLabel}>Support Available</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.contactCard, { backgroundColor: colors.card, ...shadows.md }]}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>Contact Us</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@safeher.in')}>
                        <Ionicons name="mail-outline" size={20} color="#EC4899" />
                        <Text style={[styles.contactText, { color: colors.primary }]}>support@safeher.in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+919876543210')}>
                        <Ionicons name="call-outline" size={20} color="#EC4899" />
                        <Text style={[styles.contactText, { color: colors.primary }]}>+91 98765 43210</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://safeher.in')}>
                        <Ionicons name="globe-outline" size={20} color="#EC4899" />
                        <Text style={[styles.contactText, { color: colors.primary }]}>www.safeher.in</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.versionCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                    <View style={styles.versionRow}>
                        <View style={styles.versionLeft}>
                            <Text style={[styles.appName, { color: colors.text }]}>SafeHer</Text>
                            <Text style={[styles.appVersion, { color: colors.gray }]}>Version 1.0.0</Text>
                        </View>
                        <View style={styles.versionRight}>
                            <Text style={[styles.buildLabel, { color: colors.gray }]}>Built with</Text>
                            <Text style={[styles.buildText, { color: '#EC4899' }]}>❤️ for Women Safety</Text>
                        </View>
                    </View>
                </View>

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
    missionCard: { padding: 20, borderRadius: 20, marginBottom: 12, alignItems: 'center' },
    missionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    missionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    missionText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
    visionCard: { padding: 20, borderRadius: 20, marginBottom: 12, alignItems: 'center' },
    visionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    visionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    visionText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
    goalCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
    goalIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    goalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    goalsList: { gap: 8 },
    goalItem: { fontSize: 14, lineHeight: 22 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    valueCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10, gap: 14 },
    valueIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    valueContent: { flex: 1 },
    valueTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    valueDesc: { fontSize: 13 },
    featureCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, gap: 12 },
    featureIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    featureContent: { flex: 1 },
    featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    featureDesc: { fontSize: 12 },
    statsCard: { padding: 24, borderRadius: 20, marginVertical: 16 },
    statsTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    statItem: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
    statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
    contactCard: { padding: 20, borderRadius: 20, marginVertical: 12 },
    contactTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    contactText: { fontSize: 14 },
    versionCard: { padding: 18, borderRadius: 16, marginTop: 12 },
    versionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    versionLeft: {},
    appName: { fontSize: 18, fontWeight: '700' },
    appVersion: { fontSize: 12, marginTop: 2 },
    versionRight: { alignItems: 'flex-end' },
    buildLabel: { fontSize: 11 },
    buildText: { fontSize: 13, fontWeight: '600' },
    bottomPadding: { height: 30 },
});

export default AboutAppScreen;
