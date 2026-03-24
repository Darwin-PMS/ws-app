// Signal Strength Monitoring Service
// Monitors GPS and Cellular signal strength to prevent tracking interruptions

import * as NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SignalService {
    constructor() {
        this.isMonitoring = false;
        this.netInfoSubscription = null;
        this.locationSubscription = null;
        this.listeners = [];
        this.lastKnownSignalStatus = null;

        // Signal thresholds
        this.GPS_ACCURACY_EXCELLENT = 5; // meters
        this.GPS_ACCURACY_GOOD = 15; // meters
        this.GPS_ACCURACY_FAIR = 50; // meters
        this.GPS_ACCURACY_POOR = 100; // meters

        // Network type priorities
        this.NETWORK_PRIORITY = {
            'wifi': 4,
            'cellular': 3,
            'bluetooth': 2,
            'wired': 1,
            'unknown': 0,
            'none': -1
        };
    }

    // Initialize signal monitoring
    async initialize() {
        try {
            // Get initial network state
            const netInfo = await NetInfo.fetch();
            const location = await this.getLocationAccuracy();

            this.lastKnownSignalStatus = {
                network: this.getNetworkStatus(netInfo),
                gps: location,
                timestamp: new Date().toISOString()
            };

            console.log('Signal Service initialized:', this.lastKnownSignalStatus);

            return {
                success: true,
                signalStatus: this.lastKnownSignalStatus
            };
        } catch (error) {
            console.error('Error initializing signal service:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get current network status
    async getNetworkStatus(state = null) {
        try {
            const netInfo = state || await NetInfo.fetch();

            const isConnected = netInfo.isConnected;
            const isInternetReachable = netInfo.isInternetReachable;
            const type = netInfo.type;
            const subtype = netInfo.details?.cellularGeneration || 'unknown';

            // Determine signal strength based on connection type
            let signalStrength = 0;
            let signalLabel = 'No Connection';
            let signalColor = '#EF4444'; // Red

            if (isConnected) {
                switch (type) {
                    case 'wifi':
                        signalStrength = 4;
                        signalLabel = 'WiFi';
                        signalColor = '#10B981'; // Green
                        break;
                    case 'cellular':
                        // Cellular generation determines strength
                        switch (subtype) {
                            case '5g':
                                signalStrength = 4;
                                signalLabel = '5G';
                                signalColor = '#10B981'; // Green
                                break;
                            case '4g':
                            case 'lte':
                                signalStrength = 3;
                                signalLabel = '4G/LTE';
                                signalColor = '#10B981'; // Green
                                break;
                            case '3g':
                                signalStrength = 2;
                                signalLabel = '3G';
                                signalColor = '#F59E0B'; // Orange
                                break;
                            case '2g':
                            case 'edge':
                                signalStrength = 1;
                                signalLabel = '2G/Edge';
                                signalColor = '#EF4444'; // Red
                                break;
                            default:
                                signalStrength = 2;
                                signalLabel = 'Cellular';
                                signalColor = '#F59E0B'; // Orange
                        }
                        break;
                    case 'bluetooth':
                        signalStrength = 2;
                        signalLabel = 'Bluetooth';
                        signalColor = '#F59E0B'; // Orange
                        break;
                    case 'wired':
                        signalStrength = 4;
                        signalLabel = 'Wired';
                        signalColor = '#10B981'; // Green
                        break;
                    default:
                        signalStrength = 1;
                        signalLabel = 'Unknown';
                        signalColor = '#71717A'; // Gray
                }
            }

            return {
                isConnected,
                isInternetReachable,
                type,
                subtype,
                signalStrength,
                signalLabel,
                signalColor,
                isWeak: signalStrength < 2,
                isNoConnection: !isConnected
            };
        } catch (error) {
            console.error('Error getting network status:', error);
            return {
                isConnected: false,
                isInternetReachable: false,
                type: 'unknown',
                subtype: 'unknown',
                signalStrength: 0,
                signalLabel: 'Error',
                signalColor: '#71717A',
                isWeak: true,
                isNoConnection: true
            };
        }
    }

    // Get GPS/Location accuracy
    async getLocationAccuracy() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            const accuracy = location.coords.accuracy;
            let accuracyLabel = 'Unknown';
            let accuracyColor = '#71717A';
            let accuracyLevel = 0;

            if (accuracy !== null && accuracy !== undefined) {
                if (accuracy <= this.GPS_ACCURACY_EXCELLENT) {
                    accuracyLabel = 'Excellent';
                    accuracyColor = '#10B981'; // Green
                    accuracyLevel = 4;
                } else if (accuracy <= this.GPS_ACCURACY_GOOD) {
                    accuracyLabel = 'Good';
                    accuracyColor = '#10B981'; // Green
                    accuracyLevel = 3;
                } else if (accuracy <= this.GPS_ACCURACY_FAIR) {
                    accuracyLabel = 'Fair';
                    accuracyColor = '#F59E0B'; // Orange
                    accuracyLevel = 2;
                } else if (accuracy <= this.GPS_ACCURACY_POOR) {
                    accuracyLabel = 'Poor';
                    accuracyColor = '#EF4444'; // Red
                    accuracyLevel = 1;
                } else {
                    accuracyLabel = 'Very Poor';
                    accuracyColor = '#DC2626'; // Dark Red
                    accuracyLevel = 0;
                }
            }

            return {
                accuracy: accuracy || -1,
                accuracyLabel,
                accuracyColor,
                accuracyLevel,
                isWeak: accuracyLevel < 2,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp
            };
        } catch (error) {
            console.error('Error getting location accuracy:', error);
            return {
                accuracy: -1,
                accuracyLabel: 'Error',
                accuracyColor: '#71717A',
                accuracyLevel: 0,
                isWeak: true,
                error: error.message
            };
        }
    }

    // Get combined signal status
    async getSignalStatus() {
        const network = await this.getNetworkStatus();
        const gps = await this.getLocationAccuracy();

        const status = {
            network,
            gps,
            timestamp: new Date().toISOString(),
            isHealthy: network.signalStrength >= 2 && gps.accuracyLevel >= 2,
            hasIssues: network.isWeak || gps.isWeak
        };

        this.lastKnownSignalStatus = status;
        return status;
    }

    // Start monitoring signal strength
    startMonitoring(callback, interval = 10000) {
        if (this.isMonitoring) {
            console.log('Signal monitoring already active');
            return;
        }

        this.isMonitoring = true;

        // Listen for network state changes
        this.netInfoSubscription = NetInfo.addEventListener(async (state) => {
            const status = await this.getSignalStatus();

            console.log('Signal changed:', {
                network: status.network.signalLabel,
                gps: status.gps.accuracyLabel
            });

            // Notify listeners
            this.notifyListeners(status);

            // Trigger callback if provided
            if (callback) {
                callback(status);
            }
        });

        // Also periodically check GPS accuracy
        this.locationSubscription = setInterval(async () => {
            const status = await this.getSignalStatus();
            this.notifyListeners(status);

            if (callback) {
                callback(status);
            }
        }, interval);

        console.log('Signal monitoring started');
    }

    // Stop monitoring signal
    stopMonitoring() {
        if (this.netInfoSubscription) {
            this.netInfoSubscription();
            this.netInfoSubscription = null;
        }

        if (this.locationSubscription) {
            clearInterval(this.locationSubscription);
            this.locationSubscription = null;
        }

        this.isMonitoring = false;
        console.log('Signal monitoring stopped');
    }

    // Add listener for signal changes
    addSignalListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    // Notify all listeners
    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in signal listener:', error);
            }
        });
    }

    // Check if tracking should be paused due to poor signal
    async shouldPauseTracking() {
        const status = await this.getSignalStatus();

        // Pause if both network and GPS are weak
        if (status.network.isWeak && status.gps.isWeak) {
            return {
                shouldPause: true,
                reason: 'Both network and GPS signals are weak',
                networkStatus: status.network,
                gpsStatus: status.gps
            };
        }

        // Pause if no connection and GPS is poor
        if (status.network.isNoConnection && status.gps.isWeak) {
            return {
                shouldPause: true,
                reason: 'No network connection and poor GPS accuracy',
                networkStatus: status.network,
                gpsStatus: status.gps
            };
        }

        return {
            shouldPause: false,
            reason: 'Signal is adequate for tracking',
            networkStatus: status.network,
            gpsStatus: status.gps
        };
    }

    // Get recommended tracking interval based on signal
    async getRecommendedInterval() {
        const status = await this.getSignalStatus();

        // If both signals are excellent, use normal interval
        if (status.network.signalStrength >= 3 && status.gps.accuracyLevel >= 3) {
            return 10000; // 10 seconds
        }

        // If signals are good, slightly longer interval
        if (status.network.signalStrength >= 2 && status.gps.accuracyLevel >= 2) {
            return 15000; // 15 seconds
        }

        // If signals are weak, use longer interval
        if (status.network.signalStrength >= 1 && status.gps.accuracyLevel >= 1) {
            return 30000; // 30 seconds
        }

        // If signals are very poor, use much longer interval or pause
        return 60000; // 1 minute
    }

    // Get signal warning message
    async getWarningMessage() {
        const status = await this.getSignalStatus();
        const warnings = [];

        if (status.network.isNoConnection) {
            warnings.push('⚠️ No network connection');
        } else if (status.network.isWeak) {
            warnings.push(`⚠️ Weak ${status.network.signalLabel} signal`);
        }

        if (status.gps.isWeak) {
            warnings.push(`⚠️ Poor GPS accuracy: ${status.gps.accuracyLabel} (±${Math.round(status.gps.accuracy)}m)`);
        }

        if (warnings.length === 0) {
            return null;
        }

        return warnings.join('\n');
    }

    // Check if we should send alert about signal loss
    async checkAndAlert() {
        const status = await this.getSignalStatus();

        // Save to storage for potential SOS use
        try {
            await AsyncStorage.setItem('lastSignalStatus', JSON.stringify({
                ...status,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving signal status:', error);
        }

        return status;
    }

    // Get historical signal data
    async getSignalHistory() {
        try {
            const historyJson = await AsyncStorage.getItem('signalHistory');
            if (historyJson) {
                return JSON.parse(historyJson);
            }
            return [];
        } catch (error) {
            console.error('Error loading signal history:', error);
            return [];
        }
    }

    // Save signal data to history
    async saveToHistory(status) {
        try {
            let history = await this.getSignalHistory();

            // Add new status
            history.push({
                ...status,
                timestamp: new Date().toISOString()
            });

            // Keep only last 100 entries
            if (history.length > 100) {
                history = history.slice(-100);
            }

            await AsyncStorage.setItem('signalHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving signal history:', error);
        }
    }
}

export default new SignalService();
