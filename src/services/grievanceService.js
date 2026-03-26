import { apiClient, ENDPOINTS } from './api/client';

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

    async updateGrievance(grievanceId, updateData) {
        try {
            const response = await apiClient.put(ENDPOINTS.grievance.update(grievanceId), updateData);
            return response;
        } catch (error) {
            console.error('Update grievance error:', error);
            throw error;
        }
    },
};

export default grievanceService;