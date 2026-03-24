import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume } from 'expo-av';
import { Platform, Vibration } from 'react-native';
import volumeButtonService from '../services/volumeButtonService';

export const useVolumeButton = (onTrigger, enabled = true) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const [pressCount, setPressCount] = useState(0);
    const [config, setConfig] = useState({ requiredPresses: 5, timeWindow: 2000 });
    
    const isInitialized = useRef(false);
    const lastVolumeRef = useRef(null);

    useEffect(() => {
        initialize();
        return () => {
            stopListening();
        };
    }, []);

    const initialize = async () => {
        if (isInitialized.current) return;
        
        try {
            await volumeButtonService.initialize();
            const enabled = await volumeButtonService.isVolumeButtonEnabled();
            const serviceConfig = volumeButtonService.getConfig();
            
            setIsEnabled(enabled);
            setConfig(serviceConfig);
            
            isInitialized.current = true;
        } catch (err) {
            setError(err.message);
        }
    };

    const startListening = useCallback(async () => {
        if (!enabled || isListening) return;

        try {
            setError(null);
            
            // Start the volume listener
            const result = await volumeButtonService.startListening(async () => {
                // On trigger - vibrate and call callback
                Vibration.vibrate([0, 300, 100, 300, 100, 300]);
                onTrigger?.();
            });
            
            if (result.success) {
                setIsListening(true);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        }
    }, [enabled, isListening, onTrigger]);

    const stopListening = useCallback(async () => {
        try {
            await volumeButtonService.stopListening();
            setIsListening(false);
        } catch (err) {
            console.error('Error stopping volume listener:', err);
        }
    }, []);

    const enableVolumeButton = useCallback(async () => {
        const result = await volumeButtonService.enableVolumeButton();
        if (result.success) {
            setIsEnabled(true);
            await startListening();
        }
        return result;
    }, [startListening]);

    const disableVolumeButton = useCallback(async () => {
        const result = await volumeButtonService.disableVolumeButton();
        if (result.success) {
            setIsEnabled(false);
            await stopListening();
            setPressCount(0);
        }
        return result;
    }, [stopListening]);

    const updatePressCount = useCallback(async () => {
        const count = await volumeButtonService.getPressCount();
        setPressCount(count);
    }, []);

    // Start listening when enabled changes
    useEffect(() => {
        if (enabled && isEnabled) {
            startListening();
        } else {
            stopListening();
        }
    }, [enabled, isEnabled]);

    return {
        isEnabled,
        isListening,
        error,
        pressCount,
        config,
        startListening,
        stopListening,
        enableVolumeButton,
        disableVolumeButton,
        updatePressCount,
    };
};

export default useVolumeButton;
