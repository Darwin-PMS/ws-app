import { apiClient } from './api/client';
import { ENDPOINTS } from './api/mobileApi';

export const grievanceService = {
    async submitGrievance(grievanceData) {
        try {
            const response = await apiClient.post(ENDPOINTS.grievance.submit, grievanceData);
            return response;
        } catch (error) {
            console.error('Submit grievance error:', error);
            throw error;
        }
    },

    async getMyGrievances(page = 1, limit = 20) {
        try {
            const response = await apiClient.get(`${ENDPOINTS.grievance.myList}?page=${page}&limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Get grievances error:', error);
            throw error;
        }
    },

    async getGrievanceDetails(grievanceId) {
        try {
            const response = await apiClient.get(ENDPOINTS.grievance.details(grievanceId));
            return response;
        } catch (error) {
            console.error('Get grievance details error:', error);
            throw error;
        }
    },

    async getGrievanceWithMessages(grievanceId) {
        try {
            const response = await apiClient.get(ENDPOINTS.grievance.detailsWithMessages(grievanceId));
            return response;
        } catch (error) {
            console.error('Get grievance with messages error:', error);
            throw error;
        }
    },

    async updateGrievance(grievanceId, updateData) {
        try {
            const response = await apiClient.put(ENDPOINTS.grievance.update(grievanceId), updateData);
            return response;
        } catch (error) {
            console.error('Update grievance error:', error);
            throw error;
        }
    },

    async getMessages(grievanceId) {
        try {
            const response = await apiClient.get(ENDPOINTS.grievance.messages(grievanceId));
            return response;
        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    },

    async sendMessage(grievanceId, message) {
        try {
            const response = await apiClient.post(ENDPOINTS.grievance.messages(grievanceId), { message });
            return response;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    },
};

export default grievanceService;