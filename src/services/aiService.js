// AI Service
// Wraps Groq API functionality with a simpler interface for chat

import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatCompletion } from './groqApi';
import settingsService from './settingsService';

// Storage keys (matching AppContext)
const STORAGE_KEYS = {
    SELECTED_MODEL: '@groq_selected_model',
    TEMPERATURE: '@groq_temperature',
    MAX_TOKENS: '@groq_max_tokens',
    SYSTEM_PROMPT: '@groq_system_prompt',
};

// Default values
const DEFAULTS = {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful assistant.',
};

class AIService {
    constructor() {
        this.apiKey = null;
    }

    async getApiKey() {
        if (!this.apiKey) {
            this.apiKey = await settingsService.getGroqApiKey();
        }
        return this.apiKey;
    }

    /**
     * Send a chat message to the AI and get a response
     * @param {string} message - The user's message
     * @returns {Promise<{text: string}>} The AI's response
     */
    async chat(message) {
        try {
            // Get settings from AsyncStorage
            const model = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
            const temperature = await AsyncStorage.getItem(STORAGE_KEYS.TEMPERATURE);
            const maxTokens = await AsyncStorage.getItem(STORAGE_KEYS.MAX_TOKENS);
            const systemPromptId = await AsyncStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);

            const groqApiKey = await this.getApiKey();

            // Check if API key exists
            if (!groqApiKey) {
                throw new Error('Groq API key not found. Please configure your API key in settings.');
            }

            // Build system prompt based on stored preference
            let systemPrompt = DEFAULTS.systemPrompt;
            if (systemPromptId === 'coder') {
                systemPrompt = 'You are an expert programmer. Provide clear, well-commented code examples.';
            } else if (systemPromptId === 'creative') {
                systemPrompt = 'You are a creative writer. Use vivid descriptions and engaging storytelling.';
            } else if (systemPromptId === 'analyst') {
                systemPrompt = 'You are a data analyst. Provide insights and explain patterns clearly.';
            }

            // Prepare messages array
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ];

            // Call Groq API
            const response = await chatCompletion(
                groqApiKey,
                messages,
                model || DEFAULTS.model,
                parseFloat(temperature) || DEFAULTS.temperature,
                parseInt(maxTokens, 10) || DEFAULTS.maxTokens
            );

            return { text: response };
        } catch (error) {
            console.error('AI Service chat error:', error);
            throw error;
        }
    }

    /**
     * Generate a thought/idea based on user prompt
     * @param {string} prompt - The user's prompt/topic
     * @returns {Promise<{thought: string}>} Generated thought
     */
    async generateThought(prompt) {
        try {
            // Get settings from AsyncStorage
            const model = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
            const temperature = await AsyncStorage.getItem(STORAGE_KEYS.TEMPERATURE);
            const maxTokens = await AsyncStorage.getItem(STORAGE_KEYS.MAX_TOKENS);

            const groqApiKey = await this.getApiKey();

            // Check if API key exists
            if (!groqApiKey) {
                throw new Error('Groq API key not found. Please configure your API key in settings.');
            }

            // System prompt for thought generation
            const systemPrompt = `You are an inspirational thought generator. Your purpose is to generate uplifting, motivational, and insightful thoughts, quotes, affirmations, and creative ideas. 

Guidelines:
- Keep thoughts concise but meaningful (50-150 words)
- Be inspiring, positive, and empowering
- Use simple, accessible language
- Focus on themes like: motivation, positivity, creativity, relationships, personal growth, self-care, resilience
- Provide actionable insights when appropriate
- End with an uplifting message or question for reflection`;

            // Prepare messages array
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ];

            // Call Groq API
            const response = await chatCompletion(
                groqApiKey,
                messages,
                model || DEFAULTS.model,
                parseFloat(temperature) || 0.8, // Higher temperature for more creative output
                parseInt(maxTokens, 10) || DEFAULTS.maxTokens
            );

            return { thought: response };
        } catch (error) {
            console.error('AI Service generateThought error:', error);
            throw error;
        }
    }

    /**
     * Analyze an image using Groq API with vision capability
     * @param {string} base64Image - Base64 encoded image data
     * @returns {Promise<{analysis: string}>} Image analysis result
     */
    async analyzeImage(base64Image) {
        try {
            const groqApiKey = await this.getApiKey();

            // Check if API key exists
            if (!groqApiKey) {
                throw new Error('Groq API key not found. Please configure your API key in settings.');
            }

            // Use Groq's vision-capable model
            const model = 'meta-llama/llama-4-scout-17b-16e-instruct';

            // Prepare the request
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analyze this image and provide a detailed description of what you see. Include details about objects, people, setting, colors, and any notable features.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 1024,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            const analysis = data.choices?.[0]?.message?.content || 'No analysis available';

            return { analysis };
        } catch (error) {
            console.error('AI Service analyzeImage error:', error);
            throw error;
        }
    }

    /**
     * Check if the AI service is configured (has API key)
     * @returns {Promise<boolean>}
     */
    async isConfigured() {
        try {
            const key = await this.getApiKey();
            return !!key && key.length > 0;
        } catch (error) {
            return false;
        }
    }
}

export default new AIService();
