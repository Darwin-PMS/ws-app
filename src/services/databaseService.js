// Database Service for MySQL
// This service handles all database operations through a REST API

import loggerService from './loggerService';
import { API_CONFIG, ENDPOINTS } from './api/endpoints';

// API Configuration - Using factory config
const API_BASE_URL = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/mobile`;

// User Roles
export const USER_ROLES = {
    WOMAN: 'woman',           // Primary user (women seeking safety)
    PARENT: 'parent',        // Parent of child users
    GUARDIAN: 'guardian',    // Guardian/guardian of women/children
    FRIEND: 'friend',        // Trusted friend who can receive alerts
    ADMIN: 'admin',          // Admin user for managing the system
};

class DatabaseService {
    constructor() {
        this.token = null;
        this.refreshToken = null;
        this.tokenUpdateCallback = null;
    }

    // Set callback for token updates
    setTokenUpdateCallback(callback) {
        this.tokenUpdateCallback = callback;
    }

    // Set authentication tokens
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
    }

    // Clear tokens on logout
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
    }

    // ==================== AUTHENTICATION ====================

    // Register new user
    async register(userData) {
        return this.fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    // Login user
    async login(credentials) {
        return this.fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    // Biometric login
    async loginWithBiometric(credentials) {
        return this.fetchAPI('/auth/biometric-login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    // Logout user
    async logout(userId) {
        return this.fetchAPI('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ userId }),
            skipAuth: true, // Skip auth to allow logout even with expired token
        });
    }

    // Admin: Force logout a specific user (invalidates all their sessions)
    async forceLogoutUser(userId) {
        return this.fetchAPI(`/auth/force-logout/${userId}`, {
            method: 'POST',
        });
    }

    // Record session event (login/logout/force_logout)
    async recordSession(sessionData) {
        return this.fetchAPI('/sessions/record', {
            method: 'POST',
            body: JSON.stringify(sessionData),
            skipAuth: true, // Skip auth to allow recording even with expired token
        });
    }

    // Get user's session history
    async getUserSessionHistory(userId, limit = 50, offset = 0) {
        return this.fetchAPI(`/sessions/history?limit=${limit}&offset=${offset}`);
    }

    // Get user's last session
    async getLastSession(userId) {
        return this.fetchAPI(`/sessions/user/${userId}/last`);
    }

    // Get active sessions count
    async getActiveSessionsCount(userId) {
        return this.fetchAPI(`/sessions/user/${userId}/active-count`);
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        return this.fetchAPI('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    // Refresh access token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        return this.fetchAPI('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
    }

    // Generic fetch wrapper
    async fetchAPI(endpoint, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        const requestHeaders = {
            ...defaultHeaders,
            ...options.headers,
        };

        const fullUrl = `${API_BASE_URL}${endpoint}`;

        // Log API request
        if (__DEV__) {
            console.log('API:', options.method || 'GET', endpoint);
        }

        // Log to logger service
        loggerService.info('api', `API: ${options.method || 'GET'} ${endpoint}`);

        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(fullUrl, {
                ...options,
                headers: requestHeaders,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseData = await response.json();

            if (!response.ok) {
                // Try to refresh token on 401 or 403 (server returns 403 for expired tokens)
                if ((response.status === 401 || response.status === 403) && this.refreshToken) {
                    try {
                        const refreshResult = await this.refreshAccessToken();
                        if (refreshResult.success) {
                            this.token = refreshResult.token;
                            // Call the callback if set (to update AsyncStorage/AppContext)
                            if (this.tokenUpdateCallback) {
                                this.tokenUpdateCallback(refreshResult.token);
                            }
                            // Retry original request
                            return this.fetchAPI(endpoint, options);
                        }
                    } catch (e) {
                        // Refresh failed, clear tokens
                        this.clearTokens();
                    }
                }

                // Try to get error message from response body
                let errorMessage = `${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `${response.status}: ${response.statusText}`;

                    // Log HTTP error
                    loggerService.error('api', `HTTP ${response.status}: ${errorMessage}`, {
                        endpoint,
                        method: options.method,
                        status: response.status
                    });
                } catch (e) {
                    // Response might not be JSON, use status text
                    errorMessage = response.statusText ? `${response.status} - ${response.statusText}` : `Error: ${response.status}`;

                    // Log HTTP error
                    loggerService.error('api', `HTTP ${response.status}: ${errorMessage}`, {
                        endpoint,
                        method: options.method,
                        status: response.status
                    });
                }
                throw new Error(errorMessage);
            }

            // Log successful response
            loggerService.info('api', `Success: ${endpoint}`, { method: options.method, status: response.status });
            return responseData;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timeout');
                loggerService.error('api', 'Request timeout - no response from server', { endpoint, method: options.method });
                throw new Error('Request timeout - please try again');
            }
            console.error('API Error:', error.message);
            loggerService.error('api', `API Error: ${error.message}`, { endpoint, method: options.method }, error);
            throw error;
        }
    }

    // ==================== USER OPERATIONS ====================

    // Get user by ID
    async getUser(userId) {
        return this.fetchAPI(`/users/${userId}`);
    }

    // Update user
    async updateUser(userId, userData) {
        return this.fetchAPI(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // Get user role
    async getUserRole(userId) {
        return this.fetchAPI(`/users/${userId}/role`);
    }

    // ==================== EMERGENCY CONTACTS ====================

    // Get emergency contacts for a user
    async getEmergencyContacts(userId) {
        return this.fetchAPI(`/users/${userId}/emergency-contacts`);
    }

    // Add emergency contact
    async addEmergencyContact(userId, contactData) {
        return this.fetchAPI(`/users/${userId}/emergency-contacts`, {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    // Delete emergency contact
    async deleteEmergencyContact(userId, contactId) {
        return this.fetchAPI(`/users/${userId}/emergency-contacts/${contactId}`, {
            method: 'DELETE',
        });
    }

    // Update emergency contact
    async updateEmergencyContact(userId, contactId, contactData) {
        return this.fetchAPI(`/users/${userId}/emergency-contacts/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify(contactData),
        });
    }

    // ==================== LOCATION HISTORY ====================

    // Save location
    async saveLocation(userId, locationData) {
        return this.fetchAPI(`/users/${userId}/locations`, {
            method: 'POST',
            body: JSON.stringify(locationData),
        });
    }

    // Get location history
    async getLocationHistory(userId, options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAPI(`/users/${userId}/locations?${queryParams}`);
    }

    // ==================== SOS ALERTS ====================

    // Create SOS alert
    async createSOSAlert(alertData) {
        return this.fetchAPI('/sos-alerts', {
            method: 'POST',
            body: JSON.stringify(alertData),
        });
    }

    // Get SOS alerts for user
    async getSOSAlerts(userId) {
        return this.fetchAPI(`/users/${userId}/sos-alerts`);
    }

    // ==================== CHILD CARE ====================

    // Get child profiles
    async getChildren(userId) {
        return this.fetchAPI(`/users/${userId}/children`);
    }

    // Add child
    async addChild(userId, childData) {
        return this.fetchAPI(`/users/${userId}/children`, {
            method: 'POST',
            body: JSON.stringify(childData),
        });
    }

    // Log child activity
    async logChildActivity(userId, childId, activityData) {
        return this.fetchAPI(`/users/${userId}/children/${childId}/activities`, {
            method: 'POST',
            body: JSON.stringify(activityData),
        });
    }

    // ==================== NOTIFICATIONS ====================

    // Get notifications
    async getNotifications(userId) {
        return this.fetchAPI(`/users/${userId}/notifications`);
    }

    // Mark notification as read
    async markNotificationRead(userId, notificationId) {
        return this.fetchAPI(`/users/${userId}/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    // ==================== SETTINGS ====================

    // Get user settings
    async getSettings(userId) {
        return this.fetchAPI(`/users/${userId}/settings`);
    }

    // Update settings
    async updateSettings(userId, settings) {
        return this.fetchAPI(`/users/${userId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    // ==================== ADMIN FEATURES ====================

    // Get all users (Admin only)
    async getAllUsers(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAPI(`/admin/users?${queryParams}`);
    }

    // Get user statistics (Admin only)
    async getUserStats() {
        return this.fetchAPI('/admin/stats');
    }

    // Get all families (Admin only)
    async getAllFamilies(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAPI(`/admin/families?${queryParams}`);
    }

    // Get family by ID (Admin only)
    async getFamilyById(familyId) {
        return this.fetchAPI(`/admin/families/${familyId}`);
    }

    // Update family (Admin only)
    async updateFamily(familyId, familyData) {
        return this.fetchAPI(`/admin/families/${familyId}`, {
            method: 'PUT',
            body: JSON.stringify(familyData),
        });
    }

    // Delete family (Admin only)
    async deleteFamily(familyId) {
        return this.fetchAPI(`/admin/families/${familyId}`, {
            method: 'DELETE',
        });
    }
}

export default new DatabaseService();
