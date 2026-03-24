// Sensor Service
// Handles accelerometer, gyroscope, and motion detection for anomaly detection

import { Accelerometer, Gyroscope, Pedometer } from 'expo-sensors';

class SensorService {
    constructor() {
        this.isMonitoring = false;
        this.listeners = new Map();
        this.accelerometerData = { x: 0, y: 0, z: 0, magnitude: 0 };
        this.gyroscopeData = { x: 0, y: 0, z: 0 };
        this.previousMagnitude = 9.81;
        this.fallDetectionCallbacks = [];

        // Fall detection thresholds
        this.FALL_THRESHOLD = 25; // m/s²
        this.IMPACT_THRESHOLD = 15;
        this.ORIENTATION_CHANGE = 45;
        this.STILLNESS_DURATION = 30000;

        // Activity detection
        this.movementHistory = [];
        this.currentActivity = 'unknown';

        // Sensor subscriptions
        this.accelerometerSubscription = null;
        this.gyroscopeSubscription = null;
        this.pedometerSubscription = null;
    }

    // ========================
    // Initialization
    // ========================

    async checkAvailability() {
        const [accelerometerAvailable, gyroscopeAvailable, pedometerAvailable] = await Promise.all([
            Accelerometer.isAvailableAsync(),
            Gyroscope.isAvailableAsync(),
            Pedometer.isAvailableAsync()
        ]);

        return {
            accelerometer: accelerometerAvailable,
            gyroscope: gyroscopeAvailable,
            pedometer: pedometerAvailable
        };
    }

    // ========================
    // Start Monitoring
    // ========================

    async startMonitoring(config = {}) {
        if (this.isMonitoring) {
            console.log('Sensor service already monitoring');
            return { success: true, message: 'Already monitoring' };
        }

        try {
            const available = await this.checkAvailability();

            // Configure update intervals
            const accelerometerInterval = config.accelerometerInterval || 100; // ms
            const gyroscopeInterval = config.gyroscopeInterval || 100;

            // Start accelerometer
            if (available.accelerometer) {
                Accelerometer.setUpdateInterval(accelerometerInterval);
                this.accelerometerSubscription = Accelerometer.addListener(
                    (data) => this.handleAccelerometerData(data)
                );
            }

            // Start gyroscope
            if (available.gyroscope) {
                Gyroscope.setUpdateInterval(gyroscopeInterval);
                this.gyroscopeSubscription = Gyroscope.addListener(
                    (data) => this.handleGyroscopeData(data)
                );
            }

            // Start pedometer if available
            if (available.pedometer) {
                this.pedometerSubscription = await Pedometer.watchStepCount(
                    (result) => this.handlePedometerData(result)
                );
            }

            this.isMonitoring = true;

            return {
                success: true,
                sensors: available,
                message: 'Sensor monitoring started'
            };
        } catch (error) {
            console.error('Failed to start sensor monitoring:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================
    // Stop Monitoring
    // ========================

    async stopMonitoring() {
        if (!this.isMonitoring) {
            return { success: true, message: 'Not monitoring' };
        }

        try {
            // Remove all listeners
            if (this.accelerometerSubscription) {
                this.accelerometerSubscription.remove();
                this.accelerometerSubscription = null;
            }

            if (this.gyroscopeSubscription) {
                this.gyroscopeSubscription.remove();
                this.gyroscopeSubscription = null;
            }

            if (this.pedometerSubscription) {
                this.pedometerSubscription.remove();
                this.pedometerSubscription = null;
            }

            this.isMonitoring = false;

            return { success: true, message: 'Sensor monitoring stopped' };
        } catch (error) {
            console.error('Failed to stop sensor monitoring:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================
    // Data Handlers
    // ========================

    handleAccelerometerData(data) {
        // Calculate magnitude
        const magnitude = Math.sqrt(
            data.x * data.x +
            data.y * data.y +
            data.z * data.z
        );

        // Store previous magnitude for fall detection
        const prevMagnitude = this.previousMagnitude;
        this.previousMagnitude = magnitude;

        // Update data
        this.accelerometerData = {
            x: data.x,
            y: data.y,
            z: data.z,
            magnitude,
            timestamp: Date.now()
        };

        // Add to movement history
        this.movementHistory.push({
            magnitude,
            timestamp: Date.now()
        });

        // Keep only last 5 minutes of history
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        this.movementHistory = this.movementHistory.filter(
            m => m.timestamp > fiveMinutesAgo
        );

        // Check for fall
        this.checkForFall(magnitude, prevMagnitude);

        // Determine activity
        this.determineActivity();

        // Notify listeners
        this.notifyListeners('accelerometer', this.accelerometerData);
    }

    handleGyroscopeData(data) {
        this.gyroscopeData = {
            x: data.x,
            y: data.y,
            z: data.z,
            timestamp: Date.now()
        };

        this.notifyListeners('gyroscope', this.gyroscopeData);
    }

    handlePedometerData(result) {
        this.notifyListeners('pedometer', {
            steps: result.steps,
            distance: result.distance,
            timestamp: Date.now()
        });
    }

    // ========================
    // Fall Detection
    // ========================

    checkForFall(magnitude, prevMagnitude) {
        // Detect sudden change in acceleration (potential fall)
        const change = Math.abs(magnitude - prevMagnitude);

        if (change > this.FALL_THRESHOLD) {
            // Potential fall detected - start monitoring for confirmation
            console.log('Potential fall detected:', change);

            // Wait a moment and check for stillness
            setTimeout(() => {
                if (this.isStill()) {
                    // Likely a fall - trigger alert
                    this.triggerFallAlert();
                }
            }, 1000);
        }
    }

    isStill() {
        if (this.movementHistory.length < 5) return false;

        // Check if recent readings show very little movement
        const recent = this.movementHistory.slice(-10);
        const avgMagnitude = recent.reduce((sum, m) => sum + m.magnitude, 0) / recent.length;

        // Still if magnitude is close to gravity (9.81) with little variation
        return Math.abs(avgMagnitude - 9.81) < 2;
    }

    triggerFallAlert() {
        const alert = {
            type: 'fall_detected',
            severity: 'critical',
            timestamp: Date.now(),
            sensorData: {
                accelerometer: this.accelerometerData,
                gyroscope: this.gyroscopeData
            }
        };

        // Notify all fall detection callbacks
        for (const callback of this.fallDetectionCallbacks) {
            try {
                callback(alert);
            } catch (e) {
                console.error('Fall detection callback error:', e);
            }
        }
    }

    onFallDetected(callback) {
        this.fallDetectionCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.fallDetectionCallbacks.indexOf(callback);
            if (index > -1) {
                this.fallDetectionCallbacks.splice(index, 1);
            }
        };
    }

    // ========================
    // Activity Detection
    // ========================

    determineActivity() {
        if (this.movementHistory.length < 10) {
            return 'unknown';
        }

        const recent = this.movementHistory.slice(-20);

        // Calculate statistics
        const magnitudes = recent.map(m => m.magnitude);
        const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
        const variance = magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length;

        // Determine activity based on acceleration patterns
        if (variance < 1) {
            this.currentActivity = avgMagnitude > 10.5 ? 'running' : 'standing';
        } else if (variance < 5) {
            this.currentActivity = 'walking';
        } else {
            this.currentActivity = 'active';
        }

        return this.currentActivity;
    }

    getCurrentActivity() {
        return this.currentActivity;
    }

    // ========================
    // Listeners
    // ========================

    subscribe(sensorType, callback) {
        if (!this.listeners.has(sensorType)) {
            this.listeners.set(sensorType, new Set());
        }

        this.listeners.get(sensorType).add(callback);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(sensorType);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }

    notifyListeners(sensorType, data) {
        const listeners = this.listeners.get(sensorType);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Listener error for ${sensorType}:`, e);
                }
            }
        }
    }

    // ========================
    // Data Access
    // ========================

    getAccelerometerData() {
        return this.accelerometerData;
    }

    getGyroscopeData() {
        return this.gyroscopeData;
    }

    getMovementHistory() {
        return this.movementHistory;
    }

    getIsMonitoring() {
        return this.isMonitoring;
    }

    // ========================
    // Get all sensor data
    // ========================

    getAllSensorData() {
        return {
            accelerometer: this.accelerometerData,
            gyroscope: this.gyroscopeData,
            activity: this.currentActivity,
            isMonitoring: this.isMonitoring,
            timestamp: Date.now()
        };
    }
}

export default new SensorService();
