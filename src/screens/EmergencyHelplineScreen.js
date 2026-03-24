import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const EmergencyHelplineScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const helplines = [
        {
            id: '1',
            name: 'Police Emergency',
            number: '112',
            description: 'All emergency services (Police, Fire, Ambulance)',
            icon: 'call-emergency',
            color: '#D32F2F',
            available: '24/7',
            action: () => Linking.openURL('tel:112'),
        },
        {
            id: '2',
            name: 'Women Helpline',
            number: '1091',
            description: 'For women in distress',
            icon: 'woman',
            color: '#E91E63',
            available: '24/7',
            action: () => Linking.openURL('tel:1091'),
        },
        {
            id: '3',
            name: 'Cybercrime Helpline',
            number: '1930',
            description: 'For cybercrimes and online fraud',
            icon: 'globe',
            color: '#1976D2',
            available: '24/7',
            action: () => Linking.openURL('tel:1930'),
        },
        {
            id: '4',
            name: 'National Emergency Number',
            number: '112',
            description: 'Pan-India emergency response',
            icon: 'alert-circle',
            color: '#FF5722',
            available: '24/7',
            action: () => Linking.openURL('tel:112'),
        },
        {
            id: '5',
            name: 'NCRB Cybercrime',
            number: 'Portal',
            description: 'Report cybercrimes online',
            icon: 'globe-outline',
            color: '#9C27B0',
            available: '24/7',
            action: () => Linking.openURL('https://cybercrime.gov.in'),
        },
        {
            id: '6',
            name: 'SHe-Box',
            number: 'Portal',
            description: 'Workplace sexual harassment complaints',
            icon: 'business',
            color: '#00BCD4',
            available: '24/7',
            action: () => Linking.openURL('https://shebox.nic.in'),
        },
        {
            id: '7',
            name: 'Child Helpline',
            number: '1098',
            description: 'For children in need of care',
            icon: 'people',
            color: '#4CAF50',
            available: '24/7',
            action: () => Linking.openURL('tel:1098'),
        },
        {
            id: '8',
            name: 'Senior Citizen Helpline',
            number: '1450',
            description: 'For elderly persons',
            icon: 'heart',
            color: '#795548',
            available: '24/7',
            action: () => Linking.openURL('tel:1450'),
        },
    ];

    const reportOptions = [
        {
            id: 'cybercrime',
            title: 'Report Cybercrime',
            description: 'File a complaint for online harassment, fraud, or cyber threats',
            icon: 'shield-checkmark',
            color: '#1976D2',
            action: () => Linking.openURL('https://cybercrime.gov.in'),
        },
        {
            id: 'shebox',
            title: 'Workplace Harassment',
            description: 'Complaint portal for sexual harassment at workplace',
            icon: 'business-outline',
            color: '#E91E63',
            action: () => Linking.openURL('https://shebox.nic.in'),
        },
        {
            id: 'missing',
            title: 'Missing Persons',
            description: 'Report missing persons to police',
            icon: 'person-search',
            color: '#FF5722',
            action: () => Linking.openURL('https://tracker.missingpersons.gov.in'),
        },
    ];

    const handleCall = (number) => {
        Linking.openURL(`tel:${number}`).catch(() => {
            Alert.alert('Error', 'Could not make call. Please try manually.');
        });
    };

    const renderHelplineCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.helplineCard, { backgroundColor: colors.card, borderRadius }]}
            onPress={item.action}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.helplineContent}>
                <Text style={[styles.helplineName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.helplineDesc, { color: colors.gray }]}>{item.description}</Text>
                <View style={styles.availabilityRow}>
                    <Text style={[styles.availability, { color: colors.success }]}>✓ {item.available}</Text>
                </View>
            </View>
            <View style={[styles.callButton, { backgroundColor: item.color }]}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.callText}>{item.number}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderReportOption = ({ item }) => (
        <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: colors.card, borderRadius }]}
            onPress={item.action}
            activeOpacity={0.7}
        >
            <View style={[styles.reportIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.reportContent}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.reportDesc, { color: colors.gray }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Emergency Banner */}
                <View style={[styles.emergencyBanner, { backgroundColor: colors.error }]}>
                    <Ionicons name="warning" size={32} color="#FFFFFF" />
                    <View style={styles.bannerText}>
                        <Text style={styles.bannerTitle}>In Emergency?</Text>
                        <Text style={styles.bannerSubtitle}>Tap any number to call immediately</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: '#D32F2F' }]}
                        onPress={() => Linking.openURL('tel:112')}
                    >
                        <Ionicons name="call" size={24} color="#FFFFFF" />
                        <Text style={styles.quickText}>Call 112</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: '#E91E63' }]}
                        onPress={() => Linking.openURL('tel:1091')}
                    >
                        <Ionicons name="woman" size={24} color="#FFFFFF" />
                        <Text style={styles.quickText}>Women 1091</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: '#1976D2' }]}
                        onPress={() => Linking.openURL('tel:1930')}
                    >
                        <Ionicons name="globe" size={24} color="#FFFFFF" />
                        <Text style={styles.quickText}>Cyber 1930</Text>
                    </TouchableOpacity>
                </View>

                {/* Emergency Helplines Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Emergency Helplines
                </Text>
                <FlatList
                    data={helplines}
                    renderItem={renderHelplineCard}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                />

                {/* Report Online Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Report Online
                </Text>
                <FlatList
                    data={reportOptions}
                    renderItem={renderReportOption}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                />

                {/* Info Section */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '10', borderRadius, borderColor: colors.primary }]}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        For immediate danger, always dial 112. The app is a safety tool and does not replace
                        professional emergency services.
                    </Text>
                </View>

                {/* CERT-In Contact */}
                <View style={[styles.certCard, { backgroundColor: colors.card, borderRadius }]}>
                    <Text style={[styles.certTitle, { color: colors.text }]}>
                        <Ionicons name="shield" size={16} color={colors.primary} /> CERT-In (Cybersecurity)
                    </Text>
                    <Text style={[styles.certText, { color: colors.gray }]}>
                        For cybersecurity incidents: incident@cert-in.org.in
                    </Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('mailto:incident@cert-in.org.in')}
                        style={styles.certButton}
                    >
                        <Text style={[styles.certLink, { color: colors.primary }]}>
                            Email CERT-In →
                        </Text>
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
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    bannerText: {
        marginLeft: 16,
        flex: 1,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    bannerSubtitle: {
        color: '#FFFFFF',
        fontSize: 13,
        opacity: 0.9,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    quickButton: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    quickText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 8,
    },
    listContent: {
        paddingBottom: 8,
    },
    helplineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helplineContent: {
        flex: 1,
        marginLeft: 12,
    },
    helplineName: {
        fontSize: 15,
        fontWeight: '600',
    },
    helplineDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    availabilityRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    availability: {
        fontSize: 11,
        fontWeight: '500',
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    callText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 4,
    },
    reportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
    },
    reportIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportContent: {
        flex: 1,
        marginLeft: 12,
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    reportDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        lineHeight: 18,
    },
    certCard: {
        padding: 16,
        marginTop: 16,
    },
    certTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    certText: {
        fontSize: 12,
        marginTop: 4,
    },
    certButton: {
        marginTop: 8,
    },
    certLink: {
        fontSize: 13,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 40,
    },
});

export default EmergencyHelplineScreen;
