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
import databaseService from '../services/databaseService';

const RegisterScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) return 'Please enter your first name';
        if (!formData.lastName.trim()) return 'Please enter your last name';
        if (!formData.email.trim()) return 'Please enter your email';
        if (!formData.phone.trim()) return 'Please enter your phone number';
        if (!formData.password) return 'Please enter a password';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return null;
    };

    const handleRegister = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Error', error);
            return;
        }

        setIsLoading(true);
        try {
            const response = await databaseService.register({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                password: formData.password,
            });

            if (response.success) {
                Alert.alert(
                    'Success',
                    'Registration successful! Please login.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Error', response.message || 'Registration failed');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (icon, placeholder, field, options = {}) => (
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={icon} size={20} color={colors.gray} style={styles.inputIcon} />
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.gray}
                value={formData[field]}
                onChangeText={(text) => updateField(field, text)}
                editable={!isLoading}
                {...options}
            />
        </View>
    );

    const renderPasswordInput = (placeholder, field, show, setShow) => (
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.gray}
                value={formData[field]}
                onChangeText={(text) => updateField(field, text)}
                secureTextEntry={!show}
                editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShow(!show)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray} />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                <Text style={[styles.subtitle, { color: colors.gray }]}>Join Women Safety App</Text>

                {renderInput('person-outline', 'First Name', 'firstName', { autoCapitalize: 'words' })}
                {renderInput('person-outline', 'Last Name', 'lastName', { autoCapitalize: 'words' })}
                {renderInput('mail-outline', 'Email', 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
                {renderInput('call-outline', 'Phone Number', 'phone', { keyboardType: 'phone-pad' })}
                {renderPasswordInput('Password', 'password', showPassword, setShowPassword)}
                {renderPasswordInput('Confirm Password', 'confirmPassword', showConfirmPassword, setShowConfirmPassword)}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.white }]}>Register</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                    <Text style={[styles.loginText, { color: colors.primary }]}>
                        Already have an account? Login
                    </Text>
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
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
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
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    loginText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default RegisterScreen;
