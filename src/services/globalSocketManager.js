import { API_CONFIG } from './api/endpoints';
import databaseService from './databaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = API_CONFIG.BASE_URL.replace('/api', '').replace('http', 'ws');

const WebSocket = global.WebSocket || global.nativeWebSocket;

class GlobalSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.listeners = new Map();
        this.messageQueue = [];
        this.pingInterval = null;
        this.token = null;
        this.shouldReconnect = true;
        this.isInitialized = false;
        this.connectionCheckInterval = null;
    }

    initialize(token) {
        if (this.isInitialized) {
            console.log('[GlobalSocket] Already initialized');
            return;
        }
        
        this.token = token;
        this.isInitialized = true;
        this.connect();
        
        this.connectionCheckInterval = setInterval(() => {
            if (!this.isConnected && this.shouldReconnect && this.token) {
                console.log('[GlobalSocket] Connection lost, reconnecting...');
                this.connect();
            }
        }, 10000);
    }

    connect() {
        if (this.ws && this.isConnected) {
            return;
        }

        const wsUrl = `${WS_URL}/ws?token=${this.token}`;
        console.log('[GlobalSocket] Connecting to:', wsUrl);

        try {
            if (!WebSocket) {
                console.warn('[GlobalSocket] WebSocket not available');
                return;
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[GlobalSocket] Connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startPing();
                this.flushMessageQueue();
                this.emit('connected', { status: 'connected' });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    console.log('[GlobalSocket] Received:', message.type);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[GlobalSocket] Parse error:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[GlobalSocket] Disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.stopPing();
                this.emit('disconnected', { code: event.code, reason: event.reason });
                
                if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[GlobalSocket] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => this.connect(), this.reconnectDelay);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[GlobalSocket] Error:', error);
                this.emit('error', { error });
            };
        } catch (error) {
            console.error('[GlobalSocket] Connection error:', error);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.listeners.clear();
        this.messageQueue = [];
    }

    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping');
            }
        }, 25000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    handleMessage(message) {
        const { type, payload } = message;
        
        console.log('[GlobalSocket] Event:', type);
        this.emit(type, payload);
        this.emit('any', message);

        if (type === 'live_share_request') {
            this.emit('liveShareRequest', payload);
            this.emit('globalLiveShareRequest', payload);
        } else if (type === 'live_share_location_update') {
            this.emit('liveShareLocationUpdate', payload);
        } else if (type === 'live_share_ended') {
            this.emit('liveShareEnded', payload);
        } else if (type === 'live_share_started') {
            this.emit('liveShareStarted', payload);
        } else if (type === 'live_share_accept_confirmed') {
            this.emit('liveShareAcceptConfirmed', payload);
        } else if (type === 'live_share_accept') {
            this.emit('liveShareAccept', payload);
        } else if (type === 'live_share_decline') {
            this.emit('liveShareDecline', payload);
        } else if (type === 'live_share_viewer_joined') {
            this.emit('liveShareViewerJoined', payload);
        } else if (type === 'sos_alert') {
            this.emit('sosAlert', payload);
        } else if (type === 'sos_confirmed') {
            this.emit('sosConfirmed', payload);
        }
    }

    send(type, payload = {}) {
        const message = JSON.stringify({ type, payload });
        
        if (this.ws && this.isConnected) {
            try {
                this.ws.send(message);
            } catch (error) {
                console.error('[GlobalSocket] Send error:', error);
                this.messageQueue.push(message);
            }
        } else {
            console.log('[GlobalSocket] Not connected, queuing message');
            this.messageQueue.push(message);
        }
    }

    flushMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            try {
                this.ws.send(message);
            } catch (e) {
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[GlobalSocket] Event error (${event}):`, error);
                }
            });
        }
    }

    startLiveShare(sessionId, sharerId, sharerName, recipients, location, message) {
        this.send('live_share_start', {
            sessionId,
            sharerId,
            sharerName,
            recipients,
            latitude: location?.latitude,
            longitude: location?.longitude,
            message
        });
    }

    acceptLiveShare(sessionId) {
        this.send('live_share_accept', {
            sessionId,
            userId: databaseService.userId,
            userName: databaseService.userName || 'User'
        });
    }

    declineLiveShare(sessionId, reason = '') {
        this.send('live_share_decline', {
            sessionId,
            userId: databaseService.userId,
            userName: databaseService.userName || 'User',
            reason
        });
    }

    sendLiveShareLocation(sessionId, latitude, longitude, accuracy, speed) {
        this.send('live_share_location', {
            sessionId,
            latitude,
            longitude,
            accuracy,
            speed
        });
    }

    stopLiveShare(sessionId) {
        this.send('live_share_stop', { sessionId });
    }
}

export default new GlobalSocketManager();
