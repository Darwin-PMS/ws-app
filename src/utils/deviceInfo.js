import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Device info storage keys
const DEVICE_INFO_KEYS = {
    DEVICE_ID: '@device_id',
    DEVICE_INFO: '@device_info',
};

/**
 * Get or generate a unique device ID
 */
export const getDeviceId = async () => {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_INFO_KEYS.DEVICE_ID);
        if (!deviceId) {
            // Generate a new UUID for this device
            deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await AsyncStorage.setItem(DEVICE_INFO_KEYS.DEVICE_ID, deviceId);
        }
        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        return null;
    }
};

/**
 * Get comprehensive device information
 */
export const getDeviceInfo = async () => {
    try {
        const deviceId = await getDeviceId();

        const deviceInfo = {
            deviceId: deviceId,
            deviceName: Device.deviceName || 'Unknown',
            deviceModel: Device.modelName || 'Unknown',
            deviceBrand: Device.brand || 'Unknown',
            deviceType: Device.deviceType || 'Unknown',
            osName: Device.osName || 'Unknown',
            osVersion: Device.osVersion || 'Unknown',
            appVersion: Constants.expoConfig?.version || '1.0.0',
            appName: Constants.expoConfig?.name || 'Women Safety',
            platform: Constants.platform?.ios ? 'ios' : Constants.platform?.android ? 'android' : 'unknown',
        };

        return deviceInfo;
    } catch (error) {
        console.error('Error getting device info:', error);
        return {
            deviceId: null,
            deviceName: 'Unknown',
            deviceModel: 'Unknown',
            deviceBrand: 'Unknown',
            deviceType: 'Unknown',
            osName: 'Unknown',
            osVersion: 'Unknown',
            appVersion: '1.0.0',
            appName: 'Women Safety',
            platform: 'unknown',
        };
    }
};

/**
 * Get current location
 */
export const getCurrentLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { latitude: null, longitude: null, locationName: null };
        }

        const location = await Location.getCurrentPositionAsync({});

        // Try to get location name (reverse geocoding)
        let locationName = null;
        try {
            const addresses = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            if (addresses && addresses.length > 0) {
                const addr = addresses[0];
                locationName = addr.street
                    ? `${addr.street}, ${addr.city || ''}, ${addr.region || ''}`
                    : `${addr.city || ''}, ${addr.region || ''}`;
            }
        } catch (geoError) {
            console.log('Reverse geocoding failed:', geoError);
        }

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            locationName: locationName,
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return { latitude: null, longitude: null, locationName: null };
    }
};

/**
 * Get all session data needed for login/logout tracking
 */
export const getSessionData = async () => {
    const [deviceInfo, location] = await Promise.all([
        getDeviceInfo(),
        getCurrentLocation(),
    ]);

    return {
        ...deviceInfo,
        ...location,
    };
};

export default {
    getDeviceId,
    getDeviceInfo,
    getCurrentLocation,
    getSessionData,
};
