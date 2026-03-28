// User Context
// Manages user profile, emergency contacts, notifications, and settings

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import userService from '../services/userService';
import locationService from '../services/locationService';
import { useApp } from './AppContext';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
    const { userId } = useApp();
    const [profile, setProfile] = useState(null);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [userSettings, setUserSettings] = useState(null);
    const [locationHistory, setLocationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const locationTrackingRef = useRef(false);
    const appStateRef = useRef(AppState.currentState);

    // Fetch user settings when userId becomes available (on login)
    useEffect(() => {
        if (userId) {
            console.log('📍 UserContext: Auto-loading user settings');
            const loadSettings = async () => {
                try {
                    const response = await userService.getUserSettings(userId);
                    if (response.success && response.settings) {
                        setUserSettings(response.settings);
                        
                        const locationEnabled = response.settings.location_enabled === 1 || response.settings.location_enabled === true;
                        console.log('📍 Location enabled:', locationEnabled, 'settings:', response.settings.location_enabled);
                        
                        if (locationEnabled && !locationTrackingRef.current) {
                            await locationService.startPeriodicLocationSave(userId, 60000);
                            await locationService.saveCurrentLocation(userId);
                            locationTrackingRef.current = true;
                        }
                    }
                } catch (err) {
                    console.error('Error loading settings:', err);
                }
            };
            loadSettings();
        }
    }, [userId]);

    // Save location when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to the foreground
                if (userId && userSettings && (userSettings.location_enabled === 1 || userSettings.location_enabled === true)) {
                    try {
                        await locationService.saveCurrentLocation(userId);
                        console.log('📍 Location saved on app foreground');
                    } catch (error) {
                        console.error('Failed to save location on foreground:', error);
                    }
                }
            }
            appStateRef.current = nextAppState;
        });

        return () => subscription.remove();
    }, [userId, userSettings]);

    // ==================== PROFILE ====================

    const fetchProfile = useCallback(async (id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getProfile(id);
            if (response.success) {
                setProfile(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const updateProfile = useCallback(async (profileData, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.updateProfile(id, profileData);
            if (response.success) {
                setProfile(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // ==================== EMERGENCY CONTACTS ====================

    const fetchEmergencyContacts = useCallback(async (id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getEmergencyContacts(id);
            if (response.success) {
                setEmergencyContacts(response.contacts || []);
                return { success: true, contacts: response.contacts };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const addEmergencyContact = useCallback(async (contactData, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.addEmergencyContact(id, contactData);
            if (response.success) {
                setEmergencyContacts(prev => [...prev, response.contact]);
                return { success: true, contact: response.contact };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const deleteEmergencyContact = useCallback(async (contactId, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.deleteEmergencyContact(id, contactId);
            if (response.success) {
                setEmergencyContacts(prev => prev.filter(c => c.id !== contactId));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // ==================== NOTIFICATIONS ====================

    const fetchNotifications = useCallback(async (params = {}, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getNotifications(id, params);
            if (response.success) {
                setNotifications(response.notifications || []);
                return { success: true, notifications: response.notifications };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const markNotificationRead = useCallback(async (notificationId, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.markNotificationRead(id, notificationId);
            if (response.success) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                ));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const markAllNotificationsRead = useCallback(async (id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.markAllNotificationsRead(id);
            if (response.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const getUnreadCount = useCallback(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    // ==================== USER SETTINGS ====================

    const fetchUserSettings = useCallback(async (id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getUserSettings(id);
            if (response.success) {
                setUserSettings(response.settings);
                
                const locationEnabled = response.settings.location_enabled === 1 || response.settings.location_enabled === true;
                
                if (locationEnabled && !locationTrackingRef.current) {
                    await locationService.startPeriodicLocationSave(id, 60000);
                    await locationService.saveCurrentLocation(id);
                    locationTrackingRef.current = true;
                } else if (!locationEnabled && locationTrackingRef.current) {
                    await locationService.stopPeriodicLocationSave();
                    locationTrackingRef.current = false;
                }
                
                return { success: true, settings: response.settings };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const updateUserSettings = useCallback(async (settingsData, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.updateUserSettings(id, settingsData);
            if (response.success) {
                setUserSettings(response.settings);
                
                if (settingsData.location_enabled !== undefined) {
                    const locationEnabled = settingsData.location_enabled === 1 || settingsData.location_enabled === true;
                    if (locationEnabled && !locationTrackingRef.current) {
                        await locationService.startPeriodicLocationSave(id, 60000);
                        await locationService.saveCurrentLocation(id);
                        locationTrackingRef.current = true;
                    } else if (!locationEnabled && locationTrackingRef.current) {
                        await locationService.stopPeriodicLocationSave();
                        locationTrackingRef.current = false;
                    }
                }
                
                return { success: true, settings: response.settings };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // ==================== LOCATION HISTORY ====================

    const fetchLocationHistory = useCallback(async (params = {}, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getLocationHistory(id, params);
            if (response.success) {
                setLocationHistory(response.locations || []);
                return { success: true, locations: response.locations };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const saveLocation = useCallback(async (locationData, id = userId) => {
        if (!id) return { success: false, error: 'No user ID' };
        setError(null);
        try {
            const response = await userService.saveLocation(id, locationData);
            if (response?.success) {
                return { success: true, location: response };
            }
            return { success: false, error: response?.message || 'Failed to save location' };
        } catch (err) {
            const errorMsg = err?.message || 'Failed to save location';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    const value = {
        // State
        profile,
        emergencyContacts,
        notifications,
        userSettings,
        locationHistory,
        isLoading,
        error,
        unreadCount: getUnreadCount(),

        // Profile Actions
        fetchProfile,
        updateProfile,

        // Emergency Contacts Actions
        fetchEmergencyContacts,
        addEmergencyContact,
        deleteEmergencyContact,

        // Notifications Actions
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,

        // Settings Actions
        fetchUserSettings,
        updateUserSettings,

        // Location Actions
        fetchLocationHistory,
        saveLocation,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;
