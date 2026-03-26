import { API_CONFIG, ENDPOINTS } from './endpoints';
import { apiClient } from './client';

class MobileApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  get token() { return apiClient.token; }
  get refreshToken() { return apiClient.refreshToken; }
  get isRefreshing() { return apiClient.isRefreshing; }
  get refreshPromise() { return apiClient.refreshPromise; }

  async initialize() {
    return apiClient.initialize();
  }

  async setTokens(authToken, refreshToken) {
    return apiClient.setTokens(authToken, refreshToken);
  }

  async clearTokens() {
    return apiClient.clearTokens();
  }

  setTokenUpdateCallback(callback) {
    apiClient.setTokenUpdateCallback(callback);
  }

  setAuthFailureCallback(callback) {
    apiClient.setAuthFailureCallback(callback);
  }

  async request(endpoint, options = {}) {
    return apiClient.request(endpoint, options);
  }

  async handleResponse(response) {
    return apiClient.handleResponse(response);
  }

  async refreshAccessToken() {
    return apiClient.refreshAccessToken();
  }

  async triggerAuthFailure() {
    return apiClient.triggerAuthFailure();
  }

  get(endpoint, options = {}) {
    return apiClient.get(endpoint, options);
  }

  post(endpoint, body, options = {}) {
    return apiClient.post(endpoint, body, options);
  }

  put(endpoint, body, options = {}) {
    return apiClient.put(endpoint, body, options);
  }

  delete(endpoint, options = {}) {
    return apiClient.delete(endpoint, options);
  }
}

export const mobileApi = new MobileApiService();
export { apiClient, ENDPOINTS, API_CONFIG };
export default mobileApi;
