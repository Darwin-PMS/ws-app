import databaseService from '../../services/databaseService';

class AdminService {
    async getDashboardStats() {
        return databaseService.getUserStats();
    }

    async getAllUsers(params = {}) {
        return databaseService.getAllUsers(params);
    }

    async getUserById(userId) {
        return databaseService.getUser(userId);
    }

    async updateUserRole(userId, role) {
        return databaseService.updateUserRole(userId, role);
    }

    async updateUserStatus(userId, status) {
        return databaseService.updateUserStatus(userId, status);
    }

    async deleteUser(userId) {
        return databaseService.deleteUser(userId);
    }

    async getAllFamilies(params = {}) {
        return databaseService.getAllFamilies(params);
    }

    async getFamilyById(familyId) {
        return databaseService.getFamilyById(familyId);
    }

    async updateFamily(familyId, data) {
        return databaseService.updateFamily(familyId, data);
    }

    async deleteFamily(familyId) {
        return databaseService.deleteFamily(familyId);
    }

    async getAllSOSAlerts(params = {}) {
        return databaseService.getAllSOSAlerts(params);
    }

    async getSOSAlertById(alertId) {
        return databaseService.getSOSAlertById(alertId);
    }

    async resolveSOSAlert(alertId, resolution) {
        return databaseService.resolveSOSAlert(alertId, resolution);
    }

    async getActiveLocations(params = {}) {
        return databaseService.getActiveLocations(params);
    }

    async getUserLocationHistory(userId, params = {}) {
        return databaseService.getUserLocationHistory(userId, params);
    }

    async getAllEmergencyContacts(params = {}) {
        return databaseService.getEmergencyContacts(params);
    }

    async getGrievanceReports(params = {}) {
        return databaseService.getGrievances(params);
    }

    async updateGrievanceStatus(grievanceId, status) {
        return databaseService.updateGrievanceStatus(grievanceId, status);
    }

    async getActivityLogs(params = {}) {
        return databaseService.getActivityLogs(params);
    }

    async getSystemHealth() {
        return databaseService.getSystemHealth();
    }

    async forceLogoutUser(userId) {
        return databaseService.forceLogoutUser(userId);
    }

    async sendNotification(userId, notification) {
        return databaseService.sendNotificationToUser(userId, notification);
    }

    async broadcastNotification(notification) {
        return databaseService.broadcastNotification(notification);
    }

    async getAllNotifications(params = {}) {
        return databaseService.getAllAdminNotifications(params);
    }

    async searchUsers(query) {
        return databaseService.searchUsers(query);
    }

    async getUserDependents(userId) {
        return databaseService.getUserChildren(userId);
    }

    async getUserFamilies(userId) {
        return databaseService.getUserFamilies(userId);
    }

    async getUserFamilyMembers(userId) {
        return databaseService.getUserFamilies(userId);
    }
}

export default new AdminService();
