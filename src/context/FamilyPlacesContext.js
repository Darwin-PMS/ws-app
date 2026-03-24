// Family Places Context
// Manages family places and geofencing

import React, { createContext, useContext, useState, useCallback } from 'react';
import familyPlacesService from '../services/familyPlacesService';

const FamilyPlacesContext = createContext(undefined);

export const FamilyPlacesProvider = ({ children }) => {
    const [places, setPlaces] = useState([]);
    const [currentPlace, setCurrentPlace] = useState(null);
    const [nearestPlace, setNearestPlace] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all family places
    const fetchFamilyPlaces = useCallback(async (familyId) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.getFamilyPlaces(familyId);
            if (response.success) {
                setPlaces(response.places || []);
                return { success: true, places: response.places };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get specific place
    const fetchPlaceById = useCallback(async (familyId, placeId) => {
        if (!familyId || !placeId) return { success: false, error: 'Missing IDs' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.getPlaceById(familyId, placeId);
            if (response.success) {
                setCurrentPlace(response.place);
                return { success: true, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create new place
    const createPlace = useCallback(async (familyId, placeData) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.createPlace(familyId, placeData);
            if (response.success) {
                setPlaces(prev => [...prev, response.place]);
                return { success: true, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update place
    const updatePlace = useCallback(async (familyId, placeId, placeData) => {
        if (!familyId || !placeId) return { success: false, error: 'Missing IDs' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.updatePlace(familyId, placeId, placeData);
            if (response.success) {
                setPlaces(prev => prev.map(p => p.id === placeId ? response.place : p));
                if (currentPlace?.id === placeId) {
                    setCurrentPlace(response.place);
                }
                return { success: true, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentPlace]);

    // Delete place
    const deletePlace = useCallback(async (familyId, placeId) => {
        if (!familyId || !placeId) return { success: false, error: 'Missing IDs' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.deletePlace(familyId, placeId);
            if (response.success) {
                setPlaces(prev => prev.filter(p => p.id !== placeId));
                if (currentPlace?.id === placeId) {
                    setCurrentPlace(null);
                }
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentPlace]);

    // Check if location is inside any place
    const checkLocation = useCallback(async (familyId, latitude, longitude) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.checkLocation(familyId, latitude, longitude);
            if (response.success) {
                return { success: true, isInside: response.isInside, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Find nearest place
    const findNearestPlace = useCallback(async (familyId, latitude, longitude) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.findNearestPlace(familyId, latitude, longitude);
            if (response.success) {
                setNearestPlace(response.place);
                return { success: true, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get safe zones
    const getSafeZones = useCallback(async (familyId) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.getSafeZones(familyId);
            if (response.success) {
                return { success: true, places: response.places };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get home location
    const getHomeLocation = useCallback(async (familyId) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await familyPlacesService.getHomeLocation(familyId);
            if (response.success) {
                return { success: true, place: response.place };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if within geofence (client-side calculation)
    const isWithinGeofence = useCallback((userLat, userLng, placeLat, placeLng, radiusMeters) => {
        return familyPlacesService.isWithinGeofence(userLat, userLng, placeLat, placeLng, radiusMeters);
    }, []);

    const value = {
        // State
        places,
        currentPlace,
        nearestPlace,
        isLoading,
        error,

        // Actions
        fetchFamilyPlaces,
        fetchPlaceById,
        createPlace,
        updatePlace,
        deletePlace,
        checkLocation,
        findNearestPlace,
        getSafeZones,
        getHomeLocation,
        isWithinGeofence,
    };

    return <FamilyPlacesContext.Provider value={value}>{children}</FamilyPlacesContext.Provider>;
};

export const useFamilyPlaces = () => {
    const context = useContext(FamilyPlacesContext);
    if (!context) {
        throw new Error('useFamilyPlaces must be used within a FamilyPlacesProvider');
    }
    return context;
};

export default FamilyPlacesContext;
