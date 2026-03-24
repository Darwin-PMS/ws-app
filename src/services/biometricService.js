// Biometric Authentication Service
// Handles fingerprint and face authentication

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = '@biometric_credentials';

class BiometricService {
    constructor() {
        this.isHardwareAvailable = false;
        this.isEnrolled = false;
        this.supportedTypes = [];
    }

    async initialize() {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            this.isHardwareAvailable = compatible;

            if (compatible) {
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                this.isEnrolled = enrolled;

                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                this.supportedTypes = types;

                console.log('Biometric Service Initialized:', {
                    hardwareAvailable: this.isHardwareAvailable,
                    isEnrolled: this.isEnrolled,
                    types: this.getBiometricTypeNames()
                });
            }

            return {
                available: this.isHardwareAvailable,
                enrolled: this.isEnrolled,
                types: this.supportedTypes
            };
        } catch (error) {
            console.error('Biometric initialization error:', error);
            return {
                available: false,
                enrolled: false,
                types: [],
                error: error.message
            };
        }
    }

    getBiometricTypeNames() {
        const typeNames = [];
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            typeNames.push('Face ID');
        }
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            typeNames.push('Fingerprint');
        }
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            typeNames.push('Iris');
        }
        return typeNames;
    }

    getPrimaryBiometricType() {
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'Face ID';
        }
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'Fingerprint';
        }
        return 'Biometric';
    }

    async isBiometricAvailable() {
        return this.isHardwareAvailable && this.isEnrolled;
    }

    async authenticate(reason = 'Authenticate to access Nirbhaya') {
        try {
            if (!await this.isBiometricAvailable()) {
                return {
                    success: false,
                    error: 'Biometric authentication not available'
                };
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason,
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
                fallbackLabel: 'Use Passcode'
            });

            return {
                success: result.success,
                error: result.error || null,
                warning: result.warning || null
            };
        } catch (error) {
            console.error('Biometric authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async enableBiometric(userId, userToken) {
        try {
            const authResult = await this.authenticate('Enable biometric login');
            
            if (!authResult.success) {
                return {
                    success: false,
                    error: authResult.error || 'Authentication failed'
                };
            }

            const biometricData = {
                userId: userId,
                enabledAt: new Date().toISOString(),
                deviceId: await this.getDeviceId()
            };

            await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
            await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(biometricData));

            return {
                success: true,
                message: 'Biometric login enabled'
            };
        } catch (error) {
            console.error('Enable biometric error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async disableBiometric() {
        try {
            await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
            await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);

            return {
                success: true,
                message: 'Biometric login disabled'
            };
        } catch (error) {
            console.error('Disable biometric error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async isBiometricEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            return false;
        }
    }

    async getBiometricCredentials() {
        try {
            const credentials = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
            return credentials ? JSON.parse(credentials) : null;
        } catch (error) {
            return null;
        }
    }

    async getDeviceId() {
        try {
            const deviceId = await AsyncStorage.getItem('@device_id');
            if (!deviceId) {
                const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AsyncStorage.setItem('@device_id', newDeviceId);
                return newDeviceId;
            }
            return deviceId;
        } catch (error) {
            return `device_${Date.now()}`;
        }
    }

    async quickAuthenticate() {
        return this.authenticate('Quick login to Nirbhaya');
    }

    async verifyBiometricAndGetToken() {
        try {
            const isEnabled = await this.isBiometricEnabled();
            if (!isEnabled) {
                return {
                    success: false,
                    error: 'Biometric not enabled'
                };
            }

            const authResult = await this.authenticate();
            if (!authResult.success) {
                return {
                    success: false,
                    error: authResult.error
                };
            }

            const credentials = await this.getBiometricCredentials();
            if (!credentials) {
                return {
                    success: false,
                    error: 'No credentials found'
                };
            }

            return {
                success: true,
                userId: credentials.userId,
                deviceId: credentials.deviceId
            };
        } catch (error) {
            console.error('Verify biometric error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new BiometricService();
