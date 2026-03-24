import { useEffect, useRef, useCallback } from 'react';
import { Platform, Vibration } from 'react-native';
import * as ExpoSensor from 'expo-sensors';

// Hook for shake detection to trigger SOS
// Based on Disha app's 5-shake trigger functionality
// Configurable for different use cases

const DEFAULT_SHAKE_THRESHOLD = 2.5; // Sensitivity threshold
const DEFAULT_SHAKE_INTERVAL = 500; // Minimum time between shakes (ms)
const DEFAULT_REQUIRED_SHAKES = 5; // Number of shakes to trigger SOS (Disha app standard)
const DEFAULT_TIME_WINDOW = 3000; // Time window to complete shakes (ms)

/**
 * useShakeDetector - Custom hook for detecting shake gestures
 * @param {Function} onShakeTrigger - Callback function when shake is detected
 * @param {boolean} enabled - Whether the detector is enabled
 * @param {Object} config - Optional configuration object
 * @param {number} config.requiredShakes - Number of shakes required (default: 5)
 * @param {number} config.shakeThreshold - Acceleration threshold (default: 2.5)
 * @param {number} config.timeWindow - Time window in ms (default: 3000)
 * @param {number} config.shakeInterval - Min time between shakes in ms (default: 500)
 */
export const useShakeDetector = (onShakeTrigger, enabled = true, config = {}) => {
    const {
        requiredShakes = DEFAULT_REQUIRED_SHAKES,
        shakeThreshold = DEFAULT_SHAKE_THRESHOLD,
        timeWindow = DEFAULT_TIME_WINDOW,
        shakeInterval = DEFAULT_SHAKE_INTERVAL
    } = config;

    const shakeCount = useRef(0);
    const lastShakeTime = useRef(0);
    const shakeStartTime = useRef(0);
    const isAvailable = useRef(false);
    const subscriptionRef = useRef(null);

    const resetShakeCount = useCallback(() => {
        shakeCount.current = 0;
        shakeStartTime.current = 0;
    }, []);

    const handleShake = useCallback((data) => {
        if (!enabled) return;

        const currentTime = Date.now();

        // Check if enough time has passed since last shake
        if (currentTime - lastShakeTime.current < shakeInterval) {
            return;
        }

        // Calculate acceleration magnitude
        const { x, y, z } = data;
        const acceleration = Math.sqrt(x * x + y * y + z * z);

        // Check if acceleration exceeds threshold (excluding gravity ~9.8)
        if (acceleration > shakeThreshold) {
            lastShakeTime.current = currentTime;
            shakeCount.current += 1;

            // Record start time on first shake
            if (shakeCount.current === 1) {
                shakeStartTime.current = currentTime;
            }

            // Vibrate to give feedback
            Vibration.vibrate(50);

            // Check if shakes completed within time window
            const timeElapsed = currentTime - shakeStartTime.current;

            if (shakeCount.current >= requiredShakes && timeElapsed <= timeWindow) {
                // Trigger SOS
                onShakeTrigger?.();
                resetShakeCount();
            } else if (timeElapsed > timeWindow) {
                // Reset if time window exceeded
                resetShakeCount();
                // Start new count
                shakeCount.current = 1;
                shakeStartTime.current = currentTime;
            }
        }
    }, [enabled, onShakeTrigger, resetShakeCount, requiredShakes, shakeThreshold, timeWindow, shakeInterval]);

    useEffect(() => {
        const initSensor = async () => {
            if (!enabled) return;

            try {
                // Check if accelerometer is available
                const available = await ExpoSensor.Accelerometer.isAvailableAsync();
                isAvailable.current = available;

                if (available) {
                    // Set update interval (100ms for responsive detection)
                    ExpoSensor.Accelerometer.setUpdateInterval(100);

                    // Subscribe to accelerometer data
                    subscriptionRef.current = ExpoSensor.Accelerometer.addListener(handleShake);
                } else {
                    console.log('Accelerometer not available on this device');
                }
            } catch (error) {
                console.log('Error initializing shake detector:', error);
            }
        };

        initSensor();

        return () => {
            // Cleanup subscription on unmount
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
        };
    }, [enabled, handleShake]);

    return {
        isAvailable: isAvailable.current,
        resetShakeCount,
    };
};

export default useShakeDetector;
