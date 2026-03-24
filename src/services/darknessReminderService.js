// Smart Darkness Reminder Service
// Automatic notifications when sun is about to set during active journeys

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@darkness_reminder_settings';

class DarknessReminderService {
    constructor() {
        this.activeJourney = null;
        this.sunCheckInterval = null;
        this.notificationScheduled = false;
        this.settings = {
            enabled: true,
            reminderBeforeSunset: 30, // minutes before sunset
            reminderAfterSunset: 0, // immediately after sunset
            customThreshold: 60, // use custom time threshold
        };
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        await this.loadSettings();
        await this.setupNotifications();
    }

    async loadSettings() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading darkness reminder settings:', error);
        }
        return this.settings;
    }

    async saveSettings() {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async setupNotifications() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status !== 'granted') {
                return { success: false, message: 'Notification permission denied' };
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('darkness_reminder', {
                    name: 'Darkness Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== SUNRISE/SUNSET CALCULATIONS ====================

    /**
     * Calculate sunrise and sunset times for a given location and date
     * Uses simplified astronomical calculations
     */
    calculateSunTimes(latitude, longitude, date = new Date()) {
        try {
            const dayOfYear = this.getDayOfYear(date);
            
            // Calculate approximate sunrise and sunset times
            const sunriseOffset = this.calculateSunriseOffset(latitude, dayOfYear);
            const sunsetOffset = this.calculateSunsetOffset(latitude, dayOfYear);

            const sunrise = new Date(date);
            sunrise.setHours(6, 0, 0, 0); // Base sunrise around 6 AM
            sunrise.setMinutes(sunriseOffset.hours);
            sunrise.setSeconds(sunriseOffset.minutes);

            const sunset = new Date(date);
            sunset.setHours(18, 0, 0, 0); // Base sunset around 6 PM
            sunset.setMinutes(sunsetOffset.hours);
            sunset.setMinutes(sunsetOffset.minutes);
            sunset.setSeconds(sunsetOffset.seconds);

            return {
                sunrise,
                sunset,
                solarNoon: new Date((sunrise.getTime() + sunset.getTime()) / 2),
                dayLength: sunset.getTime() - sunrise.getTime(),
            };
        } catch (error) {
            console.error('Sun time calculation error:', error);
            return this.getDefaultSunTimes(date);
        }
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    calculateSunriseOffset(latitude, dayOfYear) {
        // Simplified calculation based on latitude and day of year
        const latFactor = Math.abs(latitude) / 90;
        const seasonalFactor = Math.sin((2 * Math.PI * dayOfYear) / 365);
        
        // Adjust for hemisphere and season
        const offset = latFactor * seasonalFactor * 60; // in minutes
        
        return {
            hours: Math.floor(offset / 60),
            minutes: Math.floor(offset % 60),
        };
    }

    calculateSunsetOffset(latitude, dayOfYear) {
        // Simplified calculation based on latitude and day of year
        const latFactor = Math.abs(latitude) / 90;
        const seasonalFactor = Math.sin((2 * Math.PI * dayOfYear) / 365);
        
        // Base sunset at 6 PM (1080 minutes from midnight)
        const baseMinutes = 1080;
        const offset = latFactor * seasonalFactor * 60;
        
        const totalMinutes = baseMinutes + offset;
        
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: Math.floor(totalMinutes % 60),
            seconds: 0,
        };
    }

    getDefaultSunTimes(date) {
        const sunrise = new Date(date);
        sunrise.setHours(6, 30, 0, 0);

        const sunset = new Date(date);
        sunset.setHours(18, 0, 0, 0);

        return {
            sunrise,
            sunset,
            solarNoon: new Date((sunrise.getTime() + sunset.getTime()) / 2),
            dayLength: sunset.getTime() - sunrise.getTime(),
        };
    }

    // ==================== JOURNEY MANAGEMENT ====================

    async startJourney(journeyDetails = {}) {
        try {
            // Get current location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return { success: false, message: 'Location permission denied' };
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            this.activeJourney = {
                id: Date.now().toString(),
                startedAt: Date.now(),
                origin: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                destination: journeyDetails.destination || null,
                estimatedDuration: journeyDetails.estimatedDuration || null,
                sunTimes: this.calculateSunTimes(
                    location.coords.latitude,
                    location.coords.longitude
                ),
                remindersSent: {
                    beforeSunset: false,
                    afterSunset: false,
                },
            };

            // Start monitoring for sunset
            this.startSunMonitoring();

            return {
                success: true,
                journey: this.activeJourney,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async endJourney() {
        this.stopSunMonitoring();
        this.activeJourney = null;
        return { success: true };
    }

    getActiveJourney() {
        return this.activeJourney;
    }

    // ==================== SUN MONITORING ====================

    startSunMonitoring() {
        if (!this.settings.enabled || !this.activeJourney) {
            return;
        }

        // Check every minute
        this.sunCheckInterval = setInterval(async () => {
            await this.checkSunStatus();
        }, 60000);

        // Initial check
        this.checkSunStatus();
    }

    stopSunMonitoring() {
        if (this.sunCheckInterval) {
            clearInterval(this.sunCheckInterval);
            this.sunCheckInterval = null;
        }
    }

    async checkSunStatus() {
        if (!this.activeJourney) {
            this.stopSunMonitoring();
            return;
        }

        const now = new Date();
        const { sunset } = this.activeJourney.sunTimes;
        const timeToSunset = sunset.getTime() - now.getTime();
        const minutesToSunset = timeToSunset / (1000 * 60);

        // Check if we should send pre-sunset reminder
        if (
            minutesToSunset > 0 &&
            minutesToSunset <= this.settings.reminderBeforeSunset &&
            !this.activeJourney.remindersSent.beforeSunset
        ) {
            await this.sendPreSunsetReminder(minutesToSunset);
            this.activeJourney.remindersSent.beforeSunset = true;
        }

        // Check if sunset has occurred
        if (
            minutesToSunset <= 0 &&
            !this.activeJourney.remindersSent.afterSunset
        ) {
            await this.sendPostSunsetReminder();
            this.activeJourney.remindersSent.afterSunset = true;
            
            // Update sun times for next day if journey continues
            this.activeJourney.sunTimes = this.calculateSunTimes(
                this.activeJourney.origin.latitude,
                this.activeJourney.origin.longitude,
                new Date()
            );
        }

        // Check if journey should end (next day)
        const journeyDuration = Date.now() - this.activeJourney.startedAt;
        if (journeyDuration > 24 * 60 * 60 * 1000) { // 24 hours
            this.endJourney();
        }
    }

    // ==================== NOTIFICATIONS ====================

    async sendPreSunsetReminder(minutesToSunset) {
        try {
            const minutesText = Math.round(minutesToSunset);
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌅 Sunset Approaching',
                    body: `The sun will set in approximately ${minutesText} minutes. Consider completing your journey or moving to a well-lit area. Stay safe!`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: {
                        type: 'darkness_reminder',
                        reminderType: 'pre_sunset',
                        minutesToSunset,
                        journeyId: this.activeJourney?.id,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            console.error('Send pre-sunset reminder error:', error);
            return { success: false, message: error.message };
        }
    }

    async sendPostSunsetReminder() {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌙 It\'s Dark Outside',
                    body: 'The sun has set. Please ensure you\'re in a safe, well-lit area. Consider using the safe route feature or sharing your location with trusted contacts.',
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: {
                        type: 'darkness_reminder',
                        reminderType: 'post_sunset',
                        journeyId: this.activeJourney?.id,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            console.error('Send post-sunset reminder error:', error);
            return { success: false, message: error.message };
        }
    }

    async sendTwilightReminder() {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌆 Twilight Alert',
                    body: 'It\'s twilight now. Visibility is decreasing. Stay alert and consider turning on your phone flashlight.',
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.DEFAULT,
                    data: {
                        type: 'darkness_reminder',
                        reminderType: 'twilight',
                        journeyId: this.activeJourney?.id,
                    },
                },
                trigger: null,
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== SETTINGS MANAGEMENT ====================

    updateSettings(updates) {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
        return this.settings;
    }

    setReminderBeforeSunset(minutes) {
        this.settings.reminderBeforeSunset = Math.max(5, Math.min(120, minutes));
        this.saveSettings();
        return this.settings.reminderBeforeSunset;
    }

    enableReminders() {
        this.settings.enabled = true;
        this.saveSettings();
    }

    disableReminders() {
        this.settings.enabled = false;
        this.stopSunMonitoring();
        this.saveSettings();
    }

    getSettings() {
        return this.settings;
    }

    // ==================== UTILS ====================

    isDaytime(date = new Date()) {
        const location = this.activeJourney?.origin;
        if (!location) {
            // Default assumption: 6 AM to 6 PM
            const hour = date.getHours();
            return hour >= 6 && hour < 18;
        }

        const sunTimes = this.calculateSunTimes(location.latitude, location.longitude, date);
        return date >= sunTimes.sunrise && date <= sunTimes.sunset;
    }

    isTwilight(date = new Date()) {
        const location = this.activeJourney?.origin;
        if (!location) return false;

        const sunTimes = this.calculateSunTimes(location.latitude, location.longitude, date);
        const timeToSunset = sunTimes.sunset.getTime() - date.getTime();
        const minutesToSunset = timeToSunset / (1000 * 60);
        
        // Twilight: 30 minutes before to 30 minutes after sunset
        return minutesToSunset >= -30 && minutesToSunset <= 30;
    }

    getSunStatus(date = new Date()) {
        const location = this.activeJourney?.origin;
        if (!location) {
            return { status: 'unknown', sunTimes: null };
        }

        const sunTimes = this.calculateSunTimes(location.latitude, location.longitude, date);
        const now = date.getTime();

        if (now < sunTimes.sunrise.getTime()) {
            return { status: 'night', sunTimes, timeToSunrise: sunTimes.sunrise.getTime() - now };
        } else if (now < sunTimes.sunset.getTime()) {
            return { status: 'day', sunTimes, timeToSunset: sunTimes.sunset.getTime() - now };
        } else {
            return { status: 'night', sunTimes, timeSinceSunset: now - sunTimes.sunset.getTime() };
        }
    }

    // ==================== QUICK ACTIONS ====================

    async checkCurrentSunStatus() {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { status: 'unknown', error: 'Permission denied' };
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const sunTimes = this.calculateSunTimes(
            location.coords.latitude,
            location.coords.longitude
        );

        return this.getSunStatus(new Date());
    }
}

export default new DarknessReminderService();
