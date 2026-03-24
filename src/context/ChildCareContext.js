// Child Care Context - Global state management for child care features
// Provides tips, chat, children, and tracker data across the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import childCareService from '../services/childCareService';

// Create context
const ChildCareContext = createContext(null);

// Default categories
const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps', count: 0 },
    { id: 'health', name: 'Health', icon: 'medkit', count: 0 },
    { id: 'nutrition', name: 'Nutrition', icon: 'nutrition', count: 0 },
    { id: 'safety', name: 'Safety', icon: 'shield-checkmark', count: 0 },
    { id: 'development', name: 'Development', icon: 'trending-up', count: 0 },
    { id: 'education', name: 'Education', icon: 'school', count: 0 },
];

// Default tips (fallback data)
const DEFAULT_TIPS = [
    {
        id: '1',
        category: 'health',
        title: 'Regular Check-ups',
        content: 'Schedule regular pediatric visits at 2, 4, 6, 9, 12, 15, 18, and 24 months, then annually.',
        icon: 'calendar',
    },
    {
        id: '2',
        category: 'health',
        title: 'Vaccination Schedule',
        content: 'Follow the recommended immunization schedule to protect your child from preventable diseases.',
        icon: 'medkit-outline',
    },
    {
        id: '3',
        category: 'nutrition',
        title: 'Breastfeeding',
        content: 'Breast milk is the best nutrition for infants. Feed on demand for the first 6 months.',
        icon: 'heart',
    },
    {
        id: '4',
        category: 'nutrition',
        title: 'Solid Foods',
        content: 'Introduce solid foods at 6 months. Start with single-ingredient purees and gradually diversify.',
        icon: 'restaurant',
    },
    {
        id: '5',
        category: 'safety',
        title: 'Car Safety',
        content: 'Always use age-appropriate car seats. Rear-facing seats until age 2, then forward-facing.',
        icon: 'car',
    },
    {
        id: '6',
        category: 'safety',
        title: 'Home Safety',
        content: 'Install safety gates, outlet covers, and secure heavy furniture to prevent accidents.',
        icon: 'home',
    },
    {
        id: '7',
        category: 'development',
        title: 'Play Time',
        content: 'Engage in interactive play to support motor skills, language development, and emotional bonding.',
        icon: 'game-controller',
    },
    {
        id: '8',
        category: 'development',
        title: 'Reading Aloud',
        content: 'Start reading to your baby from birth. It builds language skills and creates bonding moments.',
        icon: 'book',
    },
    {
        id: '9',
        category: 'education',
        title: 'Screen Time',
        content: 'Limit screen time to 1 hour per day of high-quality programming for ages 2-5 years.',
        icon: 'tv',
    },
    {
        id: '10',
        category: 'education',
        title: 'Social Skills',
        content: 'Encourage playdates and group activities to develop social skills and emotional intelligence.',
        icon: 'people',
    },
];

// Default chat messages
const DEFAULT_CHAT_MESSAGES = [
    {
        id: 'welcome',
        role: 'assistant',
        text: "Hello! I'm your child care assistant. Ask me anything about child care, health, development, or safety."
    }
];

// Quick actions
const QUICK_ACTIONS = [
    { id: '1', title: 'Growth Tracker', icon: 'speedometer', route: 'GrowthTracker' },
    { id: '2', title: 'Vaccine Reminder', icon: 'notifications', route: 'VaccineReminder' },
    { id: '3', title: 'Feeding Log', icon: 'journal', route: 'FeedingLog' },
    { id: '4', title: 'Sleep Tracker', icon: 'moon', route: 'SleepTracker' },
];

export function ChildCareProvider({ children }) {
    const { userId, authToken, refreshToken } = useApp();

    // Tips state
    const [tips, setTips] = useState(DEFAULT_TIPS);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [tipsLoading, setTipsLoading] = useState(false);
    const [tipsError, setTipsError] = useState(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState(DEFAULT_CHAT_MESSAGES);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [conversationId, setConversationId] = useState(null);

    // Children state
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childrenLoading, setChildrenLoading] = useState(false);

    // Trackers state
    const [growthLogs, setGrowthLogs] = useState([]);
    const [feedingLogs, setFeedingLogs] = useState([]);
    const [sleepLogs, setSleepLogs] = useState([]);
    const [trackersLoading, setTrackersLoading] = useState(false);

    // Set tokens when auth changes
    useEffect(() => {
        if (authToken && refreshToken) {
            childCareService.setTokens?.(authToken, refreshToken);
        }
    }, [authToken, refreshToken]);

    // Load tips on mount - only when userId is available
    useEffect(() => {
        if (userId) {
            loadTips();
            loadChatHistory();
            loadChildren();
        }
    }, [userId]);

    // Filter tips based on selected category
    const filteredTips = selectedCategory === 'all'
        ? tips
        : tips.filter(tip => tip.category === selectedCategory);

    // Load tips from API
    const loadTips = useCallback(async () => {
        setTipsLoading(true);
        setTipsError(null);

        try {
            const response = await childCareService.getTips();
            if (response.success) {
                setTips(response.tips || DEFAULT_TIPS);
                setCategories(response.categories || DEFAULT_CATEGORIES);
            }
        } catch (error) {
            console.log('Failed to load tips, using defaults:', error);
            setTipsError('Using offline tips');
        } finally {
            setTipsLoading(false);
        }
    }, []);

    // Load chat history from local storage
    const loadChatHistory = useCallback(async () => {
        try {
            const history = await childCareService.getChatHistory();
            if (history && history.length > 0) {
                setChatMessages(history);
            }
        } catch (error) {
            console.log('Failed to load chat history:', error);
        }
    }, []);

    // Save chat message and get AI response
    const sendChatMessage = useCallback(async (message) => {
        if (!message.trim()) return;

        // Add user message
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: message,
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatLoading(true);

        try {
            // Try API first
            const response = await childCareService.sendMessage(conversationId, message, {
                child_age_months: selectedChild?.age_months
            });

            if (response.success && response.message) {
                const assistantMsg = {
                    id: response.message.id || (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: response.message.content,
                    timestamp: response.message.timestamp || new Date().toISOString(),
                    suggestedActions: response.message.suggested_actions
                };

                setChatMessages(prev => [...prev, assistantMsg]);

                // Save to local storage
                const updatedHistory = [...chatMessages, userMsg, assistantMsg];
                await childCareService.saveChatHistory(updatedHistory);

                // Update conversation ID
                if (response.message.conversation_id) {
                    setConversationId(response.message.conversation_id);
                }
            }
        } catch (error) {
            console.log('API failed, using local response:', error);
            // Fallback to local keyword matching
            const localResponse = getLocalResponse(message);
            const assistantMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: localResponse,
                timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, assistantMsg]);

            // Save locally
            const updatedHistory = [...chatMessages, userMsg, assistantMsg];
            await childCareService.saveChatHistory(updatedHistory);
        } finally {
            setChatLoading(false);
        }
    }, [conversationId, selectedChild, chatMessages]);

    // Local keyword matching for offline fallback
    const getLocalResponse = (message) => {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('feed') || lowerMsg.includes('food') || lowerMsg.includes('eat')) {
            return 'For feeding guidance: newborns need 8-12 feeds daily. At 6 months, introduce solid foods one at a time waiting 3-5 days between new foods. Avoid honey before age 1.';
        } else if (lowerMsg.includes('sleep')) {
            return 'Sleep recommendations: newborns 14-17 hours, infants 12-15 hours, toddlers 11-14 hours. Establish a consistent bedtime routine early.';
        } else if (lowerMsg.includes('fever') || lowerMsg.includes('temperature')) {
            return 'For fever: Contact your pediatrician for infants under 3 months. For older children, use acetaminophen after 6 months or ibuprofen after 6 months. Keep the child hydrated.';
        } else if (lowerMsg.includes('vaccin') || lowerMsg.includes('inject')) {
            return 'Recommended vaccines: Hepatitis B (birth), DTaP, IPV, Hib, PCV13, Rotavirus at 2, 4, 6 months. Consult your pediatrician for the full schedule.';
        } else if (lowerMsg.includes('development') || lowerMsg.includes('milestone')) {
            return 'Key milestones: smiles at 2 months, rolls over at 4 months, sits at 6 months, crawls at 9 months, walks at 12 months. Every child develops at their own pace.';
        } else {
            return 'I recommend consulting your pediatrician for specific concerns. For general guidance, our tips cover health, nutrition, safety, development, and education topics. What specific area would you like to know more about?';
        }
    };

    // Clear chat history
    const clearChatHistory = useCallback(async () => {
        setChatMessages(DEFAULT_CHAT_MESSAGES);
        setConversationId(null);
        await childCareService.saveChatHistory([]);
    }, []);

    // Load children
    const loadChildren = useCallback(async () => {
        if (!userId) return;

        setChildrenLoading(true);
        try {
            const response = await childCareService.getChildren();
            if (response.success) {
                setChildrenList(response.children || []);
                if (response.children?.length > 0 && !selectedChild) {
                    setSelectedChild(response.children[0]);
                }
            }
        } catch (error) {
            console.log('Failed to load children:', error);
        } finally {
            setChildrenLoading(false);
        }
    }, [userId, selectedChild]);

    // Add child
    const addChild = useCallback(async (childData) => {
        try {
            const response = await childCareService.addChild(childData);
            if (response.success) {
                await loadChildren();
                return { success: true, child: response.child };
            }
            return response;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [loadChildren]);

    // Log growth entry
    const logGrowth = useCallback(async (entry) => {
        if (!selectedChild) return { success: false, error: 'No child selected' };

        try {
            const response = await childCareService.logGrowth(selectedChild.id, entry);
            if (response.success) {
                await loadGrowthLogs();
            }
            return response;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [selectedChild]);

    // Load growth logs
    const loadGrowthLogs = useCallback(async () => {
        if (!selectedChild) return;

        setTrackersLoading(true);
        try {
            const response = await childCareService.getGrowthLogs(selectedChild.id);
            if (response.success) {
                setGrowthLogs(response.logs || []);
            }
        } catch (error) {
            console.log('Failed to load growth logs:', error);
        } finally {
            setTrackersLoading(false);
        }
    }, [selectedChild]);

    // Log feeding entry
    const logFeeding = useCallback(async (entry) => {
        if (!selectedChild) return { success: false, error: 'No child selected' };

        try {
            const response = await childCareService.logFeeding(selectedChild.id, entry);
            if (response.success) {
                await loadFeedingLogs();
            }
            return response;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [selectedChild]);

    // Load feeding logs
    const loadFeedingLogs = useCallback(async () => {
        if (!selectedChild) return;

        setTrackersLoading(true);
        try {
            const response = await childCareService.getFeedingLogs(selectedChild.id);
            if (response.success) {
                setFeedingLogs(response.logs || []);
            }
        } catch (error) {
            console.log('Failed to load feeding logs:', error);
        } finally {
            setTrackersLoading(false);
        }
    }, [selectedChild]);

    // Log sleep entry
    const logSleep = useCallback(async (entry) => {
        if (!selectedChild) return { success: false, error: 'No child selected' };

        try {
            const response = await childCareService.logSleep(selectedChild.id, entry);
            if (response.success) {
                await loadSleepLogs();
            }
            return response;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [selectedChild]);

    // Load sleep logs
    const loadSleepLogs = useCallback(async () => {
        if (!selectedChild) return;

        setTrackersLoading(true);
        try {
            const response = await childCareService.getSleepLogs(selectedChild.id);
            if (response.success) {
                setSleepLogs(response.logs || []);
            }
        } catch (error) {
            console.log('Failed to load sleep logs:', error);
        } finally {
            setTrackersLoading(false);
        }
    }, [selectedChild]);

    // Refresh all data
    const refreshAll = useCallback(async () => {
        await Promise.all([
            loadTips(),
            loadChatHistory(),
            loadChildren(),
            loadGrowthLogs(),
            loadFeedingLogs(),
            loadSleepLogs()
        ]);
    }, [loadTips, loadChatHistory, loadChildren, loadGrowthLogs, loadFeedingLogs, loadSleepLogs]);

    // Context value
    const value = {
        // Tips
        tips,
        categories,
        selectedCategory,
        setSelectedCategory,
        filteredTips,
        tipsLoading,
        tipsError,
        loadTips,

        // Chat
        chatMessages,
        chatLoading,
        chatError,
        sendChatMessage,
        clearChatHistory,

        // Children
        children: childrenList,
        selectedChild,
        setSelectedChild,
        childrenLoading,
        loadChildren,
        addChild,

        // Trackers
        growthLogs,
        feedingLogs,
        sleepLogs,
        trackersLoading,
        logGrowth,
        logFeeding,
        logSleep,
        loadGrowthLogs,
        loadFeedingLogs,
        loadSleepLogs,

        // Quick actions
        quickActions: QUICK_ACTIONS,

        // General
        refreshAll
    };

    return (
        <ChildCareContext.Provider value={value}>
            {children}
        </ChildCareContext.Provider>
    );
}

// Custom hook to use child care context
export function useChildCare() {
    const context = useContext(ChildCareContext);
    if (!context) {
        throw new Error('useChildCare must be used within a ChildCareProvider');
    }
    return context;
}

export default ChildCareContext;
