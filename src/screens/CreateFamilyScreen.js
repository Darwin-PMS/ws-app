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

const CreateFamilyScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();
    const { userId } = useApp();

    const [familyName, setFamilyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateFamily = async () => {
        if (!familyName.trim()) {
            Alert.alert('Error', 'Please enter a family name');
            return;
        }

        setIsLoading(true);
        try {
            const response = await familyService.createFamily({
                name: familyName.trim(),
                createdBy: userId,
            });

            if (response.success) {
                Alert.alert(
                    'Success',
                    'Family group created successfully!',
                    [{ text: 'OK', onPress: () => navigation.navigate('Family') }]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to create family');
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
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={48} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Create Family Group</Text>
                <Text style={[styles.subtitle, { color: colors.gray }]}>
                    Create a family group to connect with your loved ones and keep everyone safe
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="home-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Family Name (e.g., Smith Family)"
                        placeholderTextColor={colors.gray}
                        value={familyName}
                        onChangeText={setFamilyName}
                        maxLength={50}
                        editable={!isLoading}
                    />
                </View>

                <View style={styles.benefitsContainer}>
                    <Text style={[styles.benefitsTitle, { color: colors.text }]}>Benefits:</Text>
                    {[
                        'Share real-time location with family members',
                        'Send emergency alerts to all members',
                        'Manage family safety settings together',
                    ].map((benefit, index) => (
                        <View key={index} style={styles.benefitItem}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={[styles.benefitText, { color: colors.gray }]}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateFamily}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={[styles.createButtonText, { color: colors.white }]}>Create Family</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
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
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        width: '100%',
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    benefitsContainer: {
        width: '100%',
        marginTop: 32,
        marginBottom: 32,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitText: {
        fontSize: 14,
        marginLeft: 8,
    },
    createButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
    },
    cancelButtonText: {
        fontSize: 16,
    },
});

export default CreateFamilyScreen;
