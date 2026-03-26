import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CommunityScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();

    const features = [
        { id: 'forums', title: 'Community Forums', icon: 'people', color: '#8B5CF6', description: 'Discuss safety topics with others', stats: '1.2K members' },
        { id: 'events', title: 'Safety Events', icon: 'calendar', color: '#EC4899', description: 'Upcoming community events', stats: '5 events this month' },
        { id: 'support', title: 'Support Groups', icon: 'heart', color: '#EF4444', description: 'Connect with others for support', stats: '24/7 available' },
        { id: 'volunteer', title: 'Volunteer', icon: 'hand-left', color: '#10B981', description: 'Join as a volunteer helper', stats: '50+ volunteers' },
    ];

    const recentActivity = [
        { id: 1, user: 'Priya S.', action: 'joined Safety Events', time: '2h ago', avatar: '#EC4899' },
        { id: 2, user: 'Neha K.', action: 'posted in Forums', time: '4h ago', avatar: '#8B5CF6' },
        { id: 3, user: 'Anita R.', action: 'became Volunteer', time: '1d ago', avatar: '#10B981' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Community</Text>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Connect, share, and support each other</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="people-circle" size={48} color="#fff" />
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Welcome to Community</Text>
                        <Text style={styles.heroSubtitle}>Join thousands of members supporting each other</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statValue, { color: '#8B5CF6' }]}>1.2K</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Members</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statValue, { color: '#EC4899' }]}>500+</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Posts</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>50+</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Volunteers</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore</Text>
                {features.map((feature) => (
                    <TouchableOpacity key={feature.id} style={[styles.featureCard, { backgroundColor: colors.card, ...shadows.md }]} activeOpacity={0.7}>
                        <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                            <Ionicons name={feature.icon} size={26} color={feature.color} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureDesc, { color: colors.gray }]}>{feature.description}</Text>
                            <Text style={[styles.featureStats, { color: feature.color }]}>{feature.stats}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color={colors.gray} />
                    </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                {recentActivity.map((item) => (
                    <View key={item.id} style={[styles.activityItem, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={[styles.activityAvatar, { backgroundColor: item.avatar + '20' }]}>
                            <Text style={[styles.activityInitial, { color: item.avatar }]}>{item.user[0]}</Text>
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={[styles.activityText, { color: colors.text }]}><Text style={{ fontWeight: '600' }}>{item.user}</Text> {item.action}</Text>
                            <Text style={[styles.activityTime, { color: colors.gray }]}>{item.time}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
    content: { flex: 1, padding: 16 },
    heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', borderRadius: 20, padding: 20, marginBottom: 16 },
    heroIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
    heroContent: { flex: 1, marginLeft: 16 },
    heroTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
    featureCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
    featureIcon: { width: 54, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    featureContent: { flex: 1, marginLeft: 14 },
    featureTitle: { fontSize: 16, fontWeight: '600' },
    featureDesc: { fontSize: 12, marginTop: 2 },
    featureStats: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    activityItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, gap: 12 },
    activityAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    activityInitial: { fontSize: 16, fontWeight: '700' },
    activityContent: { flex: 1 },
    activityText: { fontSize: 14 },
    activityTime: { fontSize: 11, marginTop: 2 },
    bottomPadding: { height: 20 },
});

export default CommunityScreen;
