import React, { useState, useEffect } from 'react';
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
import databaseService from '../services/databaseService';
import { getSessionData } from '../utils/deviceInfo';
import biometricService from '../services/biometricService';

const LoginScreen = ({ navigation }) => {
    const { saveAuthTokens, saveUserId, saveUserRole, saveUserName, clearNeedsReLogin, clearForceLogoutFlag } = useApp();
    const { colors, spacing, borderRadius } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometric');

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const result = await biometricService.initialize();
            const isEnabled = await biometricService.isBiometricEnabled();
            
            setBiometricAvailable(result.available && result.enrolled);
            setBiometricEnabled(isEnabled);
            
            if (result.types && result.types.length > 0) {
                if (result.types.includes(1)) { // FACIAL_RECOGNITION
                    setBiometricType('Face ID');
                } else if (result.types.includes(2)) { // FINGERPRINT
                    setBiometricType('Fingerprint');
                }
            }
        } catch (error) {
            console.log('Biometric check error:', error);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricEnabled) {
            Alert.alert(
                'Biometric Not Enabled',
                'Please enable biometric login in your profile settings after logging in.',
                [{ text: 'OK' }]
            );
            return;
        }

        setIsLoading(true);
        try {
            const result = await biometricService.authenticate('Login to Nirbhaya');
            
            if (result.success) {
                const credentials = await biometricService.getBiometricCredentials();
                
                if (credentials && credentials.userId) {
                    const sessionData = await getSessionData();
                    
                    const response = await databaseService.loginWithBiometric({
                        userId: credentials.userId,
                        deviceId: credentials.deviceId,
                        ...sessionData,
                    });

                    if (response.success) {
                        await clearForceLogoutFlag();
                        await saveAuthTokens(response.token, response.refreshToken);
                        await saveUserId(response.user.id);
                        await saveUserRole(response.user.role);
                        await saveUserName(`${response.user.firstName} ${response.user.lastName}`);
                        await clearNeedsReLogin();
                        Alert.alert('Success', 'Login successful!');
                    } else {
                        Alert.alert('Error', response.message || 'Biometric login failed. Please login with email/password.');
                    }
                }
            } else {
                if (result.error && result.error !== 'user_cancel') {
                    Alert.alert('Authentication Failed', result.error);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred during biometric login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            // Get device/location info for session tracking
            const sessionData = await getSessionData();

            const response = await databaseService.login({
                email: email.trim().toLowerCase(),
                password,
                ...sessionData,
            });

            if (response.success) {
                await clearForceLogoutFlag(); // Clear any force logout flags before new login
                await saveAuthTokens(response.token, response.refreshToken);
                await saveUserId(response.user.id);
                await saveUserRole(response.user.role);
                await saveUserName(`${response.user.firstName} ${response.user.lastName}`);
                await clearNeedsReLogin(); // Clear any previous auth failure state
                Alert.alert('Success', 'Login successful!');
            } else {
                Alert.alert('Error', response.message || 'Login failed');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToRegister = () => navigation.navigate('Register');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                        <Ionicons name="shield-checkmark" size={60} color={colors.white} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Women Safety</Text>
                    <Text style={[styles.subtitle, { color: colors.gray }]}>Secure Login</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email"
                            placeholderTextColor={colors.gray}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={colors.gray}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            editable={!isLoading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={colors.gray}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={[styles.loginButtonText, { color: colors.white }]}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {biometricAvailable && (
                        <TouchableOpacity
                            style={[styles.biometricButton, { borderColor: colors.primary }]}
                            onPress={handleBiometricLogin}
                            disabled={isLoading}
                        >
                            <Ionicons 
                                name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} 
                                size={24} 
                                color={colors.primary} 
                            />
                            <Text style={[styles.biometricText, { color: colors.primary }]}>
                                Login with {biometricType}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
                        <Text style={[styles.registerText, { color: colors.primary }]}>
                            Don't have an account? Register
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    formContainer: {
        width: '100%',
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
    loginButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        marginTop: 16,
        gap: 10,
    },
    biometricText: {
        fontSize: 16,
        fontWeight: '600',
    },
    registerText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default LoginScreen;
