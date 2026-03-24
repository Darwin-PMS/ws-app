// Auth Service
// API calls for authentication

import { mobileApi, ENDPOINTS } from './api/mobileApi';

class AuthService {
    setTokenUpdateCallback(callback) {
        mobileApi.setTokenUpdateCallback(callback);
    }

    async register(userData) {
        return mobileApi.post(ENDPOINTS.auth.register, userData);
    }

    async login(credentials) {
        return mobileApi.post(ENDPOINTS.auth.login, credentials);
    }

    async logout(userId) {
        return mobileApi.post(ENDPOINTS.auth.logout, { userId });
    }

    async verifyToken() {
        return mobileApi.get(ENDPOINTS.auth.login, { skipAuth: true });
    }

    async biometricLogin(credentials) {
        return mobileApi.post(ENDPOINTS.auth.biometricLogin, credentials);
    }

    async changePassword(currentPassword, newPassword) {
        return mobileApi.post(ENDPOINTS.auth.changePassword, { currentPassword, newPassword });
    }

    async forgotPassword(email) {
        return mobileApi.post(ENDPOINTS.auth.forgotPassword, { email });
    }

    async resetPassword(token, newPassword) {
        return mobileApi.post(ENDPOINTS.auth.resetPassword, { token, newPassword });
    }

    async forceLogout(userId) {
        return mobileApi.post(ENDPOINTS.auth.forceLogout(userId));
    }

    async setTokens(authToken, refreshToken) {
        return mobileApi.setTokens(authToken, refreshToken);
    }

    async clearTokens() {
        return mobileApi.clearTokens();
    }

    async initialize() {
        return mobileApi.initialize();
    }
}

export default new AuthService();
