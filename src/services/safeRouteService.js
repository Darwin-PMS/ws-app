import { mobileApi } from './api/mobileApi';

class SafeRouteService {
    async analyzeRoute(origin, destination, mode = 'walking') {
        try {
            const response = await mobileApi.post('/mobile/safe-route/analyze', {
                originLat: origin.latitude,
                originLng: origin.longitude,
                originName: origin.name,
                destLat: destination.latitude,
                destLng: destination.longitude,
                destName: destination.name,
                mode
            });

            if (response.success) {
                return {
                    success: true,
                    ...response.data
                };
            }

            return {
                success: false,
                error: response.message || 'Failed to analyze route'
            };
        } catch (error) {
            console.error('Route analysis error:', error);
            return {
                success: false,
                error: error.message || 'Failed to analyze route'
            };
        }
    }

    async getRouteHistory(params = {}) {
        try {
            const response = await mobileApi.get('/mobile/safe-route/history', { params });
            return response;
        } catch (error) {
            console.error('Get route history error:', error);
            throw error;
        }
    }

    async saveRouteAnalysis(routeData) {
        try {
            const response = await mobileApi.post('/mobile/safe-route/save', routeData);
            return response;
        } catch (error) {
            console.error('Save route error:', error);
            throw error;
        }
    }

    async getMyRoutes(limit = 50) {
        try {
            const response = await mobileApi.get('/mobile/safe-route/my-routes', { 
                params: { limit } 
            });
            return response;
        } catch (error) {
            console.error('Get routes error:', error);
            throw error;
        }
    }

    async getRouteStats() {
        try {
            const response = await mobileApi.get('/mobile/safe-route/stats');
            if (response.success) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Get stats error:', error);
            return null;
        }
    }

    async getIncidentHotspots(lat, lng, radius = 0.05) {
        try {
            const response = await mobileApi.get('/mobile/safe-route/hotspots', {
                params: { lat, lng, radius }
            });
            if (response.success) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Get hotspots error:', error);
            return [];
        }
    }

    async getAlternativeRoutes(origin, destination) {
        const baseRoute = {
            origin,
            destination,
            distance: this.calculateDistance(origin, destination),
        };

        return [
            {
                ...baseRoute,
                id: '1',
                name: 'Main Route',
                safetyScore: 70,
                estimatedTime: Math.round(this.calculateDistance(origin, destination) / 5 * 60),
                description: 'Most direct route',
            },
            {
                ...baseRoute,
                id: '2',
                name: 'Via Main Road',
                safetyScore: 85,
                estimatedTime: Math.round(this.calculateDistance(origin, destination) / 4 * 60),
                description: 'Better lit, more populated',
            },
            {
                ...baseRoute,
                id: '3',
                name: 'Via Safe Zone',
                safetyScore: 90,
                estimatedTime: Math.round(this.calculateDistance(origin, destination) / 3.5 * 60),
                description: 'Passes by safe zones',
            },
        ];
    }

    calculateDistance(point1, point2) {
        const R = 6371;
        const dLat = this.deg2rad(point2.latitude - point1.latitude);
        const dLon = this.deg2rad(point2.longitude - point1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

export default new SafeRouteService();
