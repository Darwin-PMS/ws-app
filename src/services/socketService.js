import { API_CONFIG } from './api/endpoints';
import databaseService from './databaseService';

const WS_URL = API_CONFIG.BASE_URL.replace('/api', '').replace('http', 'ws');

const WebSocket = global.WebSocket || global.nativeWebSocket;

class SocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.subscriptions = new Set();
        this.messageQueue = [];
        this.pingInterval = null;
        this.reconnectToken = null;
        this.shouldReconnect = true;
        this.connectionPermanentlyFailed = false;
    }

    connect(token) {
        return new Promise((resolve, reject) => {
            if (this.ws && this.isConnected) {
                console.log('Socket already connected');
                resolve();
                return;
            }
            
            if (this.connectionPermanentlyFailed && !this.shouldReconnect) {
                console.log('Connection previously failed permanently, call enableAutoReconnect() to reset');
                resolve();
                return;
            }

            this.reconnectToken = token;
            const wsUrl = `${WS_URL}/ws?token=${token}`;
            console.log('Connecting to WebSocket:', wsUrl);

            try {
                if (!WebSocket) {
                    console.warn('WebSocket not available');
                    resolve();
                    return;
                }

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startPing();
                    this.flushMessageQueue();
                    this.emit('connected', { status: 'connected' });
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        console.log('WebSocket message received:', message.type);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopPing();
                    this.emit('disconnected', { code: event.code, reason: event.reason });
                    
                    const shouldNotReconnect = event.code >= 4000 && event.code < 5000;
                    if (shouldNotReconnect) {
                        console.log('WebSocket closed with client error code, not reconnecting');
                        this.connectionPermanentlyFailed = true;
                        this.shouldReconnect = false;
                        this.emit('reconnect_failed', { reason: 'Connection rejected by server' });
                        return;
                    }
                    
                    if (this.shouldReconnect && this.reconnectToken && !this.connectionPermanentlyFailed) {
                        this.attemptReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.emit('error', { error });
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                resolve();
            }
        });
    }

    attemptReconnect() {
        if (this.connectionPermanentlyFailed) {
            console.log('Connection permanently failed, not attempting reconnect');
            return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.shouldReconnect) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                if (this.reconnectToken && this.shouldReconnect && !this.connectionPermanentlyFailed) {
                    this.connect(this.reconnectToken);
                }
            }, this.reconnectDelay);
        } else {
            console.log('Max reconnection attempts reached, stopping auto-reconnect');
            this.shouldReconnect = false;
            this.connectionPermanentlyFailed = true;
            this.emit('reconnect_failed', { reason: 'Max attempts reached' });
        }
    }

    disconnect() {
        this.stopPing();
        this.shouldReconnect = false;
        this.connectionPermanentlyFailed = false;
        this.reconnectAttempts = 0;
        this.reconnectToken = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.listeners.clear();
        this.subscriptions.clear();
        this.messageQueue = [];
    }
    
    enableAutoReconnect() {
        this.shouldReconnect = true;
        this.connectionPermanentlyFailed = false;
        this.reconnectAttempts = 0;
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
        
        console.log('═══════════════════════════════════════');
        console.log('SOCKET RECEIVED:', type);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('═══════════════════════════════════════');
        
        this.emit(type, payload);

        if (type === 'live_share_request') {
            console.log('>>> Emitting liveShareRequest event');
            this.emit('liveShareRequest', payload);
        } else if (type === 'live_share_location_update') {
            this.emit('liveShareLocationUpdate', payload);
        } else if (type === 'live_share_ended') {
            this.emit('liveShareEnded', payload);
        } else if (type === 'live_share_started') {
            this.emit('liveShareStarted', payload);
        } else if (type === 'live_share_accept_confirmed') {
            this.emit('liveShareAcceptConfirmed', payload);
        } else if (type === 'live_share_accept') {
            console.log('>>> Emitting liveShareAccept event');
            this.emit('liveShareAccept', payload);
        } else if (type === 'live_share_decline') {
            this.emit('liveShareDecline', payload);
        } else if (type === 'live_share_viewer_joined') {
            this.emit('liveShareViewerJoined', payload);
        }
    }

    send(type, payload = {}) {
        const message = JSON.stringify({ type, payload });
        
        if (this.ws && this.isConnected) {
            try {
                this.ws.send(message);
            } catch (error) {
                console.error('Error sending message:', error);
                this.messageQueue.push(message);
            }
        } else {
            console.log('Socket not connected, queuing message');
            this.messageQueue.push(message);
        }
    }

    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.ws && this.isConnected) {
                try {
                    this.ws.send(message);
                } catch (e) {
                    this.messageQueue.unshift(message);
                    break;
                }
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
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    subscribe(channels) {
        this.send('subscribe', { channels });
        channels.forEach(ch => this.subscriptions.add(ch));
    }

    unsubscribe(channels) {
        this.send('unsubscribe', { channels });
        channels.forEach(ch => this.subscriptions.delete(ch));
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

    updateLocation(userId, latitude, longitude, accuracy, speed, heading) {
        this.send('location_update', {
            userId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading
        });
    }

    triggerSOS(userId, latitude, longitude, message) {
        this.send('sos_trigger', {
            userId,
            latitude,
            longitude,
            message
        });
    }
}

export default new SocketService();
