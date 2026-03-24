// Custom React Hooks for API Operations
// Provides reusable hooks for common data fetching patterns

import { useState, useEffect, useCallback } from 'react';
import apiClient from './client';

/**
 * Hook for making authenticated API calls with loading and error states
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {array} dependencies - Dependencies that trigger refetch
 */
export const useApi = (endpoint, options = {}, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.request(endpoint, options);
            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [endpoint, JSON.stringify(options)]);

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for user authentication operations
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post('/auth/login', credentials);
            if (result.success) {
                await apiClient.setTokens(result.token, result.refreshToken);
                setUser(result.user);
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post('/auth/register', userData);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout', { userId: user?.id });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            await apiClient.clearTokens();
            setUser(null);
        }
    };

    const checkAuth = useCallback(async () => {
        await apiClient.initialize();
        // Check if token exists - you'd typically verify with the server
        return !!apiClient.token;
    }, []);

    return {
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user,
    };
};

/**
 * Hook for user profile operations
 */
export const useUser = (userId) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.get(`/users/${userId}`);
            setProfile(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateProfile = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.put(`/users/${userId}`, userData);
            setProfile(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        loading,
        error,
        refetch: fetchProfile,
        updateProfile,
    };
};

/**
 * Hook for emergency contacts
 */
export const useEmergencyContacts = (userId) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchContacts = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.get(`/users/${userId}/emergency-contacts`);
            setContacts(result.contacts || result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const addContact = async (contactData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post(`/users/${userId}/emergency-contacts`, contactData);
            await fetchContacts();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeContact = async (contactId) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.delete(`/users/${userId}/emergency-contacts/${contactId}`);
            await fetchContacts();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        addContact,
        removeContact,
    };
};

/**
 * Hook for SOS alerts
 */
export const useSOSAlerts = (userId) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAlerts = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.get(`/users/${userId}/sos-alerts`);
            setAlerts(result.alerts || result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const createAlert = async (alertData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post('/sos-alerts', alertData);
            await fetchAlerts();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return {
        alerts,
        loading,
        error,
        refetch: fetchAlerts,
        createAlert,
    };
};

/**
 * Hook for notifications
 */
export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.get(`/users/${userId}/notifications`);
            setNotifications(result.notifications || result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const markAsRead = async (notificationId) => {
        try {
            await apiClient.put(`/users/${userId}/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        error,
        refetch: fetchNotifications,
        markAsRead,
        unreadCount: notifications.filter(n => !n.read).length,
    };
};

/**
 * Hook for child care operations
 */
export const useChildren = (userId) => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchChildren = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.get(`/users/${userId}/children`);
            setChildren(result.children || result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const addChild = async (childData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post(`/users/${userId}/children`, childData);
            await fetchChildren();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logActivity = async (childId, activityData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post(
                `/users/${userId}/children/${childId}/activities`,
                activityData
            );
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    return {
        children,
        loading,
        error,
        refetch: fetchChildren,
        addChild,
        logActivity,
    };
};

/**
 * Hook for location history
 */
export const useLocationHistory = (userId) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLocations = useCallback(async (options = {}) => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams(options).toString();
            const result = await apiClient.get(`/users/${userId}/locations?${params}`);
            setLocations(result.locations || result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const saveLocation = async (locationData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiClient.post(`/users/${userId}/locations`, locationData);
            await fetchLocations();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        locations,
        loading,
        error,
        refetch: fetchLocations,
        saveLocation,
    };
};

export default {
    useApi,
    useAuth,
    useUser,
    useEmergencyContacts,
    useSOSAlerts,
    useNotifications,
    useChildren,
    useLocationHistory,
};
