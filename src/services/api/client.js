// Unified API Client
// Provides consistent API calling patterns across all services

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://192.168.29.84:3000/api';

// Token storage keys
const TOKEN_KEYS = {
    AUTH: '@app_auth_token',
    REFRESH: '@app_refresh_token',
    FORCE_LOGOUT: '@app_force_logout',
};

/**
 * Centralized API Client with built-in token management
 */
class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.token = null;
        this.refreshToken = null;
        this.tokenUpdateCallback = null;
        this.authFailureCallback = null;
        this.isRefreshing = false;  // Lock to prevent concurrent refresh attempts
        this.refreshPromise = null;   // Store the refresh promise
    }

    /**
     * Initialize tokens from storage
     */
    async initialize() {
        try {
            this.token = await AsyncStorage.getItem(TOKEN_KEYS.AUTH);
            this.refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
        } catch (error) {
            console.error('Failed to initialize API client:', error);
        }
    }

    /**
     * Set tokens and persist to storage
     */
    async setTokens(authToken, refreshToken) {
        this.token = authToken;
        this.refreshToken = refreshToken;

        try {
            if (authToken) {
                await AsyncStorage.setItem(TOKEN_KEYS.AUTH, authToken);
            }
            if (refreshToken) {
                await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
            }
        } catch (error) {
            console.error('Failed to save tokens:', error);
        }
    }

    /**
     * Clear tokens
     */
    async clearTokens() {
        this.token = null;
        this.refreshToken = null;

        try {
            await AsyncStorage.multiRemove([TOKEN_KEYS.AUTH, TOKEN_KEYS.REFRESH]);
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }

    /**
     * Set callback for token updates
     */
    setTokenUpdateCallback(callback) {
        this.tokenUpdateCallback = callback;
    }

    /**
     * Set callback for auth failures (e.g., when refresh token is invalid)
     */
    setAuthFailureCallback(callback) {
        this.authFailureCallback = callback;
    }

    /**
     * Make API request with automatic token handling
     */
    async request(endpoint, options = {}) {
        // Handle both full URLs and relative paths
        let url;
        if (endpoint && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
            url = endpoint;
        } else {
            url = `${this.baseUrl}${endpoint || ''}`;
        }

        // Check for force logout flag before making any request
        const forceLogout = await AsyncStorage.getItem(TOKEN_KEYS.FORCE_LOGOUT);
        if (forceLogout === 'true') {
            if (this.authFailureCallback) {
                await this.authFailureCallback();
            }
            throw {
                status: 401,
                message: 'Session terminated',
                data: { message: 'User has been logged out remotely' },
                forceLogout: true,
            };
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth token if available (skip if skipAuth option is set)
        if (options.skipAuth) {
            // Skip authentication for this request
            if (__DEV__) {
                console.log(`API Request (no auth): ${endpoint}`);
            }
        } else if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        } else if (!options.skipAuth) {
            // No token found - trigger auth failure (only if not skipping auth)
            // No token found - trigger auth failure
            if (this.authFailureCallback) {
                await this.authFailureCallback();
            }
            throw {
                status: 401,
                message: 'No token found',
                data: { message: 'Authentication token not found' },
            };
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Check for auth errors (401/403)
            const isAuthError = response.status === 401 || response.status === 403;

            // Handle 401/403 - try to refresh token (only if not already refreshing)
            if (isAuthError && this.refreshToken && !this.isRefreshing) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry original request with new token
                    headers['Authorization'] = `Bearer ${this.token}`;
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers,
                    });
                    return this.handleResponse(retryResponse);
                } else {
                    throw {
                        status: response.status,
                        message: 'Authentication failed',
                        data: { message: 'Invalid or expired token' },
                    };
                }
            }

            return this.handleResponse(response);
        } catch (error) {
            if (__DEV__) {
                console.error(`API Request Failed: ${endpoint}`, error);
            }
            throw error;
        }
    }

    /**
     * Handle response parsing and errors
     */
    async handleResponse(response) {
        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || response.statusText,
                data,
            };
        }

        return data;
    }

    /**
     * Refresh access token (with lock to prevent concurrent refreshes)
     */
    async refreshAccessToken() {
        // If already refreshing, wait for the existing refresh to complete
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        if (!this.refreshToken) {
            await this.triggerAuthFailure();
            return false;
        }

        this.isRefreshing = true;

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.token) {
                        await this.setTokens(data.token, this.refreshToken);

                        if (this.tokenUpdateCallback) {
                            this.tokenUpdateCallback(data.token);
                        }
                        return true;
                    }
                }

                // Refresh failed
                await this.triggerAuthFailure();
                return false;
            } catch (error) {
                await this.triggerAuthFailure();
                return false;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    /**
     * Trigger auth failure callback and clear tokens
     */
    async triggerAuthFailure() {
        if (this.authFailureCallback) {
            try {
                await this.authFailureCallback();
            } catch (callbackError) {
                console.error('Auth failure callback error:', callbackError);
            }
        }
        await this.clearTokens();
    }

    // Convenience methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
