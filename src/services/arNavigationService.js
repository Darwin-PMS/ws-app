// AR Navigation Service for Escape Guidance
// Augmented Reality overlays showing safe directions and nearby help points

import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import safetyService from './safetyService';

class ARNavigationService {
    constructor() {
        this.cameraPermission = null;
        this.currentLocation = null;
        this.compassHeading = 0;
        this.safePoints = [];
        this.arOverlayData = null;
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        await this.requestCameraPermission();
        await this.loadSafePoints();
    }

    async requestCameraPermission() {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            this.cameraPermission = status === 'granted';
            
            return {
                success: this.cameraPermission,
                message: this.cameraPermission ? 'Camera permission granted' : 'Camera permission denied',
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async loadSafePoints() {
        try {
            // Load from storage or use defaults
            const stored = await AsyncStorage.getItem('@ar_safe_points');
            
            if (stored) {
                this.safePoints = JSON.parse(stored);
            } else {
                // Default safe points (police stations, hospitals, etc.)
                this.safePoints = [
                    { id: '1', name: 'Police Station', type: 'police', icon: 'shield-checkmark' },
                    { id: '2', name: 'Hospital', type: 'hospital', icon: 'medical' },
                    { id: '3', name: 'Fire Station', type: 'fire', icon: 'flame' },
                    { id: '4', name: 'Metro Station', type: 'transit', icon: 'train' },
                    { id: '5', name: 'Shopping Mall', type: 'public', icon: 'storefront' },
                    { id: '6', name: 'Hotel', type: 'lodging', icon: 'business' },
                ];
            }
        } catch (error) {
            console.error('Error loading safe points:', error);
            this.safePoints = [];
        }
        
        return this.safePoints;
    }

    // ==================== LOCATION & ORIENTATION ====================

    async getCurrentLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return { success: false, message: 'Location permission denied' };
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            this.currentLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                heading: location.coords.heading || 0,
                timestamp: Date.now(),
            };

            return { success: true, location: this.currentLocation };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async startLocationUpdates(callback) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { success: false, message: 'Location permission denied' };
        }

        const watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000, // 2 seconds
                distanceInterval: 5, // 5 meters
            },
            (location) => {
                this.currentLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    heading: location.coords.heading || this.compassHeading,
                    timestamp: Date.now(),
                };
                
                if (callback) {
                    callback(this.currentLocation);
                }
            }
        );

        return { success: true, watchId };
    }

    stopLocationUpdates(watchId) {
        if (watchId) {
            watchId.remove();
        }
    }

    // ==================== NEARBY SAFE POINTS ====================

    async findNearbySafePoints(radius = 1000) {
        if (!this.currentLocation) {
            await this.getCurrentLocation();
        }

        if (!this.currentLocation) {
            return { success: false, message: 'Location not available' };
        }

        try {
            // Get safe zones from safety service
            const safeZones = await safetyService.getSafeZonesNearLocation(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                radius / 1000 // Convert to km
            );

            // Get help points (police, hospitals, etc.)
            const helpPoints = await this.findHelpPoints(radius);

            // Combine and calculate AR data
            const allPoints = [
                ...safeZones.map(zone => ({
                    ...zone,
                    type: 'safe_zone',
                    icon: 'shield-checkmark',
                    priority: 1,
                })),
                ...helpPoints.map(point => ({
                    ...point,
                    type: point.category || 'help',
                    icon: this.getIconForType(point.category),
                    priority: 2,
                })),
            ];

            // Calculate distance and bearing for each point
            const pointsWithAR = allPoints.map(point => {
                const distance = this.calculateDistance(
                    this.currentLocation.latitude,
                    this.currentLocation.longitude,
                    point.latitude || point.lat,
                    point.longitude || point.lon
                );

                const bearing = this.calculateBearing(
                    this.currentLocation.latitude,
                    this.currentLocation.longitude,
                    point.latitude || point.lat,
                    point.longitude || point.lon
                );

                return {
                    ...point,
                    distance,
                    bearing,
                    distanceText: this.formatDistance(distance),
                };
            });

            // Sort by distance
            pointsWithAR.sort((a, b) => a.distance - b.distance);

            // Limit to nearest 20 points
            const nearestPoints = pointsWithAR.slice(0, 20);

            this.arOverlayData = {
                points: nearestPoints,
                location: this.currentLocation,
                timestamp: Date.now(),
            };

            return {
                success: true,
                points: nearestPoints,
                arData: this.arOverlayData,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async findHelpPoints(radius = 1000) {
        // Simulated help points - in production, use actual POI API
        const categories = ['police', 'hospital', 'pharmacy', 'transit'];
        const helpPoints = [];

        // Generate sample help points around current location
        const baseLat = this.currentLocation?.latitude || 28.6139;
        const baseLon = this.currentLocation?.longitude || 77.209;

        categories.forEach((category, index) => {
            // Create points in different directions
            const angles = [0, 90, 180, 270];
            
            angles.forEach((angle, i) => {
                const distanceKm = (radius / 1000) * (0.3 + i * 0.2);
                const bearingRad = (angle * Math.PI) / 180;

                const lat = baseLat + (distanceKm * Math.cos(bearingRad)) / 111.32;
                const lon = baseLon + (distanceKm * Math.sin(bearingRad)) / (111.32 * Math.cos((baseLat * Math.PI) / 180));

                helpPoints.push({
                    id: `${category}_${index}_${i}`,
                    name: this.getHelpPointName(category, i),
                    category,
                    latitude: lat,
                    longitude: lon,
                    address: `${category} facility ${i + 1}`,
                });
            });
        });

        return helpPoints;
    }

    getHelpPointName(category, index) {
        const names = {
            police: ['Police Station', 'Police Outpost', 'Police Booth'],
            hospital: ['Hospital', 'Clinic', 'Medical Center'],
            pharmacy: ['Pharmacy', 'Chemist', 'Medical Store'],
            transit: ['Metro Station', 'Bus Stop', 'Taxi Stand'],
        };

        const categoryNames = names[category] || ['Help Point'];
        return categoryNames[index % categoryNames.length];
    }

    getIconForType(type) {
        const icons = {
            police: 'shield-checkmark',
            hospital: 'medical',
            pharmacy: 'medkit',
            transit: 'bus',
            safe_zone: 'shield-checkmark',
            public: 'people',
            lodging: 'business',
        };
        return icons[type] || 'location';
    }

    // ==================== AR CALCULATIONS ====================

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

    calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        const bearing = (θ * 180 / Math.PI + 360) % 360;
        return bearing;
    }

    getARPosition(point, screenWidth, screenHeight) {
        if (!this.currentLocation || !this.arOverlayData) {
            return null;
        }

        // Calculate relative bearing from device heading
        const deviceHeading = this.currentLocation.heading || 0;
        const relativeBearing = (point.bearing - deviceHeading + 360) % 360;

        // Convert to screen X position (center is 0 degrees)
        const fov = 60; // Field of view in degrees
        const xPercent = (relativeBearing - 180) / fov + 0.5;
        const x = xPercent * screenWidth;

        // Calculate Y position based on distance (closer = lower on screen)
        const maxDistance = 1000; // Max distance to show
        const yPercent = Math.min(point.distance / maxDistance, 1);
        const y = screenHeight * 0.3 + (yPercent * screenHeight * 0.5);

        // Check if point is within FOV
        const isInView = relativeBearing > (180 - fov / 2) && relativeBearing < (180 + fov / 2);

        return {
            x,
            y,
            isInView,
            opacity: isInView ? 1 : 0.3,
            scale: isInView ? 1 : 0.8,
        };
    }

    // ==================== ESCAPE ROUTE GUIDANCE ====================

    async calculateEscapeRoute(dangerLocation) {
        if (!this.currentLocation) {
            await this.getCurrentLocation();
        }

        if (!this.currentLocation) {
            return { success: false, message: 'Location not available' };
        }

        try {
            // Find safe points
            const { points } = await this.findNearbySafePoints(500);

            if (!points || points.length === 0) {
                return { success: false, message: 'No safe points found nearby' };
            }

            // Calculate route away from danger
            const dangerBearing = this.calculateBearing(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                dangerLocation.latitude,
                dangerLocation.longitude
            );

            // Find safe point in opposite direction
            const safePoints = points.filter(point => {
                const pointBearing = point.bearing;
                const bearingDiff = Math.abs(pointBearing - dangerBearing);
                // Prefer points at least 90 degrees away from danger
                return bearingDiff > 90 || bearingDiff < 270;
            });

            const bestEscape = safePoints.length > 0 
                ? safePoints.reduce((best, current) => 
                    current.distance < best.distance ? current : best
                )
                : points[0]; // Fallback to nearest

            return {
                success: true,
                escapeRoute: {
                    destination: bestEscape,
                    distance: bestEscape.distance,
                    bearing: bestEscape.bearing,
                    direction: this.getBearingDirection(bestEscape.bearing),
                    estimatedTime: Math.round(bestEscape.distance / 80), // ~80m/min walking
                    arOverlay: this.generateAREscapeOverlay(bestEscape),
                },
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    generateAREscapeOverlay(escapePoint) {
        return {
            arrows: [
                {
                    type: 'direction',
                    bearing: escapePoint.bearing,
                    distance: escapePoint.distance,
                    color: '#10B981',
                },
            ],
            markers: [
                {
                    type: 'destination',
                    latitude: escapePoint.latitude || escapePoint.lat,
                    longitude: escapePoint.longitude || escapePoint.lon,
                    icon: 'flag',
                    color: '#10B981',
                    label: escapePoint.name,
                },
            ],
            path: {
                type: 'line',
                color: '#10B981',
                width: 4,
                dashed: false,
            },
        };
    }

    getBearingDirection(bearing) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(bearing / 45) % 8;
        return directions[index];
    }

    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }

    // ==================== AR OVERLAY DATA ====================

    getAROverlayData() {
        return this.arOverlayData;
    }

    refreshARData() {
        return this.findNearbySafePoints();
    }

    // ==================== COMPASS ====================

    async startCompassUpdates(callback) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { success: false, message: 'Location permission denied' };
        }

        const watchId = await Location.watchHeadingAsync((heading) => {
            this.compassHeading = heading.trueHeading || heading.magneticHeading;
            
            if (this.currentLocation) {
                this.currentLocation.heading = this.compassHeading;
            }

            if (callback) {
                callback(this.compassHeading);
            }
        });

        return { success: true, watchId };
    }

    stopCompassUpdates(watchId) {
        if (watchId) {
            watchId.remove();
        }
    }

    // ==================== UTILS ====================

    async addCustomSafePoint(point) {
        const newPoint = {
            id: Date.now().toString(),
            name: point.name || 'Safe Point',
            latitude: point.latitude,
            longitude: point.longitude,
            type: point.type || 'custom',
            icon: point.icon || 'location',
            custom: true,
        };

        this.safePoints.push(newPoint);
        
        try {
            await AsyncStorage.setItem('@ar_safe_points', JSON.stringify(this.safePoints));
        } catch (error) {
            console.error('Error saving safe point:', error);
        }

        return { success: true, point: newPoint };
    }

    async removeSafePoint(pointId) {
        this.safePoints = this.safePoints.filter(p => p.id !== pointId);
        
        try {
            await AsyncStorage.setItem('@ar_safe_points', JSON.stringify(this.safePoints));
        } catch (error) {
            console.error('Error removing safe point:', error);
        }

        return { success: true };
    }

    clearARData() {
        this.arOverlayData = null;
    }
}

export default new ARNavigationService();
