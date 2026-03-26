import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const EmergencyHelplineScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const helplines = [
        { id: '1', name: 'Police Emergency', number: '112', description: 'All emergency services (Police, Fire, Ambulance)', icon: 'call', color: '#DC2626', action: () => Linking.openURL('tel:112') },
        { id: '2', name: 'Women Helpline', number: '1091', description: 'For women in distress', icon: 'woman', color: '#EC4899', action: () => Linking.openURL('tel:1091') },
        { id: '3', name: 'Cybercrime Helpline', number: '1930', description: 'For cybercrimes and online fraud', icon: 'globe', color: '#2563EB', action: () => Linking.openURL('tel:1930') },
        { id: '4', name: 'National Emergency', number: '112', description: 'Pan-India emergency response', icon: 'alert-circle', color: '#EA580C', action: () => Linking.openURL('tel:112') },
        { id: '5', name: 'NCRB Cybercrime', number: 'Portal', description: 'Report cybercrimes online', icon: 'globe-outline', color: '#7C3AED', action: () => Linking.openURL('https://cybercrime.gov.in') },
        { id: '6', name: 'SHe-Box', number: 'Portal', description: 'Workplace harassment complaints', icon: 'business', color: '#0891B2', action: () => Linking.openURL('https://shebox.nic.in') },
        { id: '7', name: 'Child Helpline', number: '1098', description: 'For children in need of care', icon: 'people', color: '#16A34A', action: () => Linking.openURL('tel:1098') },
        { id: '8', name: 'Senior Citizen', number: '1450', description: 'For elderly persons', icon: 'heart', color: '#92400E', action: () => Linking.openURL('tel:1450') },
    ];

    const reportOptions = [
        { id: 'cybercrime', title: 'Report Cybercrime', description: 'File complaint for online harassment', icon: 'shield-checkmark', color: '#2563EB', action: () => Linking.openURL('https://cybercrime.gov.in') },
        { id: 'shebox', title: 'Workplace Harassment', description: 'Sexual harassment at workplace', icon: 'business-outline', color: '#EC4899', action: () => Linking.openURL('https://shebox.nic.in') },
        { id: 'missing', title: 'Missing Persons', description: 'Report missing persons', icon: 'person', color: '#EA580C', action: () => Linking.openURL('https://tracker.missingpersons.gov.in') },
    ];

    const quickActions = [
        { label: 'Police 112', icon: 'shield', color: '#DC2626', action: () => Linking.openURL('tel:112') },
        { label: 'Women 1091', icon: 'woman', color: '#EC4899', action: () => Linking.openURL('tel:1091') },
        { label: 'Cyber 1930', icon: 'globe', color: '#2563EB', action: () => Linking.openURL('tel:1930') },
        { label: 'Child 1098', icon: 'people', color: '#16A34A', action: () => Linking.openURL('tel:1098') },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.error }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Emergency Helplines</Text>
                        <Text style={styles.headerSubtitle}>Available 24/7 for your safety</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.headerBadgeText}>24/7 Active</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.quickActionsContainer}>
                        {quickActions.map((action) => (
                            <TouchableOpacity key={action.label} style={[styles.quickActionBtn, { backgroundColor: action.color }]} onPress={action.action} activeOpacity={0.8}>
                                <Ionicons name={action.icon} size={24} color="#fff" />
                                <Text style={styles.quickActionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.error + '15' }]}>
                                <Ionicons name="call" size={18} color={colors.error} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Call Helplines</Text>
                        </View>
                        {helplines.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.helplineCard, { backgroundColor: colors.card, ...shadows.md }]} onPress={item.action} activeOpacity={0.7}>
                                <View style={[styles.cardIcon, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={24} color={item.color} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                                    <Text style={[styles.cardDesc, { color: colors.gray }]}>{item.description}</Text>
                                    <View style={styles.cardMeta}>
                                        <View style={[styles.availabilityBadge, { backgroundColor: colors.success + '15' }]}>
                                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                            <Text style={[styles.availabilityText, { color: colors.success }]}>Available</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[styles.callBtn, { backgroundColor: item.color }]}>
                                    <Ionicons name={item.number === 'Portal' ? 'open-outline' : 'call'} size={16} color="#fff" />
                                    <Text style={styles.callBtnText}>{item.number}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="document-text" size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Online</Text>
                        </View>
                        {reportOptions.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.reportCard, { backgroundColor: colors.card, ...shadows.md }]} onPress={item.action} activeOpacity={0.7}>
                                <View style={[styles.reportIcon, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <View style={styles.reportContent}>
                                    <Text style={[styles.reportTitle, { color: colors.text }]}>{item.title}</Text>
                                    <Text style={[styles.reportDesc, { color: colors.gray }]}>{item.description}</Text>
                                </View>
                                <Ionicons name="open-outline" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' }]}>
                        <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="information-circle" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoTitle, { color: colors.text }]}>Important Notice</Text>
                            <Text style={[styles.infoText, { color: colors.gray }]}>
                                For immediate danger, always dial 112. This app is a safety tool and does not replace professional emergency services.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.certCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <View style={styles.certHeader}>
                            <View style={[styles.certIcon, { backgroundColor: colors.success + '15' }]}>
                                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                            </View>
                            <View>
                                <Text style={[styles.certTitle, { color: colors.text }]}>CERT-In Cybersecurity</Text>
                                <Text style={[styles.certSubtitle, { color: colors.gray }]}>Official Government Agency</Text>
                            </View>
                        </View>
                        <Text style={[styles.certEmail, { color: colors.primary }]}>incident@cert-in.org.in</Text>
                        <TouchableOpacity style={[styles.certBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL('mailto:incident@cert-in.org.in')}>
                            <Ionicons name="mail" size={16} color="#fff" />
                            <Text style={styles.certBtnText}>Contact via Email</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    headerBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    scrollView: { flex: 1 },
    content: { padding: 16 },
    quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    quickActionBtn: { width: (width - 52) / 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    quickActionLabel: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 8 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    sectionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    helplineCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10 },
    cardIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, marginLeft: 14 },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardDesc: { fontSize: 12, marginTop: 2 },
    cardMeta: { flexDirection: 'row', marginTop: 6 },
    availabilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
    availabilityText: { fontSize: 10, fontWeight: '600' },
    callBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, gap: 6 },
    callBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    reportCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10 },
    reportIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    reportContent: { flex: 1, marginLeft: 14 },
    reportTitle: { fontSize: 15, fontWeight: '600' },
    reportDesc: { fontSize: 12, marginTop: 2 },
    infoCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
    infoIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1, marginLeft: 14 },
    infoTitle: { fontSize: 15, fontWeight: '600' },
    infoText: { fontSize: 13, marginTop: 4, lineHeight: 18 },
    certCard: { padding: 18, borderRadius: 16 },
    certHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    certIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    certTitle: { fontSize: 16, fontWeight: '600' },
    certSubtitle: { fontSize: 12, marginTop: 2 },
    certEmail: { fontSize: 14, marginBottom: 14 },
    certBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    certBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    bottomPadding: { height: 40 },
});

export default EmergencyHelplineScreen;
