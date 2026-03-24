import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const ROLES = [
    { id: 'father', label: 'Father', icon: 'man' },
    { id: 'mother', label: 'Mother', icon: 'woman' },
    { id: 'son', label: 'Son', icon: 'male' },
    { id: 'daughter', label: 'Daughter', icon: 'female' },
    { id: 'grandfather', label: 'Grandfather', icon: 'man' },
    { id: 'grandmother', label: 'Grandmother', icon: 'woman' },
    { id: 'other', label: 'Other', icon: 'person' },
];

const AddMemberScreen = ({ navigation, route }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();
    const { familyId } = route.params || {};

    const [formData, setFormData] = useState({
        email: '',
        role: 'other',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleAddMember = async () => {
        if (!formData.email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        if (!familyId) {
            Alert.alert('Error', 'Family ID is missing');
            return;
        }

        setIsLoading(true);
        try {
            const response = await familyService.addMember(familyId, {
                email: formData.email.trim().toLowerCase(),
                role: formData.role,
                addedBy: userId,
            });

            if (response.success) {
                Alert.alert(
                    'Success',
                    'Invitation sent successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to add member');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.title, { color: colors.text }]}>Add Family Member</Text>
                <Text style={[styles.subtitle, { color: colors.gray }]}>
                    Invite a family member by email address
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Email Address"
                        placeholderTextColor={colors.gray}
                        value={formData.email}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Role</Text>
                <View style={styles.rolesContainer}>
                    {ROLES.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            style={[
                                styles.roleCard,
                                {
                                    backgroundColor: formData.role === role.id ? colors.primary : colors.card,
                                    borderColor: formData.role === role.id ? colors.primary : colors.border,
                                    borderRadius,
                                    ...shadows.small,
                                },
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, role: role.id }))}
                        >
                            <Ionicons
                                name={role.icon}
                                size={24}
                                color={formData.role === role.id ? colors.white : colors.gray}
                            />
                            <Text
                                style={[
                                    styles.roleText,
                                    { color: formData.role === role.id ? colors.white : colors.text },
                                ]}
                            >
                                {role.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddMember}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Ionicons name="person-add" size={20} color={colors.white} />
                            <Text style={[styles.addButtonText, { color: colors.white }]}>Send Invitation</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    rolesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        gap: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AddMemberScreen;
