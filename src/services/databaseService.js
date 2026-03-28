// Database Service for MySQL
// This service handles all database operations through a REST API

import loggerService from './loggerService';
import { API_CONFIG, ENDPOINTS } from './api/endpoints';

// API Configuration - Using factory config
const API_BASE_URL = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/mobile`;
const API_ADMIN_URL = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/admin`;

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

    // Generic fetch wrapper for admin API
    async fetchAdminAPI(endpoint, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        const requestHeaders = {
            ...defaultHeaders,
            ...options.headers,
        };

        const fullUrl = `${API_ADMIN_URL}${endpoint}`;

        if (__DEV__) {
            console.log('Admin API:', options.method || 'GET', endpoint);
        }

        loggerService.info('api', `Admin API: ${options.method || 'GET'} ${endpoint}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(fullUrl, {
                ...options,
                headers: requestHeaders,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseData = await response.json();

            if (!response.ok) {
                let errorMessage = `${response.status}`;
                try {
                    errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `${response.status}: ${response.statusText}`;
                } catch (e) {
                    errorMessage = response.statusText ? `${response.status} - ${response.statusText}` : `Error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            loggerService.info('api', `Admin Success: ${endpoint}`, { method: options.method, status: response.status });
            return responseData;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            console.error('Admin API Error:', error.message);
            loggerService.error('api', `Admin API Error: ${error.message}`, { endpoint, method: options.method }, error);
            throw error;
        }
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
        return this.fetchAdminAPI(`/users?${queryParams}`);
    }

    // Get user statistics (Admin only)
    async getUserStats() {
        return this.fetchAdminAPI('/analytics/stats');
    }

    // Get all families (Admin only)
    async getAllFamilies(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/families?${queryParams}`);
    }

    // Get family by ID (Admin only)
    async getFamilyById(familyId) {
        return this.fetchAdminAPI(`/families/${familyId}`);
    }

    // Update family (Admin only)
    async updateFamily(familyId, familyData) {
        return this.fetchAdminAPI(`/families/${familyId}`, {
            method: 'PUT',
            body: JSON.stringify(familyData),
        });
    }

    // Delete family (Admin only)
    async deleteFamily(familyId) {
        return this.fetchAdminAPI(`/families/${familyId}`, {
            method: 'DELETE',
        });
    }

    // Update user role (Admin only)
    async updateUserRole(userId, role) {
        return this.fetchAdminAPI(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    }

    // Update user status (Admin only)
    async updateUserStatus(userId, status) {
        return this.fetchAdminAPI(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Delete user (Admin only)
    async deleteUser(userId) {
        return this.fetchAdminAPI(`/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // Search users (Admin only)
    async searchUsers(query) {
        return this.fetchAdminAPI(`/users/search?q=${encodeURIComponent(query)}`);
    }

    // Get all SOS alerts (Admin only)
    async getAllSOSAlerts(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/sos-alerts?${queryParams}`);
    }

    // Get SOS alert by ID (Admin only)
    async getSOSAlertById(alertId) {
        return this.fetchAdminAPI(`/sos-alerts/${alertId}`);
    }

    // Resolve SOS alert (Admin only)
    async resolveSOSAlert(alertId, resolution) {
        return this.fetchAdminAPI(`/sos-alerts/${alertId}/resolve`, {
            method: 'PUT',
            body: JSON.stringify(resolution),
        });
    }

    // Get active locations (Admin only)
    async getActiveLocations(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/tracking/locations?${queryParams}`);
    }

    // Get user location history (Admin only)
    async getUserLocationHistory(userId, options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/tracking/user/${userId}/history?${queryParams}`);
    }

    // Get activity logs (Admin only)
    async getActivityLogs(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/activity?${queryParams}`);
    }

    // Get system health (Admin only)
    async getSystemHealth() {
        return this.fetchAdminAPI('/health');
    }

    // Get grievances (Admin only)
    async getGrievances(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/grievance?${queryParams}`);
    }

    // Update grievance status (Admin only)
    async updateGrievanceStatus(grievanceId, status) {
        return this.fetchAdminAPI(`/grievance/${grievanceId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Get emergency contacts (Admin only)
    async getEmergencyContacts(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/emergency-contacts?${queryParams}`);
    }

    // Get notifications (Admin only)
    async getAllAdminNotifications(options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.fetchAdminAPI(`/notifications?${queryParams}`);
    }

    // Send notification to user (Admin only)
    async sendNotificationToUser(userId, notification) {
        return this.fetchAdminAPI(`/notifications/${userId}`, {
            method: 'POST',
            body: JSON.stringify(notification),
        });
    }

    // Broadcast notification (Admin only)
    async broadcastNotification(notification) {
        return this.fetchAdminAPI('/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify(notification),
        });
    }

    // Get user children/dependents (Admin only)
    async getUserChildren(userId) {
        return this.fetchAdminAPI(`/users/${userId}/dependents`);
    }

    // Get user family memberships (Admin only)
    async getUserFamilies(userId) {
        return this.fetchAdminAPI(`/users/${userId}/families`);
    }

    // Get user family members (Admin only)
    async getUserFamilyMembers(userId) {
        return this.fetchAdminAPI(`/users/${userId}/families`);
    }

    // ==================== WORKSHOP FEATURES ====================

    // Get workshop analytics (Admin only)
    async getWorkshopAnalytics(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/workshop/analytics?${queryParams}`);
    }

    // Get all users workshop progress (Admin only)
    async getWorkshopProgress(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/workshop/progress?${queryParams}`);
    }

    // Get specific user workshop progress (Admin only)
    async getUserWorkshopProgress(userId, params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/workshop/users/${userId}/progress?${queryParams}`);
    }

    // Save user workshop progress
    async saveWorkshopProgress(progressData) {
        return this.fetchAPI('/workshop/progress', {
            method: 'POST',
            body: JSON.stringify(progressData),
        });
    }

    // Get workshop leaderboard (Admin only)
    async getWorkshopLeaderboard(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/workshop/leaderboard?${queryParams}`);
    }

    // Get user achievements
    async getUserAchievements(userId) {
        return this.fetchAPI(`/workshop/users/${userId}/achievements`);
    }

    // Get workshop categories (Admin only)
    async getWorkshopCategories() {
        return this.fetchAdminAPI('/workshop/categories');
    }

    // Get workshop content (Admin only)
    async getWorkshopContent(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/workshop/content?${queryParams}`);
    }

    // Add workshop content (Admin only)
    async addWorkshopContent(contentData) {
        return this.fetchAdminAPI('/workshop/content', {
            method: 'POST',
            body: JSON.stringify(contentData),
        });
    }

    // Update workshop content (Admin only)
    async updateWorkshopContent(contentId, contentData) {
        return this.fetchAdminAPI(`/workshop/content/${contentId}`, {
            method: 'PUT',
            body: JSON.stringify(contentData),
        });
    }

    // Delete workshop content (Admin only)
    async deleteWorkshopContent(contentId) {
        return this.fetchAdminAPI(`/workshop/content/${contentId}`, {
            method: 'DELETE',
        });
    }

    // ==================== ZONE MANAGEMENT ====================

    // Get all zones (Admin only)
    async getAllZones(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/zones?${queryParams}`);
    }

    // Get zone by ID (Admin only)
    async getZoneById(zoneId) {
        return this.fetchAdminAPI(`/zones/${zoneId}`);
    }

    // Create zone (Admin only)
    async createZone(zoneData) {
        return this.fetchAdminAPI('/zones', {
            method: 'POST',
            body: JSON.stringify(zoneData),
        });
    }

    // Update zone (Admin only)
    async updateZone(zoneId, zoneData) {
        return this.fetchAdminAPI(`/zones/${zoneId}`, {
            method: 'PUT',
            body: JSON.stringify(zoneData),
        });
    }

    // Delete zone (Admin only)
    async deleteZone(zoneId) {
        return this.fetchAdminAPI(`/zones/${zoneId}`, {
            method: 'DELETE',
        });
    }

    // Assign user to zone (Admin only)
    async assignUserToZone(zoneId, userId, roleInArea = 'member', isPrimary = false) {
        return this.fetchAdminAPI(`/zones/${zoneId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ userId, roleInArea, isPrimary }),
        });
    }

    // Bulk assign users to zone (Admin only)
    async bulkAssignUsersToZone(zoneId, userIds, roleInArea = 'member', isPrimary = false) {
        return this.fetchAdminAPI(`/zones/${zoneId}/assign-bulk`, {
            method: 'POST',
            body: JSON.stringify({ userIds, roleInArea, isPrimary }),
        });
    }

    // Remove user from zone (Admin only)
    async removeUserFromZone(zoneId, userId) {
        return this.fetchAdminAPI(`/zones/${zoneId}/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // Get users in zone (Admin only)
    async getZoneUsers(zoneId, params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/zones/${zoneId}/users?${queryParams}`);
    }

    // Get SOS alerts in zone (Admin only)
    async getZoneSOSAlerts(zoneId, params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAdminAPI(`/zones/${zoneId}/sos-alerts?${queryParams}`);
    }

    // Get zone analytics (Admin only)
    async getZoneAnalytics(zoneId) {
        return this.fetchAdminAPI(`/zones/${zoneId}/analytics`);
    }

    // Get user's assigned zones
    async getMyZones() {
        return this.fetchAPI('/zones/my-zones');
    }

    // Get current user's zone-specific SOS alerts (for zone head)
    async getMyZoneSOSAlerts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.fetchAPI(`/zones/my-zone/sos-alerts?${queryParams}`);
    }

    // Get user's primary zone
    async getMyPrimaryZone() {
        return this.fetchAPI('/zones/my-zone');
    }
}

export default new DatabaseService();
