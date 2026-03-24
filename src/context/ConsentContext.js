// Consent Context
// Manages privacy settings and consent management

import React, { createContext, useContext, useState, useCallback } from 'react';
import consentService from '../services/consentService';

const ConsentContext = createContext(undefined);

export const ConsentProvider = ({ children }) => {
    const [consentSettings, setConsentSettings] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch consent settings
    const fetchConsentSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.getConsentSettings();
            if (response.success) {
                setConsentSettings(response.consent);
                return { success: true, consent: response.consent };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update consent settings
    const updateConsentSettings = useCallback(async (consentData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.updateConsentSettings(consentData);
            if (response.success) {
                setConsentSettings(response.consent);
                return { success: true, consent: response.consent };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update specific consent category
    const updateConsentCategory = useCallback(async (category, value) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.updateConsentCategory(category, value);
            if (response.success) {
                setConsentSettings(prev => ({ ...prev, [category]: value }));
                return { success: true, consent: response.consent };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch audit logs
    const fetchAuditLogs = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.getAuditLogs(params);
            if (response.success) {
                setAuditLogs(response.logs || []);
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

    // Convenience methods for checking consent
    const isLocationTrackingConsented = useCallback(() => {
        return consentSettings?.location_tracking === true;
    }, [consentSettings]);

    const isDataSharingConsented = useCallback(() => {
        return consentSettings?.data_sharing === true;
    }, [consentSettings]);

    const isMarketingConsented = useCallback(() => {
        return consentSettings?.marketing_emails === true;
    }, [consentSettings]);

    const isAnalyticsConsented = useCallback(() => {
        return consentSettings?.analytics === true;
    }, [consentSettings]);

    // Grant all consents
    const grantAllConsents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.grantAllConsents();
            if (response.success) {
                setConsentSettings(response.consent);
                return { success: true, consent: response.consent };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Revoke all consents
    const revokeAllConsents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await consentService.revokeAllConsents();
            if (response.success) {
                setConsentSettings(response.consent);
                return { success: true, consent: response.consent };
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
        consentSettings,
        auditLogs,
        isLoading,
        error,

        // Actions
        fetchConsentSettings,
        updateConsentSettings,
        updateConsentCategory,
        fetchAuditLogs,

        // Convenience checks
        isLocationTrackingConsented,
        isDataSharingConsented,
        isMarketingConsented,
        isAnalyticsConsented,

        // Bulk actions
        grantAllConsents,
        revokeAllConsents,
    };

    return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
    const context = useContext(ConsentContext);
    if (!context) {
        throw new Error('useConsent must be used within a ConsentProvider');
    }
    return context;
};

export default ConsentContext;
