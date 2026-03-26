// Location Service for Maps and Geofencing
import * as Location from 'expo-location';
import { Linking, Platform, AppState } from 'react-native';
import userService from './userService';

class LocationService {
    constructor() {
        this.watchLocation = null;
        this.geofences = [];
        this.saveInterval = null;
        this.isTracking = false;
    }

    // ==================== LOCATION PERMISSIONS ====================

    // Request location permissions
    async requestPermissions() {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

        if (foregroundStatus !== 'granted') {
            return {
                success: false,
                message: 'Foreground location permission denied'
            };
        }

        // Request background permissions for geofencing
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        return {
            success: true,
            foreground: foregroundStatus === 'granted',
            background: backgroundStatus === 'granted'
        };
    }

    // Check if location services are enabled
    async isLocationServicesEnabled() {
        return await Location.hasServicesEnabledAsync();
    }

    // ==================== GET LOCATION ====================

    // Get current location
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            return {
                success: true,
                location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    altitude: location.coords.altitude,
                    accuracy: location.coords.accuracy,
                    heading: location.coords.heading,
                    speed: location.coords.speed,
                    timestamp: location.timestamp,
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    // Get last known location
    async getLastKnownLocation() {
        try {
            const location = await Location.getLastKnownPositionAsync();
            if (location) {
                return {
                    success: true,
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }
                };
            }
            return { success: false, message: 'No last known location' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== WATCH LOCATION ====================

    // Start watching location
    async startWatchingLocation(callback, options = {}) {
        if (this.watchLocation) {
            await this.stopWatchingLocation();
        }

        const defaultOptions = {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 10, // 10 meters
        };

        const mergedOptions = { ...defaultOptions, ...options };

        this.watchLocation = await Location.watchPositionAsync(
            {
                accuracy: mergedOptions.accuracy,
                timeInterval: mergedOptions.timeInterval,
                distanceInterval: mergedOptions.distanceInterval,
            },
            (location) => {
                callback({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    altitude: location.coords.altitude,
                    accuracy: location.coords.accuracy,
                    heading: location.coords.heading,
                    speed: location.coords.speed,
                    timestamp: location.timestamp,
                });
            }
        );

        return { success: true };
    }

    // Stop watching location
    async stopWatchingLocation() {
        if (this.watchLocation) {
            this.watchLocation.remove();
            this.watchLocation = null;
        }
        return { success: true };
    }

    // Start background location tracking with server save
    async startBackgroundLocationTracking(userId, intervalMs = 60000) {
        await this.stopBackgroundLocationTracking();
        
        const permission = await this.requestPermissions();
        if (!permission.success) {
            return { success: false, message: permission.message };
        }

        await this.startWatchingLocation(async (location) => {
            try {
                await userService.saveLocation(userId, {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    altitude: location.altitude || null,
                    speed: location.speed || null,
                    heading: location.heading || null,
                    timestamp: location.timestamp || Date.now(),
                });
            } catch (error) {
                console.error('Failed to save location:', error);
            }
        }, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: intervalMs,
            distanceInterval: 50,
        });

        return { success: true, message: 'Background location tracking started' };
    }

    // Stop background location tracking
    async stopBackgroundLocationTracking() {
        await this.stopWatchingLocation();
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        return { success: true };
    }

    // Get current location and save to server immediately
    async saveCurrentLocation(userId) {
        try {
            if (!userId) {
                console.error('📍 User ID is missing');
                return { success: false, message: 'User session not found' };
            }
            console.log('📍 getCurrentLocation called for user:', userId);
            const locationResult = await this.getCurrentLocation();
            console.log('📍 Location result:', locationResult);
            
            if (locationResult.success) {
                console.log('📍 Saving location to server:', locationResult.location);
                await userService.saveLocation(userId, {
                    latitude: locationResult.location.latitude,
                    longitude: locationResult.location.longitude,
                    accuracy: locationResult.location.accuracy,
                    altitude: locationResult.location.altitude || null,
                    speed: locationResult.location.speed || null,
                    heading: locationResult.location.heading || null,
                    timestamp: locationResult.location.timestamp || Date.now(),
                });
                console.log('📍 Location saved successfully');
                return { success: true, location: locationResult.location };
            }
            console.log('📍 Failed to get location:', locationResult.message);
            return { success: false, message: locationResult.message };
        } catch (error) {
            console.error('📍 Error saving location:', error);
            return { success: false, message: error.message };
        }
    }

    // Save location periodically while app is active
    async startPeriodicLocationSave(userId, intervalMs = 60000) {
        await this.stopPeriodicLocationSave();
        
        const permission = await this.requestPermissions();
        if (!permission.success) {
            console.log('Location permission denied:', permission.message);
            return { success: false, message: permission.message };
        }

        // Save immediately
        console.log('📍 Saving initial location for user:', userId);
        await this.saveCurrentLocation(userId);

        // Save periodically
        console.log('📍 Starting periodic location save, interval:', intervalMs);
        this.saveInterval = setInterval(async () => {
            try {
                console.log('📍 Periodic save: Saving location for user:', userId);
                await this.saveCurrentLocation(userId);
            } catch (error) {
                console.error('Periodic location save error:', error);
            }
        }, intervalMs);

        this.isTracking = true;
        return { success: true, message: 'Periodic location tracking started' };
    }

    // Stop periodic location save
    async stopPeriodicLocationSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        this.isTracking = false;
        return { success: true };
    }

    // ==================== MAPS ====================

    // Open maps app with location
    async openMapsApp(latitude, longitude, label = 'Location') {
        const scheme = Platform.select({
            ios: 'maps:',
            android: 'geo:',
        });

        const url = Platform.select({
            ios: `maps:?daddr=${latitude},${longitude}&dirflg=d`,
            android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
        });

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                return { success: true };
            }

            // Fallback to Google Maps web
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            await Linking.openURL(webUrl);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get Google Maps URL
    getGoogleMapsUrl(latitude, longitude, label = 'Location') {
        return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    // Get directions URL
    getDirectionsUrl(latitude, longitude) {
        return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&dirflg=d`;
    }

    // ==================== GEOFENCING ====================

    // Calculate distance between two points (in meters)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Check if point is inside geofence
    isPointInGeofence(point, geofence) {
        const { latitude, longitude, radius } = geofence;
        const distance = this.calculateDistance(
            point.latitude,
            point.longitude,
            latitude,
            longitude
        );
        return distance <= radius;
    }

    // Add geofence
    addGeofence(geofence) {
        const newGeofence = {
            id: Date.now().toString(),
            ...geofence,
            active: true,
        };
        this.geofences.push(newGeofence);
        return newGeofence;
    }

    // Remove geofence
    removeGeofence(geofenceId) {
        this.geofences = this.geofences.filter(g => g.id !== geofenceId);
    }

    // Get all geofences
    getGeofences() {
        return this.geofences;
    }

    // Check all geofences for breaches
    checkGeofences(currentLocation) {
        const breaches = [];

        for (const geofence of this.geofences) {
            if (!geofence.active) continue;

            const isInside = this.isPointInGeofence(currentLocation, geofence);

            if (geofence.wasInside && !isInside) {
                // Exited geofence
                breaches.push({
                    geofenceId: geofence.id,
                    type: 'exit',
                    geofence,
                    location: currentLocation,
                    timestamp: Date.now(),
                });
            } else if (!geofence.wasInside && isInside) {
                // Entered geofence
                breaches.push({
                    geofenceId: geofence.id,
                    type: 'enter',
                    geofence,
                    location: currentLocation,
                    timestamp: Date.now(),
                });
            }

            // Update wasInside state
            geofence.wasInside = isInside;
        }

        return breaches;
    }

    // Start geofence monitoring
    async startGeofenceMonitoring(callback) {
        const permission = await this.requestPermissions();
        if (!permission.success) {
            return { success: false, message: permission.message };
        }

        await this.startWatchingLocation((location) => {
            const breaches = this.checkGeofences(location);
            if (breaches.length > 0) {
                breaches.forEach(breach => callback(breach));
            }
        });

        return { success: true };
    }

    // ==================== ADDRESS GEOCODING ====================

    // Get address from coordinates (reverse geocoding)
    async getAddressFromCoordinates(latitude, longitude) {
        try {
            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (results.length > 0) {
                const address = results[0];
                return {
                    success: true,
                    address: {
                        street: address.street,
                        city: address.city,
                        region: address.region,
                        country: address.country,
                        postalCode: address.postalCode,
                        name: address.name,
                        formatted: `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim(),
                    }
                };
            }
            return { success: false, message: 'No address found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get coordinates from address (geocoding)
    async getCoordinatesFromAddress(address) {
        try {
            const results = await Location.geocodeAsync(address);

            if (results.length > 0) {
                return {
                    success: true,
                    location: {
                        latitude: results[0].latitude,
                        longitude: results[0].longitude,
                    }
                };
            }
            return { success: false, message: 'No location found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== SAFE ROUTES ====================

    // Calculate center point between multiple locations
    calculateCenter(locations) {
        if (!locations || locations.length === 0) return null;

        let x = 0, y = 0, z = 0;

        locations.forEach(loc => {
            const lat = (loc.latitude * Math.PI) / 180;
            const lon = (loc.longitude * Math.PI) / 180;

            x += Math.cos(lat) * Math.cos(lon);
            y += Math.cos(lat) * Math.sin(lon);
            z += Math.sin(lat);
        });

        const total = locations.length;
        x /= total;
        y /= total;
        z /= total;

        const centralLon = Math.atan2(y, x);
        const centralSquareRoot = Math.sqrt(x * x + y * y);
        const centralLat = Math.atan2(z, centralSquareRoot);

        return {
            latitude: (centralLat * 180) / Math.PI,
            longitude: (centralLon * 180) / Math.PI,
        };
    }
}

export default new LocationService();
