// Fake Call Service
// Simulates incoming calls and messages for user safety

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const STORAGE_KEYS = {
    CONTACTS: '@fake_call_contacts',
    SETTINGS: '@fake_call_settings',
    CALL_HISTORY: '@fake_call_history',
};

const DEFAULT_CONTACTS = [
    { id: '1', name: 'Mom', phone: '+1234567890', avatar: null },
    { id: '2', name: 'Dad', phone: '+1234567891', avatar: null },
    { id: '3', name: 'Friend', phone: '+1234567892', avatar: null },
    { id: '4', name: 'Boss', phone: '+1234567893', avatar: null },
    { id: '5', name: 'Custom', phone: '', avatar: null },
];

const DEFAULT_SETTINGS = {
    ringtone: true,
    vibration: true,
    vibrationPattern: [0, 500, 200, 500], // Default vibration pattern
    autoAnswer: false,
    autoAnswerDelay: 3,
    defaultMessage: "I'm on my way!",
    speechRate: 1.0,
    speechPitch: 1.0,
    // Custom preset scenarios
    customScenarios: [],
};

class FakeCallService {
    constructor() {
        this.contacts = [];
        this.settings = {};
        this.isInitialized = false;
        this.currentCall = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const contactsData = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
            this.contacts = contactsData ? JSON.parse(contactsData) : DEFAULT_CONTACTS;

            const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            this.settings = settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;

            this.isInitialized = true;
        } catch (error) {
            console.error('Fake call service init error:', error);
            this.contacts = DEFAULT_CONTACTS;
            this.settings = DEFAULT_SETTINGS;
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

    async getContacts() {
        await this.initialize();
        return this.contacts;
    }

    async getSettings() {
        await this.initialize();
        return this.settings;
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

    async updateContact(contactId, updates) {
        await this.initialize();

        const index = this.contacts.findIndex(c => c.id === contactId);
        if (index !== -1) {
            this.contacts[index] = { ...this.contacts[index], ...updates };
            await this.saveContacts();
            return this.contacts[index];
        }

        return null;
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

    async simulateIncomingCall(contact) {
        await this.initialize();

        if (this.currentCall) {
            await this.endCall();
        }

        this.currentCall = {
            contact,
            startTime: Date.now(),
            status: 'ringing',
        };

        return this.currentCall;
    }

    async acceptCall() {
        if (!this.currentCall) return null;

        this.currentCall.status = 'active';
        this.currentCall.answeredAt = Date.now();

        try {
            Speech.speak(`Incoming call from ${this.currentCall.contact.name}`, {
                language: 'en',
                pitch: 1.0,
                rate: 1.0,
            });
        } catch (error) {
            console.error('Speech error:', error);
        }

        return this.currentCall;
    }

    async endCall() {
        if (!this.currentCall) return null;

        try {
            Speech.stop();
        } catch (error) {
            console.error('Speech stop error:', error);
        }

        this.currentCall.status = 'ended';
        this.currentCall.endTime = Date.now();

        await this.saveCallHistory(this.currentCall);

        const endedCall = { ...this.currentCall };
        this.currentCall = null;

        return endedCall;
    }

    async declineCall() {
        if (!this.currentCall) return null;

        this.currentCall.status = 'declined';

        const declinedCall = { ...this.currentCall };
        this.currentCall = null;

        return declinedCall;
    }

    async saveCallHistory(call) {
        try {
            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
            let history = historyData ? JSON.parse(historyData) : [];

            history.unshift({
                id: call.contact.id,
                name: call.contact.name,
                phone: call.contact.phone,
                timestamp: call.startTime,
                duration: call.answeredAt ? call.endTime - call.answeredAt : 0,
                status: call.status,
            });

            history = history.slice(0, 50);

            await AsyncStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('Save call history error:', error);
        }
    }

    async getCallHistory() {
        try {
            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
            return historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            console.error('Get call history error:', error);
            return [];
        }
    }

    async sendFakeMessage(contact, message) {
        const fakeMessage = {
            id: Date.now().toString(),
            contactId: contact.id,
            contactName: contact.name,
            message: message || this.settings.defaultMessage,
            timestamp: Date.now(),
            type: 'received',
            read: false,
        };

        try {
            Speech.speak(fakeMessage.message, {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
        } catch (error) {
            console.error('Speech error:', error);
        }

        return fakeMessage;
    }

    getCallStatus() {
        return this.currentCall;
    }

    getEmergencyScenarios() {
        return [
            {
                id: '1',
                name: 'Family Emergency',
                contactName: 'Mom',
                message: "Mom, I need to leave now. There's an emergency.",
                type: 'call',
            },
            {
                id: '2',
                name: 'Boss Calling',
                contactName: 'Boss',
                message: "Yes sir, I'm on my way to the meeting.",
                type: 'call',
            },
            {
                id: '3',
                name: 'Friend Arrived',
                contactName: 'Friend',
                message: "Hey, I'm here! Where are you?",
                type: 'message',
            },
            {
                id: '4',
                name: 'Package Delivery',
                contactName: 'Custom',
                message: "Yes, I'll come down to receive the package.",
                type: 'message',
            },
            // New enhanced scenarios
            {
                id: '5',
                name: 'Doctor Appointment',
                contactName: 'Mom',
                message: "Yes mom, I'm heading to my doctor's appointment now.",
                type: 'call',
            },
            {
                id: '6',
                name: 'Car Break Down',
                contactName: 'Dad',
                message: "Dad, my car broke down. Can you help?",
                type: 'call',
            },
            {
                id: '7',
                name: 'Food Delivery',
                contactName: 'Custom',
                message: "I'll be down in 2 minutes!",
                type: 'message',
            },
            {
                id: '8',
                name: 'Pet Emergency',
                contactName: 'Friend',
                message: "My pet needs urgent vet care!",
                type: 'call',
            },
        ];
    }

    // Add custom scenario
    async addCustomScenario(scenario) {
        await this.initialize();

        const newScenario = {
            id: Date.now().toString(),
            ...scenario,
        };

        this.settings.customScenarios = [
            ...(this.settings.customScenarios || []),
            newScenario
        ];

        await this.saveSettings();
        return newScenario;
    }

    // Get all scenarios including custom ones
    async getAllScenarios() {
        const emergency = this.getEmergencyScenarios();
        const custom = this.settings.customScenarios || [];
        return [...emergency, ...custom];
    }

    // Delete custom scenario
    async deleteCustomScenario(scenarioId) {
        await this.initialize();

        this.settings.customScenarios = (
            this.settings.customScenarios || []
        ).filter(s => s.id !== scenarioId);

        await this.saveSettings();
    }

    // Update vibration pattern
    async setVibrationPattern(pattern) {
        await this.initialize();

        this.settings.vibrationPattern = pattern;
        await this.saveSettings();

        return this.settings;
    }

    // Get available vibration patterns
    getVibrationPatterns() {
        return [
            { id: 'default', name: 'Default', pattern: [0, 500, 200, 500] },
            { id: 'urgent', name: 'Urgent', pattern: [0, 200, 100, 200, 100, 200] },
            { id: 'long', name: 'Long Ring', pattern: [0, 1000, 500, 1000] },
            { id: 'short', name: 'Short Ring', pattern: [0, 300, 150, 300] },
            { id: 'silent', name: 'Silent (No Vibration)', pattern: [] },
        ];
    }
}

export default new FakeCallService();
