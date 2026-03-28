// Workshop Service
// Handles AI Safety Workshop progress tracking and leaderboard

import { mobileApi, ENDPOINTS } from './api/mobileApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    USER_AGE: '@workshop_user_age',
    COMPLETED_SCENARIOS: '@workshop_completed',
    LEARNING_PATH: '@workshop_learning_path',
    STREAK: '@workshop_streak',
    LAST_COMPLETION: '@workshop_last_completion',
    ACHIEVEMENTS: '@workshop_achievements',
};

class WorkshopService {
    async getWorkshopProgress(userId) {
        return mobileApi.get(ENDPOINTS.workshop.progress(userId));
    }

    async saveWorkshopProgress(progressData) {
        return mobileApi.post(ENDPOINTS.workshop.progress, progressData);
    }

    async getLeaderboard(params = {}) {
        return mobileApi.get(ENDPOINTS.workshop.leaderboard, params);
    }

    async getUserAchievements(userId) {
        return mobileApi.get(ENDPOINTS.workshop.achievements(userId));
    }

    async getCategories() {
        return mobileApi.get(ENDPOINTS.workshop.categories);
    }

    async getWorkshopTips() {
        return mobileApi.get(ENDPOINTS.workshop.tips);
    }

    // Local storage methods for offline support
    async getLocalProgress() {
        try {
            const completed = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_SCENARIOS);
            return completed ? JSON.parse(completed) : {};
        } catch (error) {
            console.error('Error getting local progress:', error);
            return {};
        }
    }

    async saveLocalProgress(categoryId, scenarioId) {
        try {
            const completed = await this.getLocalProgress();
            if (!completed[categoryId]) {
                completed[categoryId] = [];
            }
            if (!completed[categoryId].includes(scenarioId)) {
                completed[categoryId].push(scenarioId);
                await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_SCENARIOS, JSON.stringify(completed));
            }
            return completed;
        } catch (error) {
            console.error('Error saving local progress:', error);
            return {};
        }
    }

    async getLocalStreak() {
        try {
            const streak = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
            const lastCompletion = await AsyncStorage.getItem(STORAGE_KEYS.LAST_COMPLETION);
            
            const today = new Date().toDateString();
            if (lastCompletion === today) {
                return { streak: parseInt(streak || '0'), lastCompletion: today };
            }
            
            // Check if yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastCompletion === yesterday.toDateString()) {
                return { streak: parseInt(streak || '0'), lastCompletion: lastCompletion };
            }
            
            // Streak broken
            return { streak: 0, lastCompletion: null };
        } catch (error) {
            console.error('Error getting local streak:', error);
            return { streak: 0, lastCompletion: null };
        }
    }

    async updateLocalStreak() {
        try {
            const { streak, lastCompletion } = await this.getLocalStreak();
            const today = new Date().toDateString();
            
            let newStreak = streak;
            if (lastCompletion !== today) {
                newStreak = streak + 1;
            }
            
            await AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_COMPLETION, today);
            
            return newStreak;
        } catch (error) {
            console.error('Error updating local streak:', error);
            return 0;
        }
    }

    async getLocalAchievements() {
        try {
            const achievements = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            return achievements ? JSON.parse(achievements) : [];
        } catch (error) {
            console.error('Error getting local achievements:', error);
            return [];
        }
    }

    async unlockAchievement(achievementId) {
        try {
            const achievements = await this.getLocalAchievements();
            if (!achievements.includes(achievementId)) {
                achievements.push(achievementId);
                await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
            }
            return achievements;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return [];
        }
    }

    async getUserAge() {
        try {
            const age = await AsyncStorage.getItem(STORAGE_KEYS.USER_AGE);
            return age ? parseInt(age) : null;
        } catch (error) {
            console.error('Error getting user age:', error);
            return null;
        }
    }

    async saveUserAge(age) {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_AGE, age.toString());
            return true;
        } catch (error) {
            console.error('Error saving user age:', error);
            return false;
        }
    }

    // Calculate and sync progress with server
    async syncProgress(userId) {
        try {
            const localProgress = await this.getLocalProgress();
            const localStreak = await this.getLocalStreak();
            const achievements = await this.getLocalAchievements();

            // Send to server
            const response = await this.saveWorkshopProgress({
                user_id: userId,
                completed_scenarios: localProgress,
                streak: localStreak.streak,
                achievements: achievements,
                synced_at: new Date().toISOString(),
            });

            return response;
        } catch (error) {
            console.error('Error syncing progress:', error);
            return { success: false, error: error.message };
        }
    }

    // Check and unlock achievements
    async checkAchievements(completedCount, categoriesCompleted) {
        const achievements = [];

        // First Scenario
        if (completedCount >= 1) {
            achievements.push('first_scenario');
        }

        // 5 Scenarios
        if (completedCount >= 5) {
            achievements.push('five_scenarios');
        }

        // 10 Scenarios
        if (completedCount >= 10) {
            achievements.push('ten_scenarios');
        }

        // 25 Scenarios
        if (completedCount >= 25) {
            achievements.push('twenty_five_scenarios');
        }

        // All Categories
        const allCategories = ['harassment', 'self_defense', 'digital_safety', 'workplace', 'public'];
        const hasAllCategories = allCategories.every(cat => 
            categoriesCompleted.includes(cat)
        );
        if (hasAllCategories) {
            achievements.push('all_categories');
        }

        // Save new achievements
        for (const achievement of achievements) {
            await this.unlockAchievement(achievement);
        }

        return achievements;
    }
}

export default new WorkshopService();
