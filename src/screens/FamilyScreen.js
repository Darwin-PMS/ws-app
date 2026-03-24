import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
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
            console.log('═══════════════════════════════════════ count of family members in family list and also on click list member of that family');
            console.log('Family Data:', response);
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
        switch (role?.toLowerCase()) {
            case 'head': return 'shield';
            case 'father': return 'man';
            case 'mother': return 'woman';
            case 'son': return 'male';
            case 'daughter': return 'female';
            default: return 'person';
        }
    };

    const handleFamilyPress = (family) => {
        navigation.navigate('FamilyDetails', { familyId: family.id });
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (families.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Ionicons name="people-outline" size={64} color={colors.gray} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Family Group</Text>
                <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Create a family group to connect with your loved ones</Text>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('CreateFamily')}
                >
                    <Text style={[styles.createButtonText, { color: colors.white }]}>Create Family</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={[styles.headerTitle, { color: colors.white }]}>My Families</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>{families.length} family group{families.length !== 1 ? 's' : ''}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Family List</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateFamily')}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {families.map((family) => (
                    <TouchableOpacity
                        key={family.id}
                        style={[styles.familyCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                        onPress={() => handleFamilyPress(family)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.familyIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="people" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.familyInfo}>
                            <Text style={[styles.familyName, { color: colors.text }]}>
                                {family.name}
                            </Text>
                            <Text style={[styles.familyRole, { color: colors.gray }]}>
                                {family.member_count || 0} members
                            </Text>
                            {family.member_role && (
                                <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name={getRoleIcon(family.member_role)} size={12} color={colors.primary} />
                                    <Text style={[styles.roleText, { color: colors.primary }]}>
                                        {family.member_role}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.gray} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    familyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    familyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    familyName: {
        fontSize: 16,
        fontWeight: '600',
    },
    familyRole: {
        fontSize: 14,
        marginTop: 2,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
    },
    roleText: {
        fontSize: 12,
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    createButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FamilyScreen;
