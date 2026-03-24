// Safety Service
// Manages community safety data including incident reports and safe/unsafe zones

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    INCIDENTS: '@safety_incidents',
    SAFE_ZONES: '@safety_safe_zones',
    USER_REPORTS: '@safety_user_reports',
};

// Incident types with severity levels
export const INCIDENT_TYPES = {
    HARASSMENT: { id: 'harassment', label: 'Harassment', icon: 'alert-circle', color: '#EF4444', severity: 'high' },
    SUSPICIOUS_ACTIVITY: { id: 'suspicious', label: 'Suspicious Activity', icon: 'eye', color: '#F59E0B', severity: 'medium' },
    ASSAULT: { id: 'assault', label: 'Assault', icon: 'warning', color: '#DC2626', severity: 'high' },
    THEFT: { id: 'theft', label: 'Theft', icon: 'bag', color: '#8B5CF6', severity: 'medium' },
    STALKING: { id: 'stalking', label: 'Stalking', icon: 'person-add', color: '#EC4899', severity: 'high' },
    VERBAL_ABUSE: { id: 'verbal_abuse', label: 'Verbal Abuse', icon: 'chatbubbles', color: '#F97316', severity: 'medium' },
    UNSAFE_AREA: { id: 'unsafe_area', label: 'Unsafe Area', icon: 'location', color: '#EF4444', severity: 'medium' },
    POOR_LIGHTING: { id: 'poor_lighting', label: 'Poor Lighting', icon: 'sunny', color: '#6B7280', severity: 'low' },
    CROWDED: { id: 'crowded', label: 'Overcrowded', icon: 'people', color: '#F59E0B', severity: 'low' },
    SAFE: { id: 'safe', label: 'Safe Zone', icon: 'checkmark-circle', color: '#10B981', severity: 'none' },
};

// Default mock data for demonstration
const DEFAULT_INCIDENTS = [
    {
        id: '1',
        type: 'harassment',
        title: 'Harassment reported',
        description: 'Verbal harassment reported in this area',
        latitude: 28.6139,
        longitude: 77.209,
        timestamp: Date.now() - 10 * 60 * 1000,
        userId: 'anonymous',
        verified: true,
    },
    {
        id: '2',
        type: 'safe',
        title: 'Safe zone confirmed',
        description: 'Well-lit area with police patrol',
        latitude: 28.6145,
        longitude: 77.2095,
        timestamp: Date.now() - 30 * 60 * 1000,
        userId: 'anonymous',
        verified: true,
    },
    {
        id: '3',
        type: 'suspicious',
        title: 'Suspicious activity',
        description: 'Unknown person following pedestrians',
        latitude: 28.6125,
        longitude: 77.2085,
        timestamp: Date.now() - 45 * 60 * 1000,
        userId: 'anonymous',
        verified: false,
    },
];

const DEFAULT_SAFE_ZONES = [
    {
        id: '1',
        name: 'Police Station',
        description: 'Nearby police station with 24/7 security',
        latitude: 28.615,
        longitude: 77.21,
        rating: 5,
        type: 'emergency',
    },
    {
        id: '2',
        name: 'Well-lit Plaza',
        description: 'Commercial area with good lighting and crowd',
        latitude: 28.614,
        longitude: 77.208,
        rating: 4,
        type: 'public',
    },
    {
        id: '3',
        name: 'Hospital',
        description: '24/7 medical facility nearby',
        latitude: 28.6135,
        longitude: 77.2095,
        rating: 5,
        type: 'medical',
    },
];

class SafetyService {
    constructor() {
        this.incidents = [];
        this.safeZones = [];
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const incidentsData = await AsyncStorage.getItem(STORAGE_KEYS.INCIDENTS);
            if (incidentsData) {
                this.incidents = JSON.parse(incidentsData);
            } else {
                this.incidents = DEFAULT_INCIDENTS;
                await this.saveIncidents();
            }

            const zonesData = await AsyncStorage.getItem(STORAGE_KEYS.SAFE_ZONES);
            if (zonesData) {
                this.safeZones = JSON.parse(zonesData);
            } else {
                this.safeZones = DEFAULT_SAFE_ZONES;
                await this.saveSafeZones();
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Safety service init error:', error);
            this.incidents = DEFAULT_INCIDENTS;
            this.safeZones = DEFAULT_SAFE_ZONES;
            this.isInitialized = true;
        }
    }

    async saveIncidents() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(this.incidents));
        } catch (error) {
            console.error('Save incidents error:', error);
        }
    }

    async saveSafeZones() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SAFE_ZONES, JSON.stringify(this.safeZones));
        } catch (error) {
            console.error('Save safe zones error:', error);
        }
    }

    async getIncidents() {
        await this.initialize();
        return this.incidents;
    }

    async getIncidentsNearLocation(latitude, longitude, radiusKm = 2) {
        await this.initialize();

        return this.incidents.filter(incident => {
            const distance = this.calculateDistance(
                latitude, longitude,
                incident.latitude, incident.longitude
            );
            return distance <= radiusKm;
        });
    }

    async getSafeZones() {
        await this.initialize();
        return this.safeZones;
    }

    async getSafeZonesNearLocation(latitude, longitude, radiusKm = 5) {
        await this.initialize();

        return this.safeZones.filter(zone => {
            const distance = this.calculateDistance(
                latitude, longitude,
                zone.latitude, zone.longitude
            );
            return distance <= radiusKm;
        });
    }

    async reportIncident(incidentData) {
        await this.initialize();

        const newIncident = {
            id: Date.now().toString(),
            ...incidentData,
            timestamp: Date.now(),
            userId: 'current_user',
            verified: false,
        };

        this.incidents.unshift(newIncident);
        await this.saveIncidents();

        return newIncident;
    }

    async addSafeZone(zoneData) {
        await this.initialize();

        const newZone = {
            id: Date.now().toString(),
            ...zoneData,
            rating: zoneData.rating || 3,
            timestamp: Date.now(),
        };

        this.safeZones.push(newZone);
        await this.saveSafeZones();

        return newZone;
    }

    async rateZone(zoneId, rating) {
        await this.initialize();

        const zone = this.safeZones.find(z => z.id === zoneId);
        if (zone) {
            const currentRating = zone.rating || rating;
            const count = zone.ratingCount || 1;
            zone.rating = ((currentRating * count) + rating) / (count + 1);
            zone.ratingCount = count + 1;
            await this.saveSafeZones();
        }

        return zone;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    async getAreaSafetyStats(latitude, longitude, radiusKm = 2) {
        await this.initialize();

        const incidents = await this.getIncidentsNearLocation(latitude, longitude, radiusKm);

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const recentIncidents = incidents.filter(i => i.timestamp > oneHourAgo);
        const todayIncidents = incidents.filter(i => i.timestamp > twentyFourHoursAgo);

        const highSeverity = incidents.filter(i =>
            INCIDENT_TYPES[i.type.toUpperCase()]?.severity === 'high'
        ).length;

        const safeZones = await this.getSafeZonesNearLocation(latitude, longitude, radiusKm);

        // Calculate overall safety score (0-100)
        let safetyScore = 100;
        safetyScore -= recentIncidents.length * 15;
        safetyScore -= todayIncidents.length * 5;
        safetyScore -= highSeverity * 10;
        safetyScore += safeZones.length * 5;
        safetyScore = Math.max(0, Math.min(100, safetyScore));

        return {
            totalIncidents: incidents.length,
            recentIncidents: recentIncidents.length,
            todayIncidents: todayIncidents.length,
            highSeverityCount: highSeverity,
            safeZonesCount: safeZones.length,
            safetyScore,
            level: safetyScore >= 70 ? 'safe' : safetyScore >= 40 ? 'caution' : 'danger',
        };
    }
}

export default new SafetyService();
