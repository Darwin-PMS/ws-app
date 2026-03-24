// Family Places Service
// API calls for family places (geofences)

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const familyPlacesService = {
    async createPlace(familyId, placeData) {
        return mobileApi.post(ENDPOINTS.familyPlaces.create(familyId), placeData);
    },

    async getFamilyPlaces(familyId) {
        return mobileApi.get(ENDPOINTS.familyPlaces.list(familyId));
    },

    async getPlaceById(familyId, placeId) {
        return mobileApi.get(ENDPOINTS.familyPlaces.update(familyId, placeId));
    },

    async updatePlace(familyId, placeId, placeData) {
        return mobileApi.put(ENDPOINTS.familyPlaces.update(familyId, placeId), placeData);
    },

    async deletePlace(familyId, placeId) {
        return mobileApi.delete(ENDPOINTS.familyPlaces.delete(familyId, placeId));
    },

    async checkLocation(familyId, latitude, longitude) {
        return mobileApi.post(ENDPOINTS.familyPlaces.check(familyId), { latitude, longitude });
    },

    async findNearestPlace(familyId, latitude, longitude) {
        return mobileApi.post(ENDPOINTS.familyPlaces.nearest(familyId), { latitude, longitude });
    }
};

export default familyPlacesService;
