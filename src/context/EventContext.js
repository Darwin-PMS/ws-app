// Event Context
// Manages activity logs, suggestions, and location events

import React, { createContext, useContext, useState, useCallback } from 'react';
import eventService from '../services/eventService';

const EventContext = createContext(undefined);

export const EventProvider = ({ children }) => {
    const [activityLogs, setActivityLogs] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [familyContext, setFamilyContext] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ==================== LOCATION EVENTS ====================

    const sendLocationEvent = useCallback(async (familyId, locationData) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.sendLocationEvent(familyId, locationData);
            return response;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendBatchLocationEvents = useCallback(async (familyId, locations) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.sendBatchLocationEvents(familyId, locations);
            return response;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ==================== SUGGESTIONS ====================

    const fetchSuggestions = useCallback(async (familyId, params = {}) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.getSuggestions(familyId, params);
            if (response.success) {
                setSuggestions(response.suggestions || []);
                return { success: true, suggestions: response.suggestions };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const respondToSuggestion = useCallback(async (suggestionId, response) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await eventService.respondToSuggestion(suggestionId, response);
            if (result.success) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestionId ? { ...s, status: response } : s
                ));
            }
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const acceptSuggestion = useCallback(async (suggestionId) => {
        return respondToSuggestion(suggestionId, 'accepted');
    }, [respondToSuggestion]);

    const rejectSuggestion = useCallback(async (suggestionId) => {
        return respondToSuggestion(suggestionId, 'rejected');
    }, [respondToSuggestion]);

    const dismissSuggestion = useCallback(async (suggestionId) => {
        return respondToSuggestion(suggestionId, 'dismissed');
    }, [respondToSuggestion]);

    const getPendingSuggestionsCount = useCallback(() => {
        return suggestions.filter(s => s.status === 'pending').length;
    }, [suggestions]);

    // ==================== ACTIVITY LOGS ====================

    const fetchActivityLogs = useCallback(async (familyId, params = {}) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.getActivityLogs(familyId, params);
            if (response.success) {
                setActivityLogs(response.logs || []);
                return { success: true, logs: response.logs };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRecentActivityLogs = useCallback(async (familyId, limit = 20) => {
        return fetchActivityLogs(familyId, { limit });
    }, [fetchActivityLogs]);

    const createActivityLog = useCallback(async (familyId, logData) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.createActivityLog(familyId, logData);
            if (response.success) {
                setActivityLogs(prev => [response.log, ...prev]);
                return { success: true, log: response.log };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logUserActivity = useCallback(async (familyId, activityType, description, metadata = {}) => {
        return createActivityLog(familyId, {
            type: activityType,
            description,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }, [createActivityLog]);

    // ==================== FAMILY CONTEXT ====================

    const fetchFamilyContext = useCallback(async (familyId) => {
        if (!familyId) return { success: false, error: 'No family ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventService.getFamilyContext(familyId);
            if (response.success) {
                setFamilyContext(response.context);
                setSuggestions(response.suggestions || []);
                setActivityLogs(response.recentActivity || []);
                return { success: true, context: response.context };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = {
        // State
        activityLogs,
        suggestions,
        familyContext,
        isLoading,
        error,
        pendingSuggestionsCount: getPendingSuggestionsCount(),

        // Location Events
        sendLocationEvent,
        sendBatchLocationEvents,

        // Suggestions
        fetchSuggestions,
        respondToSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        dismissSuggestion,

        // Activity Logs
        fetchActivityLogs,
        fetchRecentActivityLogs,
        createActivityLog,
        logUserActivity,

        // Family Context
        fetchFamilyContext,
    };

    return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvents = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvents must be used within an EventProvider');
    }
    return context;
};

export default EventContext;
