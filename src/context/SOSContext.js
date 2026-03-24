// SOS Context
// Manages SOS alert state and operations

import React, { createContext, useContext, useState, useCallback } from 'react';
import sosService from '../services/sosService';
import { useApp } from './AppContext';

const SOSContext = createContext(undefined);

export const SOSProvider = ({ children }) => {
    const { userId } = useApp();
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [sosHistory, setSOSHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Trigger SOS alert
    const triggerSOS = useCallback(async (data = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await sosService.triggerSOS({
                user_id: userId,
                ...data,
            });
            if (response.success) {
                setActiveAlerts(prev => [response.alert, ...prev]);
                return { success: true, alert: response.alert };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Get active SOS alerts
    const fetchActiveAlerts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await sosService.getActiveSOS();
            if (response.success) {
                setActiveAlerts(response.alerts || []);
                return { success: true, alerts: response.alerts };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get SOS history
    const fetchSOSHistory = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await sosService.getSOSHistory(params);
            if (response.success) {
                setSOSHistory(response.alerts || []);
                return { success: true, alerts: response.alerts };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Resolve SOS alert
    const resolveSOS = useCallback(async (alertId, resolutionData = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await sosService.resolveSOS(alertId, resolutionData);
            if (response.success) {
                setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cancel SOS alert
    const cancelSOS = useCallback(async (alertId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await sosService.cancelSOS(alertId);
            if (response.success) {
                setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if user has active SOS
    const hasActiveSOS = useCallback(() => {
        return activeAlerts.length > 0;
    }, [activeAlerts]);

    const value = {
        activeAlerts,
        sosHistory,
        isLoading,
        error,
        triggerSOS,
        fetchActiveAlerts,
        fetchSOSHistory,
        resolveSOS,
        cancelSOS,
        hasActiveSOS,
    };

    return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

export const useSOS = () => {
    const context = useContext(SOSContext);
    if (!context) {
        throw new Error('useSOS must be used within an SOSProvider');
    }
    return context;
};

export default SOSContext;
