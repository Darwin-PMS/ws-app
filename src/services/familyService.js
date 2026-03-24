// Family Service
// API calls for family management

import { apiClient, ENDPOINTS } from './api/client';

export const familyService = {
    async createFamily(familyData) {
        return apiClient.post(ENDPOINTS.families.create, familyData);
    },

    async getMyFamilies() {
        return apiClient.get(ENDPOINTS.families.list);
    },

    async getFamilyById(familyId) {
        return mobileApi.get(ENDPOINTS.families.details(familyId));
    },

    async updateFamily(familyId, familyData) {
        return mobileApi.put(ENDPOINTS.families.update(familyId), familyData);
    },

    async deleteFamily(familyId) {
        return mobileApi.delete(ENDPOINTS.families.delete(familyId));
    },

    async getFamilyMembers(familyId) {
        return mobileApi.get(ENDPOINTS.families.members(familyId));
    },

    async addMember(familyId, memberData) {
        return mobileApi.post(ENDPOINTS.families.addMember(familyId), memberData);
    },

    async removeMember(familyId, userId) {
        return mobileApi.delete(ENDPOINTS.families.removeMember(familyId, userId));
    },

    async updateMemberRole(familyId, userId, role) {
        return mobileApi.put(ENDPOINTS.families.updateMemberRole(familyId, userId), { role });
    },

    async getRelationships(familyId) {
        return mobileApi.get(ENDPOINTS.families.relationships(familyId));
    },

    async addRelationship(familyId, relationshipData) {
        return mobileApi.post(ENDPOINTS.families.addRelationship(familyId), relationshipData);
    },

    async removeRelationship(familyId, relationshipId) {
        return mobileApi.delete(ENDPOINTS.families.deleteRelationship(familyId, relationshipId));
    },

    async findUserByEmail(email) {
        return mobileApi.get(ENDPOINTS.families.userLookup(email));
    },

    async getFamilyLocations(familyId) {
        return mobileApi.get(ENDPOINTS.families.locations(familyId));
    },

    async getMemberLocation(familyId, userId) {
        return mobileApi.get(ENDPOINTS.families.memberLocation(familyId, userId));
    }
};

export default familyService;
