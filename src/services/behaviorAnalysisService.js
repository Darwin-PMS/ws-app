// Behavior Analysis Service
// AI-powered behavioral pattern analysis and anomaly detection for women safety
// Detects unexpected stops, route deviations, and unusual inactivity

import AsyncStorage from '@react-native-async-storage/async-storage';
import locationService from './locationService';
import sensorService from './sensorService';
import alertService from './alertService';
import behaviorApiService from './behaviorApiService';

// Storage keys
const STORAGE_KEYS = {
    BEHAVIOR_PATTERNS: '@behavior_patterns',
    LOCATION_HISTORY: '@location_history',
    USER_ROUTINES: '@user_routines',
    ANOMALY_EVENTS: '@anomaly_events',
    BEHAVIOR_SETTINGS: '@behavior_settings',
};

// Default settings
const DEFAULT_SETTINGS = {
    monitoringEnabled: true,
    stopDetectionEnabled: true,
    routeDeviationEnabled: true,
    inactivityDetectionEnabled: true,
    sensitivity: 'medium', // low, medium, high
    alertThreshold: 3, // Number of anomalies before alerting
    stopDurationThreshold: 120000, // 2 minutes in ms
    routeDeviationDistance: 200, // 200 meters
    inactivityThreshold: 300000, // 5 minutes in ms
    routineLearningDays: 7, // Days to learn routine
    minLocationPoints: 10, // Minimum points for routine
};

// Anomaly types
export const ANOMALY_TYPES = {
    UNEXPECTED_STOP: {
        id: 'unexpected_stop',
        label: 'Unexpected Stop',
        description: 'User stopped for an unusually long time at an unexpected location',
        severity: 'high',
        icon: 'pause-circle',
        color: '#F59E0B',
    },
    ROUTE_DEVIATION: {
        id: 'route_deviation',
        label: 'Route Deviation',
        description: 'User deviated significantly from their usual route',
        severity: 'high',
        icon: 'git-branch',
        color: '#EF4444',
    },
    UNUSUAL_INACTIVITY: {
        id: 'unusual_inactivity',
        label: 'Unusual Inactivity',
        description: 'No movement detected for an unusually long time during active hours',
        severity: 'medium',
        icon: 'bed',
        color: '#8B5CF6',
    },
    ABNORMAL_SPEED: {
        id: 'abnormal_speed',
        label: 'Abnormal Speed',
        description: 'Unusual speed pattern detected',
        severity: 'medium',
        icon: 'speedometer',
        color: '#EC4899',
    },
    OFF_ROUTE: {
        id: 'off_route',
        label: 'Off Route',
        description: 'User is far from any known route',
        severity: 'low',
        icon: 'map',
        color: '#6366F1',
    },
};

// Sensitivity thresholds
const SENSITIVITY_THRESHOLDS = {
    low: {
        stopDurationMultiplier: 3,
        routeDeviationMultiplier: 2,
        inactivityMultiplier: 2,
    },
    medium: {
        stopDurationMultiplier: 2,
        routeDeviationMultiplier: 1.5,
        inactivityMultiplier: 1.5,
    },
    high: {
        stopDurationMultiplier: 1,
        routeDeviationMultiplier: 1,
        inactivityMultiplier: 1,
    },
};

class BehaviorAnalysisService {
    constructor() {
        this.locationHistory = [];
        this.userRoutines = {
            commonRoutes: [],
            commonLocations: [],
            usualStartTimes: [],
            usualEndTimes: [],
            averageSpeeds: [],
            activeHours: { start: 8, end: 22 },
        };
        this.anomalyEvents = [];
        this.settings = { ...DEFAULT_SETTINGS };
        this.isMonitoring = false;
        this.lastLocation = null;
        this.lastMovementTime = null;
        this.currentRoute = [];
        this.stopStartTime = null;
        this.isInitialized = false;
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load settings
            const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.BEHAVIOR_SETTINGS);
            if (settingsData) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
            }

            // Load location history
            const historyData = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
            if (historyData) {
                this.locationHistory = JSON.parse(historyData);
            }

            // Load user routines
            const routinesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROUTINES);
            if (routinesData) {
                this.userRoutines = JSON.parse(routinesData);
            }

            // Load anomaly events
            const anomalyData = await AsyncStorage.getItem(STORAGE_KEYS.ANOMALY_EVENTS);
            if (anomalyData) {
                this.anomalyEvents = JSON.parse(anomalyData);
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Behavior analysis init error:', error);
            this.isInitialized = true;
        }
    }

    // ==================== SETTINGS ====================

    async updateSettings(newSettings) {
        await this.initialize();
        this.settings = { ...this.settings, ...newSettings };
        await AsyncStorage.setItem(
            STORAGE_KEYS.BEHAVIOR_SETTINGS,
            JSON.stringify(this.settings)
        );
        return this.settings;
    }

    async getSettings() {
        await this.initialize();
        return this.settings;
    }

    // ==================== LOCATION TRACKING ====================

    async startMonitoring() {
        await this.initialize();

        if (this.isMonitoring) return { success: false, message: 'Already monitoring' };

        const permResult = await locationService.requestPermissions();
        if (!permResult.success) {
            return { success: false, message: 'Location permission denied' };
        }

        this.isMonitoring = true;
        this.lastMovementTime = Date.now();

        // Start watching location
        await locationService.startWatchingLocation(
            (location) => this.handleLocationUpdate(location),
            {
                accuracy: 3, // High accuracy
                timeInterval: 10000, // 10 seconds
                distanceInterval: 5, // 5 meters
            }
        );

        return { success: true };
    }

    async stopMonitoring() {
        if (!this.isMonitoring) return { success: true };

        await locationService.stopWatchingLocation();
        this.isMonitoring = false;

        return { success: true };
    }

    async handleLocationUpdate(location) {
        const timestamp = Date.now();
        const locationPoint = {
            ...location,
            timestamp,
        };

        // Add to history
        this.locationHistory.push(locationPoint);

        // Keep only last 24 hours of data
        const oneDayAgo = timestamp - 24 * 60 * 60 * 1000;
        this.locationHistory = this.locationHistory.filter(
            (p) => p.timestamp > oneDayAgo
        );

        // Save to storage periodically
        if (this.locationHistory.length % 10 === 0) {
            await this.saveLocationHistory();
        }

        // Analyze for anomalies
        await this.analyzeBehavior(locationPoint);

        // Update movement tracking
        if (this.lastLocation) {
            const distance = locationService.calculateDistance(
                this.lastLocation.latitude,
                this.lastLocation.longitude,
                location.latitude,
                location.longitude
            );

            if (distance > 5) {
                // User moved more than 5 meters
                this.lastMovementTime = timestamp;

                // Check if returning from a stop
                if (this.stopStartTime) {
                    const stopDuration = timestamp - this.stopStartTime;
                    await this.checkForUnexpectedStop(stopDuration);
                    this.stopStartTime = null;
                }
            } else if (!this.stopStartTime) {
                // Started a stop
                this.stopStartTime = timestamp;
            }
        }

        this.lastLocation = location;

        // Update current route
        this.currentRoute.push(locationPoint);
        if (this.currentRoute.length > 100) {
            this.currentRoute.shift();
        }
    }

    // ==================== ROUTINE LEARNING ====================

    async learnRoutine() {
        await this.initialize();

        if (this.locationHistory.length < this.settings.minLocationPoints) {
            return { success: false, message: 'Insufficient location data' };
        }

        // Analyze common routes
        this.userRoutines.commonRoutes = this.identifyCommonRoutes();

        // Analyze common locations
        this.userRoutines.commonLocations = this.identifyCommonLocations();

        // Analyze usual active hours
        this.userRoutines.activeHours = this.identifyActiveHours();

        // Analyze average speeds
        this.userRoutines.averageSpeeds = this.calculateAverageSpeeds();

        // Save routines
        await this.saveRoutines();

        return {
            success: true,
            routines: this.userRoutines,
            message: 'Routine learning completed',
        };
    }

    identifyCommonRoutes() {
        // Group locations by time of day
        const routes = {
            morning: [],
            afternoon: [],
            evening: [],
            night: [],
        };

        for (let i = 1; i < this.locationHistory.length; i++) {
            const prev = this.locationHistory[i - 1];
            const curr = this.locationHistory[i];

            const hour = new Date(curr.timestamp).getHours();
            let timeSlot;

            if (hour >= 5 && hour < 12) timeSlot = 'morning';
            else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
            else if (hour >= 17 && hour < 22) timeSlot = 'evening';
            else timeSlot = 'night';

            const distance = locationService.calculateDistance(
                prev.latitude,
                prev.longitude,
                curr.latitude,
                curr.longitude
            );

            if (distance > 10) {
                routes[timeSlot].push({
                    start: { lat: prev.latitude, lng: prev.longitude },
                    end: { lat: curr.latitude, lng: curr.longitude },
                    distance,
                });
            }
        }

        // Return simplified common routes
        return Object.entries(routes).map(([time, points]) => ({
            timeSlot: time,
            pointCount: points.length,
            totalDistance: points.reduce((sum, p) => sum + p.distance, 0),
        }));
    }

    identifyCommonLocations() {
        // Cluster nearby locations
        const clusters = [];
        const CLUSTER_RADIUS = 50; // 50 meters

        for (const point of this.locationHistory) {
            let foundCluster = false;

            for (const cluster of clusters) {
                const distance = locationService.calculateDistance(
                    point.latitude,
                    point.longitude,
                    cluster.latitude,
                    cluster.longitude
                );

                if (distance < CLUSTER_RADIUS) {
                    // Update cluster center
                    cluster.count++;
                    cluster.latitude =
                        (cluster.latitude * (cluster.count - 1) + point.latitude) /
                        cluster.count;
                    cluster.longitude =
                        (cluster.longitude * (cluster.count - 1) + point.longitude) /
                        cluster.count;

                    // Update time ranges
                    const hour = new Date(point.timestamp).getHours();
                    if (!cluster.hours.includes(hour)) {
                        cluster.hours.push(hour);
                    }

                    foundCluster = true;
                    break;
                }
            }

            if (!foundCluster) {
                clusters.push({
                    latitude: point.latitude,
                    longitude: point.longitude,
                    count: 1,
                    hours: [new Date(point.timestamp).getHours()],
                });
            }
        }

        // Return top locations
        return clusters
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((c) => ({
                latitude: c.latitude,
                longitude: c.longitude,
                visitCount: c.count,
                commonHours: c.hours,
            }));
    }

    identifyActiveHours() {
        const hourCounts = new Array(24).fill(0);

        for (const point of this.locationHistory) {
            const hour = new Date(point.timestamp).getHours();
            hourCounts[hour]++;
        }

        // Find most active hours
        const threshold = Math.max(...hourCounts) * 0.3;
        const activeHours = [];

        for (let i = 0; i < 24; i++) {
            if (hourCounts[i] > threshold) {
                activeHours.push(i);
            }
        }

        if (activeHours.length === 0) {
            return { start: 8, end: 22 }; // Default
        }

        return {
            start: Math.min(...activeHours),
            end: Math.max(...activeHours),
        };
    }

    calculateAverageSpeeds() {
        const speeds = [];

        for (let i = 1; i < this.locationHistory.length; i++) {
            const prev = this.locationHistory[i - 1];
            const curr = this.locationHistory[i];

            const distance = locationService.calculateDistance(
                prev.latitude,
                prev.longitude,
                curr.latitude,
                curr.longitude
            );

            const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds

            if (timeDiff > 0) {
                const speed = (distance / timeDiff) * 3.6; // km/h
                if (speed > 0 && speed < 100) {
                    // Reasonable speed range
                    speeds.push(speed);
                }
            }
        }

        if (speeds.length === 0) return { average: 5, min: 1, max: 15 };

        return {
            average: speeds.reduce((a, b) => a + b, 0) / speeds.length,
            min: Math.min(...speeds),
            max: Math.max(...speeds),
        };
    }

    // ==================== ANOMALY DETECTION ====================

    async analyzeBehavior(locationPoint) {
        if (!this.settings.monitoringEnabled) return;

        const anomalies = [];

        // Check for route deviation
        if (this.settings.routeDeviationEnabled) {
            const routeAnomaly = await this.checkForRouteDeviation(locationPoint);
            if (routeAnomaly) anomalies.push(routeAnomaly);
        }

        // Check for unusual inactivity
        if (this.settings.inactivityDetectionEnabled) {
            const inactivityAnomaly = await this.checkForInactivity(locationPoint);
            if (inactivityAnomaly) anomalies.push(inactivityAnomaly);
        }

        // Check for abnormal speed
        const speedAnomaly = await this.checkForAbnormalSpeed(locationPoint);
        if (speedAnomaly) anomalies.push(speedAnomaly);

        // Store anomalies
        if (anomalies.length > 0) {
            for (const anomaly of anomalies) {
                await this.recordAnomaly(anomaly);
            }
        }
    }

    async checkForUnexpectedStop(stopDuration) {
        if (!this.settings.stopDetectionEnabled) return null;

        const sensitivity = SENSITIVITY_THRESHOLDS[this.settings.sensitivity];
        const threshold =
            this.settings.stopDurationThreshold * sensitivity.stopDurationMultiplier;

        if (stopDuration > threshold) {
            // Check if at a common location
            const isAtCommonLocation = this.isAtCommonLocation(this.lastLocation);

            if (!isAtCommonLocation) {
                return {
                    type: ANOMALY_TYPES.UNEXPECTED_STOP,
                    timestamp: Date.now(),
                    location: this.lastLocation,
                    details: {
                        duration: stopDuration,
                        isAtKnownLocation: false,
                    },
                };
            }
        }

        return null;
    }

    async checkForRouteDeviation(locationPoint) {
        if (this.userRoutines.commonLocations.length === 0) return null;

        const sensitivity = SENSITIVITY_THRESHOLDS[this.settings.sensitivity];
        const threshold =
            this.settings.routeDeviationDistance * sensitivity.routeDeviationMultiplier;

        // Check distance from all common locations
        for (const routine of this.userRoutines.commonLocations) {
            const distance = locationService.calculateDistance(
                locationPoint.latitude,
                locationPoint.longitude,
                routine.latitude,
                routine.longitude
            );

            // If within routine area, not a deviation
            if (distance < 200) {
                return null;
            }
        }

        // Check if far from current route
        if (this.currentRoute.length > 2) {
            const lastRoutinePoint =
                this.currentRoute[this.currentRoute.length - 5];
            if (lastRoutinePoint) {
                const distanceFromRoute = locationService.calculateDistance(
                    locationPoint.latitude,
                    locationPoint.longitude,
                    lastRoutinePoint.latitude,
                    lastRoutinePoint.longitude
                );

                if (distanceFromRoute > threshold) {
                    return {
                        type: ANOMALY_TYPES.ROUTE_DEVIATION,
                        timestamp: Date.now(),
                        location: locationPoint,
                        details: {
                            distanceFromRoute: Math.round(distanceFromRoute),
                            deviationDirection: this.getDirection(
                                lastRoutinePoint,
                                locationPoint
                            ),
                        },
                    };
                }
            }
        }

        return null;
    }

    async checkForInactivity(locationPoint) {
        if (!this.lastMovementTime) return null;

        const sensitivity = SENSITIVITY_THRESHOLDS[this.settings.sensitivity];
        const threshold =
            this.settings.inactivityThreshold * sensitivity.inactivityMultiplier;

        const timeSinceMovement = Date.now() - this.lastMovementTime;

        // Check if during active hours
        const hour = new Date().getHours();
        const { start, end } = this.userRoutines.activeHours;

        if (hour >= start && hour <= end && timeSinceMovement > threshold) {
            // Check if at a common location (where inactivity is expected)
            const isAtCommonLocation = this.isAtCommonLocation(locationPoint);

            if (!isAtCommonLocation) {
                return {
                    type: ANOMALY_TYPES.UNUSUAL_INACTIVITY,
                    timestamp: Date.now(),
                    location: locationPoint,
                    details: {
                        inactiveDuration: timeSinceMovement,
                        isAtKnownLocation: false,
                    },
                };
            }
        }

        return null;
    }

    async checkForAbnormalSpeed(locationPoint) {
        if (this.locationHistory.length < 2) return null;

        const prev = this.locationHistory[this.locationHistory.length - 2];
        const distance = locationService.calculateDistance(
            prev.latitude,
            prev.longitude,
            locationPoint.latitude,
            locationPoint.longitude
        );

        const timeDiff =
            (locationPoint.timestamp - prev.timestamp) / 1000; // seconds
        if (timeDiff <= 0) return null;

        const speed = (distance / timeDiff) * 3.6; // km/h

        const { average, min, max } = this.userRoutines.averageSpeeds;
        const stdDev = (max - min) / 2;

        if (speed > average + stdDev * 2 || speed < Math.max(0, average - stdDev * 2)) {
            return {
                type: ANOMALY_TYPES.ABNORMAL_SPEED,
                timestamp: Date.now(),
                location: locationPoint,
                details: {
                    currentSpeed: Math.round(speed * 10) / 10,
                    averageSpeed: Math.round(average * 10) / 10,
                    isTooFast: speed > average + stdDev * 2,
                },
            };
        }

        return null;
    }

    isAtCommonLocation(location) {
        if (!location || this.userRoutines.commonLocations.length === 0) {
            return false;
        }

        for (const routine of this.userRoutines.commonLocations) {
            const distance = locationService.calculateDistance(
                location.latitude,
                location.longitude,
                routine.latitude,
                routine.longitude
            );

            if (distance < 100) {
                // Within 100m of common location
                return true;
            }
        }

        return false;
    }

    getDirection(from, to) {
        const dLon = to.longitude - from.longitude;
        const dLat = to.latitude - from.latitude;
        const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;

        if (angle >= -45 && angle < 45) return 'North';
        if (angle >= 45 && angle < 135) return 'East';
        if (angle >= -135 && angle < -45) return 'South';
        return 'West';
    }

    // ==================== ANOMALY MANAGEMENT ====================

    async recordAnomaly(anomaly) {
        const anomalyRecord = {
            id: Date.now().toString(),
            ...anomaly,
        };

        this.anomalyEvents.unshift(anomalyRecord);

        // Keep only last 100 anomalies
        if (this.anomalyEvents.length > 100) {
            this.anomalyEvents = this.anomalyEvents.slice(0, 100);
        }

        await this.saveAnomalies();

        return anomalyRecord;
    }

    async getAnomalies(limit = 20) {
        await this.initialize();
        return this.anomalyEvents.slice(0, limit);
    }

    async getAnomaliesByType(type) {
        await this.initialize();
        return this.anomalyEvents.filter((a) => a.type.id === type);
    }

    async getRecentAnomalies(hours = 24) {
        await this.initialize();
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        return this.anomalyEvents.filter((a) => a.timestamp > cutoff);
    }

    async clearAnomalies() {
        this.anomalyEvents = [];
        await this.saveAnomalies();
        return { success: true };
    }

    // ==================== BEHAVIOR SUMMARY ====================

    async getBehaviorSummary() {
        await this.initialize();

        const recentAnomalies = await this.getRecentAnomalies(24);
        const recentRouteDeviations = recentAnomalies.filter(
            (a) => a.type.id === 'route_deviation'
        );
        const recentStops = recentAnomalies.filter(
            (a) => a.type.id === 'unexpected_stop'
        );
        const recentInactivity = recentAnomalies.filter(
            (a) => a.type.id === 'unusual_inactivity'
        );

        // Calculate risk score
        let riskScore = 0;
        riskScore += recentRouteDeviations.length * 30;
        riskScore += recentStops.length * 20;
        riskScore += recentInactivity.length * 15;
        riskScore = Math.min(100, riskScore);

        return {
            isMonitoring: this.isMonitoring,
            anomalyCount: recentAnomalies.length,
            routeDeviations: recentRouteDeviations.length,
            unexpectedStops: recentStops.length,
            inactivityEvents: recentInactivity.length,
            riskScore,
            riskLevel:
                riskScore >= 70
                    ? 'high'
                    : riskScore >= 40
                        ? 'medium'
                        : 'low',
            routinesLearned: this.userRoutines.commonLocations.length > 0,
            locationHistoryPoints: this.locationHistory.length,
            lastUpdate: this.locationHistory.length > 0
                ? this.locationHistory[this.locationHistory.length - 1].timestamp
                : null,
        };
    }

    // ==================== PERSISTENCE ====================

    async saveLocationHistory() {
        try {
            await AsyncStorage.setItem(
                STORAGE_KEYS.LOCATION_HISTORY,
                JSON.stringify(this.locationHistory)
            );
        } catch (error) {
            console.error('Save location history error:', error);
        }
    }

    async saveRoutines() {
        try {
            await AsyncStorage.setItem(
                STORAGE_KEYS.USER_ROUTINES,
                JSON.stringify(this.userRoutines)
            );
        } catch (error) {
            console.error('Save routines error:', error);
        }
    }

    async saveAnomalies() {
        try {
            await AsyncStorage.setItem(
                STORAGE_KEYS.ANOMALY_EVENTS,
                JSON.stringify(this.anomalyEvents)
            );
        } catch (error) {
            console.error('Save anomalies error:', error);
        }
    }

    // ==================== UTILITY METHODS ====================

    getCurrentRoute() {
        return this.currentRoute;
    }

    getLocationHistory() {
        return this.locationHistory;
    }

    getUserRoutines() {
        return this.userRoutines;
    }

    async resetData() {
        this.locationHistory = [];
        this.userRoutines = {
            commonRoutes: [],
            commonLocations: [],
            usualStartTimes: [],
            usualEndTimes: [],
            averageSpeeds: [],
            activeHours: { start: 8, end: 22 },
        };
        this.anomalyEvents = [];
        this.currentRoute = [];
        this.lastLocation = null;
        this.lastMovementTime = null;
        this.stopStartTime = null;

        await AsyncStorage.removeItem(STORAGE_KEYS.LOCATION_HISTORY);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_ROUTINES);
        await AsyncStorage.removeItem(STORAGE_KEYS.ANOMALY_EVENTS);

        return { success: true };
    }

    // ========================
    // SENSOR INTEGRATION
    // ========================

    async startSensorMonitoring() {
        try {
            const result = await sensorService.startMonitoring({
                accelerometerInterval: 100,
                gyroscopeInterval: 100
            });

            if (result.success) {
                // Register fall detection callback
                sensorService.onFallDetected((alert) => {
                    this.handleFallDetection(alert);
                });
            }

            return result;
        } catch (error) {
            console.error('Start sensor monitoring error:', error);
            return { success: false, error: error.message };
        }
    }

    async stopSensorMonitoring() {
        return await sensorService.stopMonitoring();
    }

    handleFallDetection(alert) {
        console.log('Fall detected:', alert);

        // Create anomaly record
        const anomaly = {
            type: {
                id: 'fall_detected',
                label: 'Fall Detected',
                description: 'Fall detected via motion sensors',
                severity: 'critical',
                icon: 'alert-circle',
                color: '#DC2626'
            },
            timestamp: Date.now(),
            location: this.lastLocation,
            details: {
                sensorData: alert.sensorData
            }
        };

        // Record and alert
        this.recordAnomaly(anomaly);

        // Trigger alert
        alertService.triggerAlert({
            ...anomaly,
            severity: 'critical'
        });
    }

    getSensorData() {
        return sensorService.getAllSensorData();
    }

    // ========================
    // BACKEND API INTEGRATION
    // ========================

    async syncWithBackend() {
        try {
            // Sync location to backend for analysis
            if (this.lastLocation) {
                const result = await behaviorApiService.analyzeLocation(
                    this.lastLocation,
                    {
                        activityType: sensorService.getCurrentActivity()
                    }
                );

                // Handle any backend-detected anomalies
                if (result.success && result.data.anomalyDetected) {
                    console.log('Backend detected anomaly:', result.data.anomaly);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Backend sync error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================
    // FEEDBACK SUBMISSION
    // ========================

    async submitAnomalyFeedback(anomalyId, feedbackType, notes) {
        try {
            const result = await behaviorApiService.submitFeedback(
                anomalyId,
                feedbackType,
                notes
            );

            // Update local cache
            if (result.success) {
                const anomalyIndex = this.anomalyEvents.findIndex(a => a.id === anomalyId);
                if (anomalyIndex !== -1) {
                    this.anomalyEvents[anomalyIndex].userFeedback = feedbackType;
                    this.anomalyEvents[anomalyIndex].feedbackNotes = notes;
                    await this.saveAnomalies();
                }
            }

            return result;
        } catch (error) {
            console.error('Submit feedback error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================
    // ALERT MANAGEMENT
    // ========================

    async acknowledgeAlert(alertId) {
        return await alertService.acknowledgeAlert(alertId);
    }

    async getAlertHistory(params) {
        return await alertService.getAlerts(params);
    }
}

export default new BehaviorAnalysisService();
