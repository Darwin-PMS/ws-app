// User Service
// Handles user-related API operations (profile, emergency contacts, notifications, settings)

import { mobileApi, ENDPOINTS } from './api/mobileApi';

class UserService {
    async getProfile(userId) {
        return mobileApi.get(ENDPOINTS.users.profile(userId));
    }

    async updateProfile(userId, profileData) {
        return mobileApi.put(ENDPOINTS.users.updateProfile(userId), profileData);
    }

    async getUserRole(userId) {
        return mobileApi.get(ENDPOINTS.users.role(userId));
    }

    async getEmergencyContacts(userId) {
        return mobileApi.get(ENDPOINTS.users.emergencyContacts(userId));
    }

    async addEmergencyContact(userId, contactData) {
        return mobileApi.post(ENDPOINTS.users.addEmergencyContact(userId), contactData);
    }

    async deleteEmergencyContact(userId, contactId) {
        return mobileApi.delete(ENDPOINTS.users.deleteEmergencyContact(userId, contactId));
    }

    async getAllEmergencyContacts() {
        return mobileApi.get(ENDPOINTS.users.emergencyContactsAll);
    }

    async getDefaultEmergencyContacts() {
        return mobileApi.get(ENDPOINTS.users.emergencyContactsDefault);
    }

    async getEmergencyPreferences() {
        return mobileApi.get(ENDPOINTS.users.preferences);
    }

    async updateEmergencyPreferences(preferences) {
        return mobileApi.put(ENDPOINTS.users.updatePreferences, preferences);
    }

    async addUserEmergencyContact(contactData) {
        return mobileApi.post(ENDPOINTS.users.emergencyContactsAll, contactData);
    }

    async updateUserEmergencyContact(contactId, contactData) {
        return mobileApi.put(ENDPOINTS.users.emergencyContactsAll, contactData);
    }

    async deleteUserEmergencyContact(contactId) {
        return mobileApi.delete(ENDPOINTS.users.emergencyContactsAll);
    }

    async saveLocation(userId, locationData) {
        return mobileApi.post(ENDPOINTS.users.saveLocation(userId), locationData);
    }

    async getLocationHistory(userId, params = {}) {
        return mobileApi.get(ENDPOINTS.users.locations(userId));
    }

    async getSOSAlerts(userId) {
        return mobileApi.get(ENDPOINTS.users.sosAlerts(userId));
    }

    async getNotifications(userId) {
        return mobileApi.get(ENDPOINTS.users.notifications(userId));
    }

    async markNotificationRead(userId, notificationId) {
        return mobileApi.put(ENDPOINTS.users.markNotificationRead(userId, notificationId));
    }

    async markAllNotificationsRead(userId) {
        return mobileApi.put(ENDPOINTS.users.notifications(userId));
    }

    async getUserChildren(userId) {
        return mobileApi.get(ENDPOINTS.users.children(userId));
    }

    async addUserChild(userId, childData) {
        return mobileApi.post(ENDPOINTS.users.addChild(userId), childData);
    }

    async getUserSettings(userId) {
        return mobileApi.get(ENDPOINTS.users.settings(userId));
    }

    async updateUserSettings(userId, settingsData) {
        return mobileApi.put(ENDPOINTS.users.updateSettings(userId), settingsData);
    }
}

export default new UserService();
