import { API_CONFIG } from './api/endpoints';
import databaseService from './databaseService';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/mobile`;

class LiveStreamService {
    async startSession(userId, userName, contactIds, location) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${databaseService.token}`,
                },
                body: JSON.stringify({
                    userId,
                    userName,
                    contactIds,
                    location
                }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    }

    async getSession(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/session/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${databaseService.token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    }

    async updateStream(sessionId, streamType, isActive) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/session/${sessionId}/stream`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${databaseService.token}`,
                },
                body: JSON.stringify({ streamType, isActive }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating stream:', error);
            throw error;
        }
    }

    async updateLocation(sessionId, latitude, longitude) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/session/${sessionId}/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${databaseService.token}`,
                },
                body: JSON.stringify({ latitude, longitude }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    }

    async stopSession(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/session/${sessionId}/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${databaseService.token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error stopping session:', error);
            throw error;
        }
    }

    async getActiveSessions(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/active/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${databaseService.token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting active sessions:', error);
            throw error;
        }
    }

    async getSessionHistory(userId, limit = 20, offset = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/history/${userId}?limit=${limit}&offset=${offset}`, {
                headers: {
                    'Authorization': `Bearer ${databaseService.token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting session history:', error);
            throw error;
        }
    }

    async addViewer(sessionId, viewerId, viewerName, viewerPhone) {
        try {
            const response = await fetch(`${API_BASE_URL}/live-stream/session/${sessionId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${databaseService.token}`,
                },
                body: JSON.stringify({ viewerId, viewerName, viewerPhone }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding viewer:', error);
            throw error;
        }
    }
}

export default new LiveStreamService();
