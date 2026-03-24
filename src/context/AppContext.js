import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import databaseService from '../services/databaseService';
import { apiClient } from '../services/api/client';
import { mobileApi } from '../services/api/mobileApi';
import { getSessionData } from '../utils/deviceInfo';

// User Roles
export const USER_ROLES = {
    WOMAN: 'woman',
    PARENT: 'parent',
    GUARDIAN: 'guardian',
    FRIEND: 'friend',
    ADMIN: 'admin',
};

// Role display names
export const ROLE_NAMES = {
    [USER_ROLES.WOMAN]: 'Women Safety User',
    [USER_ROLES.PARENT]: 'Parent',
    [USER_ROLES.GUARDIAN]: 'Guardian',
    [USER_ROLES.FRIEND]: 'Trusted Friend',
    [USER_ROLES.ADMIN]: 'Administrator',
};

// Storage keys
const STORAGE_KEYS = {
    API_KEY: '@groq_api_key',
    SELECTED_MODEL: '@groq_selected_model',
    TEMPERATURE: '@groq_temperature',
    MAX_TOKENS: '@groq_max_tokens',
    SYSTEM_PROMPT: '@groq_system_prompt',
    CHAT_HISTORY: '@groq_chat_history',
    USER_ROLE: '@app_user_role',
    USER_ID: '@app_user_id',
    USER_NAME: '@app_user_name',
    AUTH_TOKEN: '@app_auth_token',
    REFRESH_TOKEN: '@app_refresh_token',
    IS_LOGGED_IN: '@app_is_logged_in',
    FORCE_LOGOUT: '@app_force_logout',
    FORCE_LOGOUT_REASON: '@app_force_logout_reason',
};

// Default values
const DEFAULTS = {
    apiKey: '',
    selectedModel: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'helpful',
    chatHistory: [],
    userRole: USER_ROLES.WOMAN,
};

// Available models
export const AVAILABLE_MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', type: 'chat' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', type: 'chat' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', type: 'chat' },
    { id: 'llama-3-70b-verity', name: 'Llama 3 70B Verity', type: 'chat' },
    { id: 'llama-3-8b-verity', name: 'Llama 3 8B Verity', type: 'chat' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', type: 'chat' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', type: 'chat' },
    { id: 'gemma-7b-it', name: 'Gemma 7B', type: 'chat' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', type: 'vision' },
    { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', type: 'audio' },
    { id: 'whisper-large-v3', name: 'Whisper Large V3', type: 'audio' },
];

// System prompts
export const SYSTEM_PROMPTS = [
    { id: 'helpful', name: 'Helpful Assistant', prompt: 'You are a helpful assistant.' },
    { id: 'coder', name: 'Code Expert', prompt: 'You are an expert programmer. Provide clear, well-commented code examples.' },
    { id: 'creative', name: 'Creative Writer', prompt: 'You are a creative writer. Use vivid descriptions and engaging storytelling.' },
    { id: 'analyst', name: 'Data Analyst', prompt: 'You are a data analyst. Provide insights and explain patterns clearly.' },
];

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    const [apiKey, setApiKey] = useState(DEFAULTS.apiKey);
    const [selectedModel, setSelectedModel] = useState(DEFAULTS.selectedModel);
    const [temperature, setTemperature] = useState(DEFAULTS.temperature);
    const [maxTokens, setMaxTokens] = useState(DEFAULTS.maxTokens);
    const [systemPrompt, setSystemPrompt] = useState(DEFAULTS.systemPrompt);
    const [chatHistory, setChatHistory] = useState(DEFAULTS.chatHistory);
    const [isLoading, setIsLoading] = useState(true);
    const [isApiKeySet, setIsApiKeySet] = useState(false);
    const [userRole, setUserRole] = useState(DEFAULTS.userRole || USER_ROLES.WOMAN);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const [authToken, setAuthToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [needsReLogin, setNeedsReLogin] = useState(false);
    const [isForcedLogout, setIsForcedLogout] = useState(false);
    const [dependents, setDependents] = useState([]);
    const [guardians, setGuardians] = useState([]);

    // Load stored values on mount
    useEffect(() => {
        loadStoredValues();
    }, []);

    const loadStoredValues = async () => {
        try {
            // Initialize API clients with stored tokens
            await apiClient.initialize();
            await mobileApi.initialize();

            // Set up auth failure callback
            apiClient.setAuthFailureCallback(handleAuthFailure);

            const storedApiKey = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
            const storedModel = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
            const storedTemp = await AsyncStorage.getItem(STORAGE_KEYS.TEMPERATURE);
            const storedMaxTokens = await AsyncStorage.getItem(STORAGE_KEYS.MAX_TOKENS);
            const storedSystemPrompt = await AsyncStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
            const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
            const storedRole = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
            const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
            const storedUserName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
            const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const storedRefreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            const storedIsLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
            const storedForceLogout = await AsyncStorage.getItem(STORAGE_KEYS.FORCE_LOGOUT);

            // Check for force logout flag - if set, force logout the user
            if (storedForceLogout === 'true') {
                console.log('Force logout flag detected, logging out user');
                await performLogout();
                setIsForcedLogout(true);
                setIsLoading(false);
                return;
            }

            // Check if token exists - if not, force logout
            if (!storedToken) {
                console.log('No auth token found, forcing logout');
                await performLogout();
                setIsLoading(false);
                return;
            }

            if (storedApiKey) {
                setApiKey(storedApiKey);
                setIsApiKeySet(true);
            }
            if (storedModel) setSelectedModel(storedModel);
            if (storedTemp) setTemperature(parseFloat(storedTemp));
            if (storedMaxTokens) setMaxTokens(parseInt(storedMaxTokens));
            if (storedSystemPrompt) setSystemPrompt(storedSystemPrompt);
            if (storedHistory) setChatHistory(JSON.parse(storedHistory));
            if (storedRole) setUserRole(storedRole);
            if (storedUserId) setUserId(storedUserId);
            if (storedUserName) setUserName(storedUserName);

            // Set auth tokens and sync with API clients
            setAuthToken(storedToken);
            setRefreshToken(storedRefreshToken);
            databaseService.setTokens(storedToken, storedRefreshToken);
            await apiClient.setTokens(storedToken, storedRefreshToken);
            await mobileApi.setTokens(storedToken, storedRefreshToken);

            // Only set isLoggedIn to true if we have a valid auth token
            setIsLoggedIn(storedIsLoggedIn === 'true' && !!storedToken);
        } catch (error) {
            console.error('Error loading stored values:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save API key
    const saveApiKey = useCallback(async (key) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
            setApiKey(key);
            setIsApiKeySet(!!key);
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    }, []);

    // Save selected model
    const saveSelectedModel = useCallback(async (model) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
            setSelectedModel(model);
        } catch (error) {
            console.error('Error saving model:', error);
        }
    }, []);

    // Save temperature
    const saveTemperature = useCallback(async (temp) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TEMPERATURE, temp.toString());
            setTemperature(temp);
        } catch (error) {
            console.error('Error saving temperature:', error);
        }
    }, []);

    // Save max tokens
    const saveMaxTokens = useCallback(async (tokens) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.MAX_TOKENS, tokens.toString());
            setMaxTokens(tokens);
        } catch (error) {
            console.error('Error saving max tokens:', error);
        }
    }, []);

    // Save system prompt
    const saveSystemPrompt = useCallback(async (prompt) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt);
            setSystemPrompt(prompt);
        } catch (error) {
            console.error('Error saving system prompt:', error);
        }
    }, []);

    // Save chat history
    const saveChatHistory = useCallback(async (history) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
            setChatHistory(history);
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }, []);

    // Save user role
    const saveUserRole = useCallback(async (role) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
            setUserRole(role);
        } catch (error) {
            console.error('Error saving user role:', error);
        }
    }, []);

    // Save user ID
    const saveUserId = useCallback(async (id) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);
            setUserId(id);
        } catch (error) {
            console.error('Error saving user ID:', error);
        }
    }, []);

    // Save user name
    const saveUserName = useCallback(async (name) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
            setUserName(name);
        } catch (error) {
            console.error('Error saving user name:', error);
        }
    }, []);

    // Save auth tokens
    const saveAuthTokens = useCallback(async (token, refresh, loggedIn = true) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
            await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, loggedIn.toString());
            setAuthToken(token);
            setRefreshToken(refresh);
            setIsLoggedIn(loggedIn);
            setNeedsReLogin(false); // Clear any auth failure state on new login
            // Sync tokens with all API clients
            databaseService.setTokens(token, refresh);
            await apiClient.setTokens(token, refresh);
        } catch (error) {
            console.error('Error saving auth tokens:', error);
        }
    }, []);

    // Update auth token (used after token refresh)
    const updateAuthToken = useCallback(async (newToken) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
            setAuthToken(newToken);
        } catch (error) {
            console.error('Error updating auth token:', error);
        }
    }, []);

    // Perform the actual logout (internal helper)
    const performLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.IS_LOGGED_IN,
                STORAGE_KEYS.USER_ID,
                STORAGE_KEYS.USER_NAME,
                STORAGE_KEYS.USER_ROLE,
            ]);
            setAuthToken(null);
            setRefreshToken(null);
            setIsLoggedIn(false);
            setNeedsReLogin(false);
            setUserId(null);
            setUserName('');
            setUserRole(USER_ROLES.WOMAN);
            // Clear tokens from all API clients
            databaseService.clearTokens();
            await apiClient.clearTokens();
        } catch (error) {
            console.error('Error in performLogout:', error);
        }
    };

    // Logout - standard logout that clears the force logout flag
    const logout = useCallback(async () => {
        try {
            // Get session data before clearing
            const sessionData = await getSessionData();

            // Clear the force logout flag
            await clearForceLogoutFlag();

            // Try to record logout session on server (non-blocking)
            // Don't fail logout if this fails
            try {
                await databaseService.recordSession({
                    userId: userId,
                    action: 'logout',
                    ...sessionData,
                });
            } catch (sessionError) {
                console.log('Failed to record logout session:', sessionError.message);
            }

            // Try to call logout API (non-blocking, don't fail if it fails)
            // This will invalidate the token on the server
            try {
                await databaseService.logout(userId);
            } catch (logoutError) {
                console.log('Logout API call failed:', logoutError.message);
            }

            await performLogout();
        } catch (error) {
            console.error('Error logging out:', error);
            // Still perform logout even if everything else fails
            await performLogout();
        }
    }, [userId]);

    // Force logout - clears everything and optionally sets the force logout flag
    const forceLogout = useCallback(async (setFlag = false) => {
        try {
            if (setFlag) {
                // Set the force logout flag before clearing everything
                // This ensures any session attempting to restore will be logged out
                await AsyncStorage.setItem(STORAGE_KEYS.FORCE_LOGOUT, 'true');
            }

            await performLogout();

            // Clear the flag after logout if we set it
            if (setFlag) {
                await AsyncStorage.removeItem(STORAGE_KEYS.FORCE_LOGOUT);
                setIsForcedLogout(false);
            }
        } catch (error) {
            console.error('Error in force logout:', error);
        }
    }, []);

    // Set force logout flag (for external triggers like server-side logout)
    const setForceLogoutFlag = useCallback(async (reason = 'logout') => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.FORCE_LOGOUT, 'true');
            await AsyncStorage.setItem(STORAGE_KEYS.FORCE_LOGOUT_REASON, reason);
            setIsForcedLogout(true);
            // Immediately perform logout
            await performLogout();
        } catch (error) {
            console.error('Error setting force logout flag:', error);
        }
    }, []);

    // Clear force logout flag (called after handling)
    const clearForceLogoutFlag = useCallback(async () => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.FORCE_LOGOUT,
                STORAGE_KEYS.FORCE_LOGOUT_REASON
            ]);
            setIsForcedLogout(false);
        } catch (error) {
            console.error('Error clearing force logout flag:', error);
        }
    }, []);

    // Check if user should be logged out due to missing token
    const checkTokenValidity = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (!token) {
                console.log('Token check: No token found, forcing logout');
                await performLogout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking token validity:', error);
            return false;
        }
    }, []);

    // Clear needs re-login flag (called after successful login)
    const clearNeedsReLogin = useCallback(() => {
        setNeedsReLogin(false);
    }, []);

    // Handle auth failure (called by API client when refresh token is invalid)
    const handleAuthFailure = useCallback(async () => {
        try {
            // Clear all user-related data from storage
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.IS_LOGGED_IN,
                STORAGE_KEYS.USER_ID,
                STORAGE_KEYS.USER_NAME,
                STORAGE_KEYS.CHAT_HISTORY,
            ]);
            
            // Clear all state
            setAuthToken(null);
            setRefreshToken(null);
            setIsLoggedIn(false);
            setNeedsReLogin(true);
            setUserId(null);
            setUserName('');
            setChatHistory([]);
            
            // Clear tokens from API clients
            databaseService.clearTokens();
            await apiClient.clearTokens();
            
            console.log('Auth failure handled: All user data cleared');
        } catch (error) {
            console.error('Error handling auth failure:', error);
        }
    }, []);

    // Add message to chat
    const addMessage = useCallback((role, content) => {
        const newHistory = [...chatHistory, { role, content, timestamp: Date.now() }];
        saveChatHistory(newHistory);
    }, [chatHistory, saveChatHistory]);

    // Clear chat history
    const clearChatHistory = useCallback(() => {
        saveChatHistory([]);
    }, [saveChatHistory]);

    const value = {
        // State
        apiKey,
        selectedModel,
        temperature,
        maxTokens,
        systemPrompt,
        chatHistory,
        isLoading,
        isApiKeySet,
        userRole,
        userId,
        userName,
        authToken,
        isLoggedIn,
        needsReLogin,
        isForcedLogout,
        dependents,
        guardians,

        // Actions
        saveApiKey,
        saveSelectedModel,
        saveTemperature,
        saveMaxTokens,
        saveSystemPrompt,
        saveChatHistory,
        addMessage,
        clearChatHistory,
        saveUserRole,
        saveUserId,
        saveUserName,
        saveAuthTokens,
        updateAuthToken,
        logout,
        forceLogout,
        setForceLogoutFlag,
        clearForceLogoutFlag,
        checkTokenValidity,
        clearNeedsReLogin,

        // Constants
        AVAILABLE_MODELS,
        SYSTEM_PROMPTS,
        USER_ROLES,
        ROLE_NAMES,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppContext;
