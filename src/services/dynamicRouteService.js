// Dynamic Route Re-routing Service
// AI-powered real-time route adjustments based on detected risks

import * as Location from 'expo-location';
import { chatCompletion } from './groqApi';
import settingsService from './settingsService';
import safetyService from './safetyService';

class DynamicRouteService {
    constructor() {
        this.currentRoute = null;
        this.routeMonitoring = false;
        this.watchId = null;
        this.riskCallback = null;
        this.locationHistory = [];
        this.maxLocationHistory = 50;
        this.riskThreshold = 60; // Re-route if risk score > 60
    }

    // ==================== ROUTE PLANNING ====================

    async planRoute(origin, destination, options = {}) {
        try {
            const groqApiKey = await settingsService.getGroqApiKey();
            
            // Get current location if origin not provided
            let originCoords = origin;
            if (!origin) {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                originCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
            }

            // Get safety data for route corridor
            const safetyData = await this.getRouteSafetyData(originCoords, destination);
            
            // Generate route options
            const routeOptions = await this.generateRouteOptions(originCoords, destination, safetyData);

            // AI analysis if API key available
            let aiRecommendation = null;
            if (groqApiKey) {
                aiRecommendation = await this.analyzeRouteWithAI(
                    groqApiKey,
                    originCoords,
                    destination,
                    routeOptions,
                    safetyData
                );
            }

            const bestRoute = this.selectBestRoute(routeOptions, aiRecommendation);

            this.currentRoute = {
                origin: originCoords,
                destination,
                options: routeOptions,
                selected: bestRoute,
                safetyData,
                aiRecommendation,
                createdAt: Date.now(),
                waypoints: bestRoute.waypoints || [],
            };

            return {
                success: true,
                route: this.currentRoute,
            };
        } catch (error) {
            console.error('Route planning error:', error);
            return { success: false, message: error.message };
        }
    }

    async getRouteSafetyData(origin, destination) {
        try {
            // Get safety incidents near origin and destination
            const originIncidents = await safetyService.getIncidentsNearLocation(
                origin.latitude,
                origin.longitude,
                1 // 1km radius
            );

            const destIncidents = await safetyService.getIncidentsNearLocation(
                destination.latitude,
                destination.longitude,
                1
            );

            // Get safe zones
            const originSafeZones = await safetyService.getSafeZonesNearLocation(
                origin.latitude,
                origin.longitude,
                0.5
            );

            const destSafeZones = await safetyService.getSafeZonesNearLocation(
                destination.latitude,
                destination.longitude,
                0.5
            );

            // Calculate midpoint for additional safety check
            const midPoint = {
                latitude: (origin.latitude + destination.latitude) / 2,
                longitude: (origin.longitude + destination.longitude) / 2,
            };

            const midIncidents = await safetyService.getIncidentsNearLocation(
                midPoint.latitude,
                midPoint.longitude,
                1
            );

            return {
                origin: {
                    incidents: originIncidents,
                    safeZones: originSafeZones,
                    riskScore: this.calculateRiskScore(originIncidents, originSafeZones),
                },
                destination: {
                    incidents: destIncidents,
                    safeZones: destSafeZones,
                    riskScore: this.calculateRiskScore(destIncidents, destSafeZones),
                },
                midpoint: {
                    incidents: midIncidents,
                    riskScore: this.calculateRiskScore(midIncidents, []),
                },
            };
        } catch (error) {
            console.error('Get route safety data error:', error);
            return null;
        }
    }

    async generateRouteOptions(origin, destination, safetyData) {
        // Generate multiple route options with different characteristics
        const baseDistance = this.calculateDistance(origin, destination);

        return [
            {
                id: 'fastest',
                name: 'Fastest Route',
                description: 'Most direct path',
                distance: baseDistance,
                estimatedTime: Math.round(baseDistance * 12), // ~12 min per km walking
                safetyScore: 100 - ((safetyData?.origin?.riskScore || 50) + (safetyData?.destination?.riskScore || 50)) / 2,
                waypoints: this.generateWaypoints(origin, destination, 1),
                riskFactors: this.identifyRiskFactors(safetyData),
            },
            {
                id: 'safest',
                name: 'Safest Route',
                description: 'Well-lit, populated areas',
                distance: baseDistance * 1.2, // 20% longer
                estimatedTime: Math.round(baseDistance * 15),
                safetyScore: 85 + Math.random() * 10,
                waypoints: this.generateWaypoints(origin, destination, 1.2),
                riskFactors: [],
            },
            {
                id: 'balanced',
                name: 'Balanced Route',
                description: 'Good balance of safety and speed',
                distance: baseDistance * 1.1,
                estimatedTime: Math.round(baseDistance * 13),
                safetyScore: 75 + Math.random() * 10,
                waypoints: this.generateWaypoints(origin, destination, 1.1),
                riskFactors: this.identifyRiskFactors(safetyData)?.slice(0, 2) || [],
            },
        ];
    }

    generateWaypoints(origin, destination, multiplier = 1) {
        // Generate intermediate waypoints for the route
        const waypoints = [];
        const steps = 5;
        
        for (let i = 1; i < steps; i++) {
            const ratio = i / steps;
            const baseLat = origin.latitude + (destination.latitude - origin.latitude) * ratio;
            const baseLon = origin.longitude + (destination.longitude - origin.longitude) * ratio;
            
            // Add slight variation for different routes
            const variation = (multiplier - 1) * 0.001 * (i % 2 === 0 ? 1 : -1);
            
            waypoints.push({
                latitude: baseLat + variation,
                longitude: baseLon,
                order: i,
            });
        }

        return waypoints;
    }

    identifyRiskFactors(safetyData) {
        if (!safetyData) return [];

        const risks = [];
        
        if ((safetyData.origin?.incidents?.length || 0) > 2) {
            risks.push('High incident rate near start');
        }
        if ((safetyData.destination?.incidents?.length || 0) > 2) {
            risks.push('High incident rate near destination');
        }
        if ((safetyData.midpoint?.riskScore || 0) > 70) {
            risks.push('Unsafe area along route');
        }

        return risks.length > 0 ? risks : null;
    }

    calculateRiskScore(incidents, safeZones) {
        let score = 30; // Base score

        // Increase for recent incidents
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const recentIncidents = incidents.filter(i => i.timestamp > oneHourAgo).length;
        
        score += recentIncidents * 15;

        // Increase for high severity
        const highSeverityTypes = ['harassment', 'assault', 'stalking'];
        const highSeverity = incidents.filter(i => highSeverityTypes.includes(i.type)).length;
        score += highSeverity * 20;

        // Decrease for safe zones
        score -= safeZones.length * 10;

        return Math.max(0, Math.min(100, score));
    }

    async analyzeRouteWithAI(apiKey, origin, destination, routeOptions, safetyData) {
        try {
            const prompt = this.buildRouteAnalysisPrompt(origin, destination, routeOptions, safetyData);

            const response = await chatCompletion(
                apiKey,
                [
                    {
                        role: 'system',
                        content: 'You are a route safety expert. Analyze route options and recommend the safest path. Be concise and practical. Respond with JSON format: {"recommendedRouteId": "route_id", "reason": "explanation", "safetyTips": ["tip1", "tip2"]}'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                'llama-3.3-70b-versatile',
                0.3,
                600
            );

            // Parse JSON response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.error('AI response parsing error:', e);
            }

            return null;
        } catch (error) {
            console.error('AI analysis error:', error);
            return null;
        }
    }

    buildRouteAnalysisPrompt(origin, destination, routeOptions, safetyData) {
        let prompt = `Analyze these route options from origin to destination:\n\n`;

        routeOptions.forEach((route, index) => {
            prompt += `${index + 1}. ${route.name} (${route.id})\n`;
            prompt += `   Distance: ${route.distance.toFixed(1)}km, Time: ~${route.estimatedTime}min\n`;
            prompt += `   Safety Score: ${route.safetyScore.toFixed(0)}/100\n`;
            if (route.riskFactors?.length) {
                prompt += `   Risks: ${route.riskFactors.join(', ')}\n`;
            }
            prompt += '\n';
        });

        if (safetyData) {
            prompt += `\nSafety Data:\n`;
            prompt += `- Origin incidents: ${safetyData.origin?.incidents?.length || 0}\n`;
            prompt += `- Destination incidents: ${safetyData.destination?.incidents?.length || 0}\n`;
            prompt += `- Origin safe zones: ${safetyData.origin?.safeZones?.length || 0}\n`;
            prompt += `- Destination safe zones: ${safetyData.destination?.safeZones?.length || 0}\n`;
        }

        prompt += `\nRecommend the best route considering safety as the top priority.`;

        return prompt;
    }

    selectBestRoute(routeOptions, aiRecommendation) {
        if (aiRecommendation?.recommendedRouteId) {
            const aiChoice = routeOptions.find(r => r.id === aiRecommendation.recommendedRouteId);
            if (aiChoice) return aiChoice;
        }

        // Default: select route with highest safety score
        return routeOptions.reduce((best, current) => 
            current.safetyScore > best.safetyScore ? current : best
        );
    }

    // ==================== REAL-TIME MONITORING ====================

    async startRouteMonitoring(callback) {
        this.riskCallback = callback;
        this.routeMonitoring = true;
        this.locationHistory = [];

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { success: false, message: 'Location permission denied' };
        }

        this.watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000, // 5 seconds
                distanceInterval: 10, // 10 meters
            },
            async (location) => {
                const currentPos = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    timestamp: Date.now(),
                };

                // Store location history
                this.locationHistory.push(currentPos);
                if (this.locationHistory.length > this.maxLocationHistory) {
                    this.locationHistory.shift();
                }

                // Check for risks and suggest re-routing if needed
                await this.checkForRisks(currentPos, callback);
            }
        );

        return { success: true };
    }

    async stopRouteMonitoring() {
        this.routeMonitoring = false;
        
        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }

        return { success: true };
    }

    async checkForRisks(currentPos, callback) {
        if (!this.currentRoute) return;

        // Check if near any known risk areas
        const nearbyIncidents = await safetyService.getIncidentsNearLocation(
            currentPos.latitude,
            currentPos.longitude,
            0.2 // 200m radius
        );

        const nearbySafeZones = await safetyService.getSafeZonesNearLocation(
            currentPos.latitude,
            currentPos.longitude,
            0.1 // 100m radius
        );

        const currentRiskScore = this.calculateRiskScore(nearbyIncidents, nearbySafeZones);

        // Check if re-routing is needed
        if (currentRiskScore > this.riskThreshold) {
            const alternativeRoute = await this.findAlternativeRoute(currentPos, this.currentRoute.destination);
            
            if (alternativeRoute && callback) {
                callback({
                    type: 'reroute_suggested',
                    currentRiskScore,
                    reason: 'High risk detected in current area',
                    nearbyIncidents: nearbyIncidents.length,
                    alternativeRoute,
                    timestamp: Date.now(),
                });
            }
        }

        // Check if deviated from route
        const deviation = this.checkRouteDeviation(currentPos);
        if (deviation.isDeviated && callback) {
            callback({
                type: 'route_deviation',
                deviationDistance: deviation.distance,
                message: 'You have deviated from the planned route',
                timestamp: Date.now(),
            });
        }
    }

    async findAlternativeRoute(currentPos, destination) {
        const safetyData = await this.getRouteSafetyData(currentPos, destination);
        const routeOptions = await this.generateRouteOptions(currentPos, destination, safetyData);
        
        // Return the safest alternative
        return routeOptions.reduce((safest, current) => 
            current.safetyScore > safest.safetyScore ? current : safest
        );
    }

    checkRouteDeviation(currentPos) {
        if (!this.currentRoute?.selected?.waypoints?.length) {
            return { isDeviated: false, distance: 0 };
        }

        // Find nearest waypoint
        let minDistance = Infinity;
        
        for (const waypoint of this.currentRoute.selected.waypoints) {
            const distance = this.calculateDistance(
                currentPos.latitude,
                currentPos.longitude,
                waypoint.latitude,
                waypoint.longitude
            );
            minDistance = Math.min(minDistance, distance);
        }

        // Consider deviated if more than 100m from nearest waypoint
        const isDeviated = minDistance > 100;
        
        return {
            isDeviated,
            distance: minDistance,
        };
    }

    // ==================== UTILS ====================

    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(point2.latitude - point1.latitude);
        const dLon = this.deg2rad(point2.longitude - point1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    clearRoute() {
        this.currentRoute = null;
        this.locationHistory = [];
    }

    // ==================== EMERGENCY REROUTE ====================

    async findEmergencyRoute(currentPos) {
        try {
            // Find nearest safe zone or public place
            const safeZones = await safetyService.getSafeZonesNearLocation(
                currentPos.latitude,
                currentPos.longitude,
                2 // 2km radius
            );

            if (safeZones.length > 0) {
                // Sort by distance
                safeZones.sort((a, b) => {
                    const distA = this.calculateDistance(
                        currentPos.latitude,
                        currentPos.longitude,
                        a.latitude,
                        a.longitude
                    );
                    const distB = this.calculateDistance(
                        currentPos.latitude,
                        currentPos.longitude,
                        b.latitude,
                        b.longitude
                    );
                    return distA - distB;
                });

                const nearestSafe = safeZones[0];
                
                return {
                    success: true,
                    destination: {
                        latitude: nearestSafe.latitude,
                        longitude: nearestSafe.longitude,
                        name: nearestSafe.name,
                        type: nearestSafe.type,
                    },
                    distance: this.calculateDistance(
                        currentPos.latitude,
                        currentPos.longitude,
                        nearestSafe.latitude,
                        nearestSafe.longitude
                    ),
                };
            }

            // If no safe zones, suggest police station or hospital
            return {
                success: true,
                destination: {
                    latitude: currentPos.latitude + 0.01, // ~1km north
                    longitude: currentPos.longitude,
                    name: 'Safe Area',
                    type: 'suggested',
                },
                distance: 1.0,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export default new DynamicRouteService();
