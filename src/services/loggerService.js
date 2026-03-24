// App Error Logging Service
// Saves all errors to local storage for debugging

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Constants } from 'react-native';

const LOG_STORAGE_KEY = '@app_error_logs';
const MAX_LOGS = 100; // Keep last 100 logs

class AppLogger {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        console.log('App Logger Initialized');
        return this;
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    getDeviceInfo() {
        return {
            platform: Platform.OS,
            version: Platform.Version,
            appVersion: Constants?.manifest?.version || '1.0.0',
        };
    }

    createLogEntry(level, source, message, data = null, error = null) {
        const entry = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: this.getTimestamp(),
            level: level, // 'error' | 'warning' | 'info' | 'debug'
            source: source, // 'api' | 'auth' | 'sos' | 'ui' | 'system'
            message: message,
            data: data,
            deviceInfo: this.getDeviceInfo(),
        };

        if (error) {
            entry.error = {
                name: error.name || 'Error',
                message: error.message || String(error),
                stack: error.stack || null,
            };
        }

        return entry;
    }

    async saveLog(entry) {
        try {
            const existingLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            let logs = existingLogs ? JSON.parse(existingLogs) : [];
            
            logs.unshift(entry); // Add to beginning
            
            // Keep only last MAX_LOGS
            if (logs.length > MAX_LOGS) {
                logs = logs.slice(0, MAX_LOGS);
            }
            
            await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save log:', error);
        }
    }

    // Main error logging method
    async log(level, source, message, data = null, error = null) {
        const entry = this.createLogEntry(level, source, message, data, error);
        
        // Console output
        const consoleMsg = `[${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
        if (level === 'error') {
            console.error(consoleMsg, error || '');
        } else if (level === 'warning') {
            console.warn(consoleMsg, data || '');
        } else {
            console.log(consoleMsg, data || '');
        }

        // Save to storage
        await this.saveLog(entry);

        return entry;
    }

    // Convenience methods
    async error(source, message, data = null, error = null) {
        return this.log('error', source, message, data, error);
    }

    async warning(source, message, data = null) {
        return this.log('warning', source, message, data);
    }

    async info(source, message, data = null) {
        return this.log('info', source, message, data);
    }

    async debug(source, message, data = null) {
        return this.log('debug', source, message, data);
    }

    // API error logging
    async logApiError(endpoint, method, status, error, requestData = null) {
        return this.error('api', `API Error: ${status}`, {
            endpoint,
            method,
            status,
            requestData,
        }, error);
    }

    // Auth error logging
    async logAuthError(action, error, userId = null) {
        return this.error('auth', `Auth Error: ${action}`, {
            action,
            userId,
        }, error);
    }

    // Get all logs
    async getLogs(limit = 50, level = null) {
        try {
            const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            let logs = logsJson ? JSON.parse(logsJson) : [];
            
            if (level) {
                logs = logs.filter(log => log.level === level);
            }
            
            return logs.slice(0, limit);
        } catch (error) {
            console.error('Failed to get logs:', error);
            return [];
        }
    }

    // Get error logs only
    async getErrorLogs(limit = 50) {
        return this.getLogs(limit, 'error');
    }

    // Clear all logs
    async clearLogs() {
        try {
            await AsyncStorage.removeItem(LOG_STORAGE_KEY);
            console.log('Logs cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear logs:', error);
            return false;
        }
    }

    // Export logs as string
    async exportLogs() {
        try {
            const logs = await this.getLogs(MAX_LOGS);
            return JSON.stringify(logs, null, 2);
        } catch (error) {
            return '[]';
        }
    }

    // Get logs by source
    async getLogsBySource(source, limit = 50) {
        try {
            const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            const logs = logsJson ? JSON.parse(logsJson) : [];
            const filtered = logs.filter(log => log.source === source);
            return filtered.slice(0, limit);
        } catch (error) {
            return [];
        }
    }
}

export default new AppLogger();
