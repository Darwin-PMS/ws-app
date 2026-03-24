import React, { useState } from 'react';
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
import databaseService from '../services/databaseService';

const ROLES = [
    { id: 'mother', label: 'Mother', icon: 'woman', description: 'Primary caregiver and family manager' },
    { id: 'father', label: 'Father', icon: 'man', description: 'Family protector and provider' },
    { id: 'daughter', label: 'Daughter', icon: 'female', description: 'Child/teen family member' },
    { id: 'son', label: 'Son', icon: 'male', description: 'Child/teen family member' },
    { id: 'grandmother', label: 'Grandmother', icon: 'woman', description: 'Elder family member' },
    { id: 'grandfather', label: 'Grandfather', icon: 'man', description: 'Elder family member' },
    { id: 'guardian', label: 'Guardian', icon: 'shield', description: 'Legal guardian or caretaker' },
    { id: 'other', label: 'Other', icon: 'person', description: 'Other family role' },
];

const RoleSelectionScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId, saveUserRole } = useApp();

    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!selectedRole) {
            Alert.alert('Error', 'Please select a role');
            return;
        }

        setIsLoading(true);
        try {
            const response = await databaseService.updateUserRole(userId, selectedRole);
            if (response.success) {
                await saveUserRole(selectedRole);
                navigation.replace('Home');
            } else {
                Alert.alert('Error', response.message || 'Failed to update role');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Ionicons name="people-circle" size={48} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Select Your Role</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    This helps us personalize your experience
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>I am a...</Text>
                <View style={styles.rolesList}>
                    {ROLES.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            style={[
                                styles.roleCard,
                                {
                                    backgroundColor: selectedRole === role.id ? colors.primary : colors.card,
                                    borderColor: selectedRole === role.id ? colors.primary : colors.border,
                                    borderRadius,
                                    ...shadows.small,
                                },
                            ]}
                            onPress={() => setSelectedRole(role.id)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: selectedRole === role.id ? colors.white + '30' : colors.primary + '10' }]}>
                                <Ionicons
                                    name={role.icon}
                                    size={28}
                                    color={selectedRole === role.id ? colors.white : colors.primary}
                                />
                            </View>
                            <View style={styles.roleInfo}>
                                <Text
                                    style={[
                                        styles.roleLabel,
                                        { color: selectedRole === role.id ? colors.white : colors.text },
                                    ]}
                                >
                                    {role.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.roleDescription,
                                        { color: selectedRole === role.id ? colors.white + 'CC' : colors.gray },
                                    ]}
                                >
                                    {role.description}
                                </Text>
                            </View>
                            {selectedRole === role.id && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: colors.primary }]}
                    onPress={handleContinue}
                    disabled={!selectedRole || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={[styles.continueButtonText, { color: colors.white }]}>Continue</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    rolesList: {
        gap: 12,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleInfo: {
        flex: 1,
        marginLeft: 16,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    roleDescription: {
        fontSize: 12,
        marginTop: 4,
    },
    continueButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default RoleSelectionScreen;
