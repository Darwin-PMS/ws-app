// Offline Service
// Handles offline functionality and queueing

import NetInfo from '@react-native-community/netinfo';

class OfflineService {
    constructor() {
        this.isConnected = true;
        this.offlineQueue = [];
        this.isProcessing = false;
        this.listeners = [];
    }

    // Initialize network monitoring
    async initialize() {
        const state = await NetInfo.fetch();
        this.isConnected = state.isConnected;

        NetInfo.addEventListener(state => {
            this.isConnected = state.isConnected;
            this.notifyListeners();

            if (state.isConnected) {
                this.processQueue();
            }
        });
    }

    // Add listener for connectivity changes
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.isConnected));
    }

    // Check if connected
    isOnline() {
        return this.isConnected;
    }

    // Add to offline queue
    addToQueue(action, data) {
        this.offlineQueue.push({ action, data, timestamp: Date.now() });
    }

    // Process offline queue
    async processQueue() {
        if (this.isProcessing || !this.isConnected || this.offlineQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.offlineQueue.length > 0) {
            const item = this.offlineQueue[0];

            try {
                switch (item.action) {
                    case 'location':
                        // Handle location action
                        break;
                    case 'sos':
                        // Handle SOS action
                        break;
                    default:
                    // Unknown action
                }
                this.offlineQueue.shift();
            } catch (error) {
                break;
            }
        }

        this.isProcessing = false;
    }

    // Clear queue
    clearQueue() {
        this.offlineQueue = [];
    }

    // Get queue length
    getQueueLength() {
        return this.offlineQueue.length;
    }
}

export default new OfflineService();
