// Fake Message Alert Service
// Simulates incoming message alerts for user safety

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Notifications } from 'expo-notifications';

const STORAGE_KEYS = {
    CONTACTS: '@fake_message_contacts',
    SETTINGS: '@fake_message_settings',
    MESSAGE_HISTORY: '@fake_message_history',
    ALERT_PRESETS: '@fake_message_presets',
};

const DEFAULT_CONTACTS = [
    { id: '1', name: 'Mom', phone: '+1234567890', avatar: null },
    { id: '2', name: 'Dad', phone: '+1234567891', avatar: null },
    { id: '3', name: 'Friend', phone: '+1234567892', avatar: null },
    { id: '4', name: 'Boss', phone: '+1234567893', avatar: null },
    { id: '5', name: 'Colleague', phone: '+1234567894', avatar: null },
];

const DEFAULT_SETTINGS = {
    vibration: true,
    sound: true,
    speechAnnouncement: true,
    notificationStyle: 'chat', // 'chat' | 'alert' | 'system'
    autoDismiss: false,
    autoDismissDelay: 5,
    defaultMessage: "Where are you? I've been waiting!",
    speechRate: 0.9,
    speechPitch: 1.0,
    customPresets: [],
};

const DEFAULT_ALERT_PRESETS = [
    {
        id: '1',
        name: 'Urgent Meeting',
        senderName: 'Boss',
        message: "Where are you? The meeting started 5 minutes ago!",
        category: 'work',
        icon: 'briefcase',
        priority: 'high',
    },
    {
        id: '2',
        name: 'Family Emergency',
        senderName: 'Mom',
        message: "Call me ASAP! It's an emergency.",
        category: 'family',
        icon: 'heart',
        priority: 'urgent',
    },
    {
        id: '3',
        name: 'Food Delivery',
        senderName: 'Delivery',
        message: "Your food is here! Please come down to collect.",
        category: 'delivery',
        icon: 'restaurant',
        priority: 'normal',
    },
    {
        id: '4',
        name: 'Package Arrived',
        senderName: 'Courier',
        message: "Your package has arrived. Please collect from reception.",
        category: 'delivery',
        icon: 'cube',
        priority: 'normal',
    },
    {
        id: '5',
        name: 'Friend Waiting',
        senderName: 'Friend',
        message: "Hey! I'm here. Where are you?",
        category: 'social',
        icon: 'person',
        priority: 'normal',
    },
    {
        id: '6',
        name: 'Doctor Appointment',
        senderName: 'Clinic',
        message: "Reminder: Your appointment is in 30 minutes.",
        category: 'health',
        icon: 'medical',
        priority: 'high',
    },
    {
        id: '7',
        name: 'Car Breakdown',
        senderName: 'Dad',
        message: "Your car broke down? I'm sending help!",
        category: 'emergency',
        icon: 'car',
        priority: 'urgent',
    },
    {
        id: '8',
        name: 'Pet Emergency',
        senderName: 'Vet',
        message: "Please call us immediately regarding your pet.",
        category: 'emergency',
        icon: 'paw',
        priority: 'urgent',
    },
];

class FakeMessageService {
    constructor() {
        this.contacts = [];
        this.settings = {};
        this.alertPresets = [];
        this.isInitialized = false;
        this.currentAlert = null;
        this.messageHistory = [];
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const contactsData = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
            this.contacts = contactsData ? JSON.parse(contactsData) : DEFAULT_CONTACTS;

            const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            this.settings = settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;

            const presetsData = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_PRESETS);
            this.alertPresets = presetsData ? JSON.parse(presetsData) : DEFAULT_ALERT_PRESETS;

            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_HISTORY);
            this.messageHistory = historyData ? JSON.parse(historyData) : [];

            this.isInitialized = true;
        } catch (error) {
            console.error('Fake message service init error:', error);
            this.contacts = DEFAULT_CONTACTS;
            this.settings = DEFAULT_SETTINGS;
            this.alertPresets = DEFAULT_ALERT_PRESETS;
            this.messageHistory = [];
            this.isInitialized = true;
        }
    }

    async saveContacts() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(this.contacts));
        } catch (error) {
            console.error('Save contacts error:', error);
        }
    }

    async saveSettings() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Save settings error:', error);
        }
    }

    async savePresets() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ALERT_PRESETS, JSON.stringify(this.alertPresets));
        } catch (error) {
            console.error('Save presets error:', error);
        }
    }

    async saveMessageHistory() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_HISTORY, JSON.stringify(this.messageHistory));
        } catch (error) {
            console.error('Save message history error:', error);
        }
    }

    async getContacts() {
        await this.initialize();
        return this.contacts;
    }

    async getSettings() {
        await this.initialize();
        return this.settings;
    }

    async getAlertPresets() {
        await this.initialize();
        return this.alertPresets;
    }

    async addContact(contact) {
        await this.initialize();

        const newContact = {
            id: Date.now().toString(),
            name: contact.name,
            phone: contact.phone || '',
            avatar: null,
        };

        this.contacts.push(newContact);
        await this.saveContacts();

        return newContact;
    }

    async deleteContact(contactId) {
        await this.initialize();

        this.contacts = this.contacts.filter(c => c.id !== contactId);
        await this.saveContacts();
    }

    async updateSettings(newSettings) {
        await this.initialize();

        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();

        return this.settings;
    }

    async addCustomPreset(preset) {
        await this.initialize();

        const newPreset = {
            id: Date.now().toString(),
            ...preset,
            isCustom: true,
        };

        this.alertPresets.push(newPreset);
        await this.savePresets();

        return newPreset;
    }

    async deletePreset(presetId) {
        await this.initialize();

        this.alertPresets = this.alertPresets.filter(p => p.id !== presetId);
        await this.savePresets();
    }

    async triggerAlert(preset, customMessage = null) {
        await this.initialize();

        // Find sender from contacts or use default
        const sender = this.contacts.find(c => c.name === preset.senderName) || this.contacts[0];

        const alert = {
            id: Date.now().toString(),
            presetId: preset.id,
            sender: sender,
            senderName: preset.senderName,
            message: customMessage || preset.message,
            category: preset.category,
            icon: preset.icon,
            priority: preset.priority,
            timestamp: Date.now(),
            status: 'active',
        };

        this.currentAlert = alert;

        // Trigger vibration if enabled
        if (this.settings.vibration) {
            const { Vibration } = require('react-native');
            const patterns = {
                urgent: [0, 500, 200, 500, 200, 500],
                high: [0, 300, 150, 300, 150, 300],
                normal: [0, 200, 100, 200],
            };
            Vibration.vibrate(patterns[preset.priority] || patterns.normal);
        }

        // Trigger speech announcement if enabled
        if (this.settings.speechAnnouncement) {
            try {
                Speech.speak(`New message from ${preset.senderName}: ${alert.message}`, {
                    language: 'en',
                    pitch: this.settings.speechPitch,
                    rate: this.settings.speechRate,
                });
            } catch (error) {
                console.error('Speech error:', error);
            }
        }

        // Save to history
        await this.addToHistory(alert);

        return alert;
    }

    async addToHistory(alert) {
        this.messageHistory.unshift({
            ...alert,
            read: true,
        });

        // Keep only last 50 messages
        this.messageHistory = this.messageHistory.slice(0, 50);
        await this.saveMessageHistory();
    }

    async dismissAlert() {
        if (this.currentAlert) {
            this.currentAlert.status = 'dismissed';
            this.currentAlert.dismissedAt = Date.now();
            this.currentAlert = null;
        }

        try {
            Speech.stop();
        } catch (error) {
            console.error('Speech stop error:', error);
        }

        const { Vibration } = require('react-native');
        Vibration.cancel();

        return true;
    }

    async getMessageHistory() {
        await this.initialize();
        return this.messageHistory;
    }

    async clearHistory() {
        this.messageHistory = [];
        await this.saveMessageHistory();
    }

    // Get presets by category
    getPresetsByCategory(category) {
        return this.alertPresets.filter(p => p.category === category);
    }

    // Get all unique categories
    getCategories() {
        const categories = [...new Set(this.alertPresets.map(p => p.category))];
        return categories.map(cat => ({
            id: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            icon: this.getCategoryIcon(cat),
        }));
    }

    getCategoryIcon(category) {
        const icons = {
            work: 'briefcase',
            family: 'heart',
            delivery: 'cube',
            social: 'people',
            health: 'medical',
            emergency: 'warning',
        };
        return icons[category] || 'chatbubble';
    }

    // Get vibration patterns
    getVibrationPatterns() {
        return [
            { id: 'urgent', name: 'Urgent', pattern: [0, 500, 200, 500, 200, 500] },
            { id: 'high', name: 'High Priority', pattern: [0, 300, 150, 300, 150, 300] },
            { id: 'normal', name: 'Normal', pattern: [0, 200, 100, 200] },
            { id: 'soft', name: 'Soft', pattern: [0, 150, 75, 150] },
            { id: 'silent', name: 'Silent', pattern: [] },
        ];
    }

    // Quick trigger methods for common scenarios
    async triggerEmergency() {
        const emergencyPreset = this.alertPresets.find(p => p.priority === 'urgent') || this.alertPresets[0];
        return this.triggerAlert(emergencyPreset);
    }

    async triggerWork() {
        const workPreset = this.alertPresets.find(p => p.category === 'work') || this.alertPresets[0];
        return this.triggerAlert(workPreset);
    }

    async triggerDelivery() {
        const deliveryPreset = this.alertPresets.find(p => p.category === 'delivery') || this.alertPresets[2];
        return this.triggerAlert(deliveryPreset);
    }
}

export default new FakeMessageService();
