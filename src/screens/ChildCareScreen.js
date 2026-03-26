import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ChildCareScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const children = [];
    const schedules = [
        { id: 1, title: 'School Pickup', time: '3:30 PM', child: 'Aarav', type: 'pickup', color: '#10B981' },
        { id: 2, title: 'Dance Class', time: '5:00 PM', child: 'Aarav', type: 'activity', color: '#8B5CF6' },
        { id: 3, title: 'Homework', time: '6:30 PM', child: 'Priya', type: 'study', color: '#3B82F6' },
    ];
    const alerts = [
        { id: 1, title: 'School Arrived', message: 'Aarav arrived at school', time: '8:15 AM', icon: 'school', color: '#10B981' },
        { id: 2, title: 'Location Update', message: 'Priya is at home', time: '4:30 PM', icon: 'location', color: '#3B82F6' },
    ];

    const features = [
        { icon: 'trending-up', label: 'Growth', color: '#10B981' },
        { icon: 'medical', label: 'Health', color: '#EF4444' },
        { icon: 'school', label: 'School', color: '#3B82F6' },
        { icon: 'shield-checkmark', label: 'Safety', color: '#8B5CF6' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#EC4899' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="happy" size={36} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Child Care</Text>
                <Text style={styles.headerSubtitle}>Track schedules & monitor children</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statNum, { color: '#EC4899' }]}>{children.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Children</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statNum, { color: '#10B981' }]}>{schedules.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Schedules</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statNum, { color: '#EF4444' }]}>{alerts.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Alerts</Text>
                    </View>
                </View>

                {children.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, ...shadows.md }]}>
                        <Ionicons name="people" size={48} color={colors.gray} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Children Added</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Add your children to track their schedules</Text>
                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#EC4899' }]}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addBtnText}>Add Child</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
                {schedules.map((item) => (
                    <View key={item.id} style={[styles.scheduleCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={[styles.scheduleTime, { backgroundColor: item.color + '15' }]}>
                            <Text style={[styles.scheduleTimeText, { color: item.color }]}>{item.time}</Text>
                        </View>
                        <View style={styles.scheduleContent}>
                            <Text style={[styles.scheduleTitle, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.scheduleChild, { color: colors.gray }]}>{item.child}</Text>
                        </View>
                        <View style={[styles.checkBtn, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name="checkmark" size={18} color={item.color} />
                        </View>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Alerts</Text>
                {alerts.map((item) => (
                    <View key={item.id} style={[styles.alertCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={[styles.alertIcon, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={styles.alertContent}>
                            <Text style={[styles.alertTitle, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.alertMessage, { color: colors.gray }]}>{item.message}</Text>
                        </View>
                        <Text style={[styles.alertTime, { color: colors.gray }]}>{item.time}</Text>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feat, i) => (
                        <TouchableOpacity key={i} style={[styles.featureCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                            <View style={[styles.featureIcon, { backgroundColor: feat.color + '15' }]}>
                                <Ionicons name={feat.icon} size={24} color={feat.color} />
                            </View>
                            <Text style={[styles.featureLabel, { color: colors.text }]}>{feat.label}</Text>
                        </TouchableOpacity>
                    ))}
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
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 18, borderRadius: 16 },
    statNum: { fontSize: 26, fontWeight: '800' },
    statLabel: { fontSize: 12, marginTop: 4 },
    emptyCard: { padding: 32, borderRadius: 20, alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtitle: { fontSize: 14, marginTop: 6, textAlign: 'center' },
    addBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, gap: 8 },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14, marginTop: 8 },
    scheduleCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10 },
    scheduleTime: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    scheduleTimeText: { fontSize: 13, fontWeight: '700' },
    scheduleContent: { flex: 1, marginLeft: 14 },
    scheduleTitle: { fontSize: 15, fontWeight: '600' },
    scheduleChild: { fontSize: 12, marginTop: 2 },
    checkBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    alertCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10 },
    alertIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    alertContent: { flex: 1, marginLeft: 12 },
    alertTitle: { fontSize: 14, fontWeight: '600' },
    alertMessage: { fontSize: 12, marginTop: 2 },
    alertTime: { fontSize: 11 },
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    featureCard: { width: '47%', alignItems: 'center', padding: 20, borderRadius: 16 },
    featureIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    featureLabel: { fontSize: 14, fontWeight: '600' },
    bottomPadding: { height: 30 },
});

export default ChildCareScreen;
