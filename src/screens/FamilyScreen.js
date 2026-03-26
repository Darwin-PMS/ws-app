import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const FamilyScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();

    const [families, setFamilies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFamilyData();
    }, []);

    const loadFamilyData = async () => {
        try {
            const response = await familyService.getMyFamilies();
            if (response.success && response.families) {
                setFamilies(response.families);
            }
        } catch (error) {
            console.error('Error loading family:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        const roleMap = { head: 'shield', father: 'man', mother: 'woman', son: 'male', daughter: 'female', spouse: 'heart', sibling: 'people', trusted: 'star' };
        return roleMap[role?.toLowerCase()] || 'person';
    };

    const getRoleColor = (role) => {
        const colorMap = { head: '#EF4444', father: '#3B82F6', mother: '#EC4899', son: '#10B981', daughter: '#8B5CF6', spouse: '#F59E0B', sibling: '#14B8A6', trusted: '#6B7280' };
        return colorMap[role?.toLowerCase()] || colors.primary;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.gray }]}>Loading families...</Text>
            </View>
        );
    }

    if (families.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people-outline" size={64} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Family Groups Yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Create your first family group to stay connected with your loved ones</Text>
                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('CreateFamily')} activeOpacity={0.8}>
                    <Ionicons name="add" size={22} color="#fff" />
                    <Text style={styles.createButtonText}>Create Family</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>My Families</Text>
                        <Text style={styles.headerSubtitle}>{families.length} family group{families.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateFamily')}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.familyList}>
                    {families.map((family) => (
                        <TouchableOpacity key={family.id} style={[styles.familyCard, { backgroundColor: colors.card, ...shadows.md }]} onPress={() => navigation.navigate('FamilyDetails', { familyId: family.id })} activeOpacity={0.7}>
                            <View style={[styles.cardHeader, { backgroundColor: getRoleColor(family.member_role) + '15' }]}>
                                <Ionicons name="people" size={28} color={getRoleColor(family.member_role)} />
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={[styles.familyName, { color: colors.text }]}>{family.name}</Text>
                                <View style={styles.memberInfo}>
                                    <Ionicons name="people-outline" size={16} color={colors.gray} />
                                    <Text style={[styles.memberCount, { color: colors.gray }]}>{family.member_count || 0} members</Text>
                                </View>
                                {family.member_role && (
                                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(family.member_role) + '15' }]}>
                                        <Ionicons name={getRoleIcon(family.member_role)} size={12} color={getRoleColor(family.member_role)} />
                                        <Text style={[styles.roleText, { color: getRoleColor(family.member_role) }]}>{family.member_role}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.cardAction, { backgroundColor: colors.primary + '10' }]}>
                                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.quickActions, { backgroundColor: colors.card, ...shadows.md }]}>
                    <Text style={[styles.quickTitle, { color: colors.text }]}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.primary + '10' }]} onPress={() => navigation.navigate('CreateFamily')}>
                            <Ionicons name="add-circle" size={28} color={colors.primary} />
                            <Text style={[styles.actionText, { color: colors.text }]}>New Family</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: '#10B98120' }]} onPress={() => navigation.navigate('FamilyLocation')}>
                            <Ionicons name="location" size={28} color="#10B981" />
                            <Text style={[styles.actionText, { color: colors.text }]}>Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: '#EC489920' }]} onPress={() => navigation.navigate('More', { screen: 'LiveShare' })}>
                            <Ionicons name="videocam" size={28} color="#EC4899" />
                            <Text style={[styles.actionText, { color: colors.text }]}>Live Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyIconWrapper: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    createButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 8 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, padding: 16 },
    familyList: { marginBottom: 20 },
    familyCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
    cardHeader: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cardBody: { flex: 1, marginLeft: 14 },
    familyName: { fontSize: 17, fontWeight: '600' },
    memberInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    memberCount: { fontSize: 13 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8, gap: 4 },
    roleText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    cardAction: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    quickActions: { padding: 18, borderRadius: 16 },
    quickTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
    actionGrid: { flexDirection: 'row', gap: 12 },
    actionItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14 },
    actionText: { fontSize: 12, fontWeight: '500', marginTop: 8 },
    bottomPadding: { height: 20 },
});

export default FamilyScreen;
