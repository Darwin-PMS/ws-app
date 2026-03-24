/**
 * DisguisedIconManager - Utility for managing app icon disguises
 * 
 * This feature allows users to disguise the app as other common applications
 * for safety purposes. The app can appear as Calculator, Notes, Weather, etc.
 * 
 * Note: This utility manages the disguise state and provides guidance for
 * changing the actual app icon on the device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Disguise options available for the app
export const DISGUISE_OPTIONS = [
    {
        id: 'default',
        name: 'Nirbhaya - Women Safety',
        description: 'Original app icon',
        icon: 'shield-check',
        color: '#10B981',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'calculator',
        name: 'Calculator',
        description: 'Disguise as a calculator app',
        icon: 'calculator',
        color: '#6366F1',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'notes',
        name: 'Notes',
        description: 'Disguise as a notes app',
        icon: 'note-text',
        color: '#F59E0B',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'weather',
        name: 'Weather',
        description: 'Disguise as a weather app',
        icon: 'weather-cloudy',
        color: '#3B82F6',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'Disguise as a calendar app',
        icon: 'calendar',
        color: '#EC4899',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'health',
        name: 'Health',
        description: 'Disguise as a health tracking app',
        icon: 'heart-pulse',
        color: '#EF4444',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'music',
        name: 'Music',
        description: 'Disguise as a music player',
        icon: 'music',
        color: '#8B5CF6',
        package: 'com.nirbhaya.womensafety',
    },
    {
        id: 'shopping',
        name: 'Shopping',
        description: 'Disguise as a shopping app',
        icon: 'cart',
        color: '#10B981',
        package: 'com.nirbhaya.womensafety',
    },
];

const DISGUISE_STORAGE_KEY = '@nirbhaya_disguise_mode';
const DISGUISE_ENABLED_KEY = '@nirbhaya_disguise_enabled';

/**
 * Get the current disguise configuration
 */
export const getDisguiseConfig = async () => {
    try {
        const disguiseId = await AsyncStorage.getItem(DISGUISE_STORAGE_KEY);
        const isEnabled = await AsyncStorage.getItem(DISGUISE_ENABLED_KEY);

        const disguise = DISGUISE_OPTIONS.find(d => d.id === (disguiseId || 'default'))
            || DISGUISE_OPTIONS[0];

        return {
            disguise,
            isEnabled: isEnabled === 'true',
        };
    } catch (error) {
        console.error('Error getting disguise config:', error);
        return {
            disguise: DISGUISE_OPTIONS[0],
            isEnabled: false,
        };
    }
};

/**
 * Set the current disguise
 */
export const setDisguise = async (disguiseId) => {
    try {
        await AsyncStorage.setItem(DISGUISE_STORAGE_KEY, disguiseId);
        const disguise = DISGUISE_OPTIONS.find(d => d.id === disguiseId) || DISGUISE_OPTIONS[0];
        return { success: true, disguise };
    } catch (error) {
        console.error('Error setting disguise:', error);
        return { success: false, error };
    }
};

/**
 * Enable or disable disguise mode
 */
export const setDisguiseEnabled = async (enabled) => {
    try {
        await AsyncStorage.setItem(DISGUISE_ENABLED_KEY, enabled.toString());
        return { success: enabled };
    } catch (error) {
        console.error('Error setting disguise enabled:', error);
        return { success: false, error };
    }
};

/**
 * Get instructions for changing app icon on device
 * Note: This provides guidance as actual icon change requires device settings
 */
export const getIconChangeInstructions = (platform) => {
    if (platform === 'ios') {
        return {
            title: 'Change App Icon (iOS)',
            steps: [
                'Go to Settings on your iPhone',
                'Scroll down and find "Nirbhaya - Women Safety"',
                'Tap on the app',
                'Tap "App Icon"',
                'Select your desired disguise icon',
                'The app will now appear with the new icon',
            ],
        };
    } else if (platform === 'android') {
        return {
            title: 'Change App Icon (Android)',
            steps: [
                'Long press on the app icon on your home screen',
                'Tap on "App info" or the info icon',
                'Tap the settings icon (three dots)',
                'Select "Change icon" or "App icon"',
                'Choose your desired disguise from the list',
                'The app will now appear with the new icon',
            ],
        };
    }
    return null;
};

/**
 * Open device settings for app icon change
 */
export const openAppSettings = async () => {
    try {
        // Open general device settings
        if (Linking.canOpenURL('settings://')) {
            await Linking.openURL('settings://');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error opening settings:', error);
        return false;
    }
};

/**
 * Get quick disguise suggestions based on common use cases
 */
export const getQuickDisguises = () => {
    return [
        DISGUISE_OPTIONS[1], // Calculator
        DISGUISE_OPTIONS[2], // Notes
        DISGUISE_OPTIONS[3], // Weather
    ];
};

export default {
    DISGUISE_OPTIONS,
    getDisguiseConfig,
    setDisguise,
    setDisguiseEnabled,
    getIconChangeInstructions,
    openAppSettings,
    getQuickDisguises,
};
