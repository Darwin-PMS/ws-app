// Zone Service
// Handles zone-based user management and zone head features

import { mobileApi, ENDPOINTS } from './api/mobileApi';

class ZoneService {
    async getMyZones() {
        return mobileApi.get(ENDPOINTS.zones.myZones);
    }

    async getMyPrimaryZone() {
        return mobileApi.get(ENDPOINTS.zones.myZone);
    }

    async getMyZoneSOSAlerts(params = {}) {
        return mobileApi.get(ENDPOINTS.zones.myZoneSOSAlerts, params);
    }

    async getZoneUsers(zoneId, params = {}) {
        return mobileApi.get(ENDPOINTS.admin.zoneUsers(zoneId), params);
    }

    async getZoneSOSAlerts(zoneId, params = {}) {
        return mobileApi.get(ENDPOINTS.admin.zoneSOSAlerts(zoneId), params);
    }

    async getZoneAnalytics(zoneId) {
        return mobileApi.get(ENDPOINTS.admin.zoneAnalytics(zoneId));
    }

    async getAllZones(params = {}) {
        return mobileApi.get(ENDPOINTS.admin.zones, params);
    }

    async getZoneById(zoneId) {
        return mobileApi.get(ENDPOINTS.admin.zoneDetail(zoneId));
    }

    async createZone(zoneData) {
        return mobileApi.post(ENDPOINTS.admin.zones, zoneData);
    }

    async updateZone(zoneId, zoneData) {
        return mobileApi.put(ENDPOINTS.admin.zoneDetail(zoneId), zoneData);
    }

    async deleteZone(zoneId) {
        return mobileApi.delete(ENDPOINTS.admin.zoneDetail(zoneId));
    }

    async assignUserToZone(zoneId, userId, roleInArea = 'member', isPrimary = false) {
        return mobileApi.post(`${ENDPOINTS.admin.zoneDetail(zoneId)}/assign`, {
            userId,
            roleInArea,
            isPrimary,
        });
    }

    async bulkAssignUsersToZone(zoneId, userIds, roleInArea = 'member', isPrimary = false) {
        return mobileApi.post(ENDPOINTS.admin.zoneAssignBulk(zoneId), {
            userIds,
            roleInArea,
            isPrimary,
        });
    }

    async removeUserFromZone(zoneId, userId) {
        return mobileApi.delete(`${ENDPOINTS.admin.zoneUsers(zoneId)}/${userId}`);
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    // Check if a location is within zone radius
    isWithinZone(userLat, userLon, zoneLat, zoneLon, radiusKm) {
        const distance = this.calculateDistance(userLat, userLon, zoneLat, zoneLon);
        return distance <= radiusKm;
    }

    // Get zone type label
    getZoneTypeLabel(type) {
        const labels = {
            country: 'Country',
            state: 'State',
            district: 'District',
            city: 'City',
            ward: 'Ward',
            village: 'Village',
            zone: 'Zone',
            area: 'Area',
        };
        return labels[type?.toLowerCase()] || type;
    }

    // Get role in area label
    getRoleLabel(role) {
        const labels = {
            admin: 'Zone Admin',
            police: 'Police',
            supervisor: 'Supervisor',
            zone_head: 'Zone Head',
            village_head: 'Village Head',
            guardian: 'Guardian',
            member: 'Member',
        };
        return labels[role?.toLowerCase()] || role;
    }
}

export default new ZoneService();
