// Groq API Service
// All API calls use https://api.groq.com/openai/v1/ base URL
// No Groq SDK — direct REST calls for React Native compatibility

import { Buffer } from 'buffer';

// Polyfill TextDecoder for React Native
if (!global.TextDecoder) {
    try {
        const util = require('util');
        global.TextDecoder = util.TextDecoder;
    } catch (e) {
        // Fallback: simple text decoder
        global.TextDecoder = class TextDecoder {
            constructor(encoding = 'utf-8') {
                this.encoding = encoding;
            }
            decode(data) {
                if (data instanceof Uint8Array) {
                    let result = '';
                    for (let i = 0; i < data.length; i++) {
                        result += String.fromCharCode(data[i]);
                    }
                    return decodeURIComponent(escape(result));
                }
                return '';
            }
        };
    }
}

const BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Stream chat completion from Groq API
 * Uses non-streaming approach for React Native compatibility
 * @param {string} apiKey - Groq API key
 * @param {Array} messages - Chat messages array [{role, content}]
 * @param {string} model - Model ID (default: llama-3.3-70b-versatile)
 * @param {function} onChunk - Callback for each chunk of streamed response
 * @param {number} temperature - Temperature (0-2)
 * @param {number} maxTokens - Max tokens to generate
 * @returns {Promise<string>} Full response content
 */
export const streamChatCompletion = async (
    apiKey,
    messages,
    model = 'llama-3.3-70b-versatile',
    onChunk,
    temperature = 0.7,
    maxTokens = 2048
) => {
    try {
        // Use non-streaming request for React Native compatibility
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const fullContent = data.choices?.[0]?.message?.content || '';

        // Simulate streaming by sending content in chunks
        if (onChunk && fullContent) {
            const words = fullContent.split(' ');
            let chunkedContent = '';
            for (let i = 0; i < words.length; i++) {
                chunkedContent += (i > 0 ? ' ' : '') + words[i];
                onChunk(chunkedContent);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        return fullContent;
    } catch (error) {
        console.error('Stream chat error:', error);
        throw error;
    }
};

/**
 * Non-streaming chat completion
 */
export const chatCompletion = async (
    apiKey,
    messages,
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 2048
) => {
    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error('Chat completion error:', error);
        throw error;
    }
};

/**
 * Analyze image using Groq vision API
 * @param {string} apiKey - Groq API key
 * @param {string} base64Image - Base64 encoded image
 * @param {string} prompt - Question about the image
 * @param {string} model - Vision model (default: meta-llama/llama-4-scout-17b-16e-instruct)
 */
export const analyzeImage = async (
    apiKey,
    base64Image,
    prompt = "What's in this image?",
    model = 'meta-llama/llama-4-scout-17b-16e-instruct'
) => {
    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error('Image analysis error:', error);
        throw error;
    }
};

/**
 * Transcribe audio using Groq Whisper API
 * @param {string} apiKey - Groq API key
 * @param {string} audioUri - URI of the audio file
 * @param {string} language - Language code (optional, auto-detect if not provided)
 */
export const transcribeAudio = async (apiKey, audioUri, language = null) => {
    try {
        // Create form data for audio file
        const formData = new FormData();
        formData.append('file', {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'audio.m4a',
        });
        formData.append('model', 'whisper-large-v3-turbo');
        if (language) {
            formData.append('language', language);
        }
        formData.append('response_format', 'json');

        const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || '';
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
};

/**
 * Convert text to speech using Groq TTS API
 * @param {string} apiKey - Groq API key
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice to use (troy, hannah, austin, etc.)
 */
export const textToSpeech = async (apiKey, text, voice = 'troy') => {
    try {
        const response = await fetch(`${BASE_URL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'canopylabs/orpheus-v1-english',
                voice: voice || 'troy',
                input: text,
                response_format: 'wav',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        // Convert response to base64
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        );

        return base64;
    } catch (error) {
        console.error('TTS error:', error);
        throw error;
    }
};

/**
 * List available models from Groq API
 */
export const listModels = async (apiKey) => {
    try {
        const response = await fetch(`${BASE_URL}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('List models error:', error);
        throw error;
    }
};

// Available TTS voices
export const TTS_VOICES = [
    { id: 'troy', name: 'Troy', description: 'Male, deep, confident' },
    { id: 'hannah', name: 'Hannah', description: 'Female, warm, friendly' },
    { id: 'austin', name: 'Austin', description: 'Male, casual, youthful' },
    { id: 'jane', name: 'Jane', description: 'Female, professional' },
    { id: 'daniel', name: 'Daniel', description: 'Male, British accent' },
    { id: 'lily', name: 'Lily', description: 'Female, soft, gentle' },
    { id: 'james', name: 'James', description: 'Male, authoritative' },
    { id: 'serena', name: 'Serena', description: 'Female, expressive' },
];

// Language codes for transcription
export const LANGUAGES = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
];

// Thought categories
export const THOUGHT_CATEGORIES = [
    { id: 'motivation', name: 'Motivation', icon: 'flame', color: '#F59E0B' },
    { id: 'education', name: 'Education', icon: 'school', color: '#3B82F6' },
    { id: 'inspiration', name: 'Inspiration', icon: 'bulb', color: '#8B5CF6' },
    { id: 'wisdom', name: 'Wisdom', icon: 'sparkles', color: '#EC4899' },
    { id: 'success', name: 'Success', icon: 'trophy', color: '#10B981' },
    { id: 'life', name: 'Life', icon: 'heart', color: '#EF4444' },
    { id: 'success_mindset', name: 'Mindset', icon: 'fitness', color: '#06B6D4' },
    { id: 'game', name: 'Gaming', icon: 'game-controller', color: '#84CC16' },
    { id: 'funny', name: 'Funny', icon: 'happy', color: '#F97316' },
    { id: 'love', name: 'Love', icon: 'heart-circle', color: '#FF6B6B' },
];

/**
 * Generate a thought/quote based on category using Groq API
 * @param {string} apiKey - Groq API key
 * @param {string} category - Category of thought to generate
 */
export const generateThought = async (
    apiKey,
    category = 'motivation'
) => {
    const categoryPrompts = {
        motivation: 'Generate a motivational quote or thought that is 2-4 lines long. Make it powerful and inspiring. Format it with line breaks between lines. Only return the quote, nothing else.',
        education: 'Generate an educational insight or learning quote that is 2-4 lines long. Make it thought-provoking. Format it with line breaks between lines. Only return the quote, nothing else.',
        inspiration: 'Generate an inspiring thought that is 2-4 lines long. Make it spark creativity and imagination. Format it with line breaks between lines. Only return the quote, nothing else.',
        wisdom: 'Generate a wise saying or proverb that is 2-4 lines long. Make it meaningful and timeless. Format it with line breaks between lines. Only return the quote, nothing else.',
        success: 'Generate a success-focused thought that is 2-4 lines long. Make it about achieving goals and dreams. Format it with line breaks between lines. Only return the quote, nothing else.',
        life: 'Generate a thoughtful quote about life that is 2-4 lines long. Make it about happiness and living fully. Format it with line breaks between lines. Only return the quote, nothing else.',
        success_mindset: 'Generate a mindset quote that is 2-4 lines long. Make it about positive thinking and mental strength. Format it with line breaks between lines. Only return the quote, nothing else.',
        game: 'Generate a gaming-related motivational quote that is 2-4 lines long. Make it about leveling up, achievements, or gaming life. Format it with line breaks between lines. Only return the quote, nothing else.',
        funny: 'Generate a funny, lighthearted thought that is 2-4 lines long. Make it put a smile on faces. Format it with line breaks between lines. Only return the quote, nothing else.',
        love: 'Generate a heartwarming quote about love that is 2-4 lines long. Make it warm and touching. Format it with line breaks between lines. Only return the quote, nothing else.',
    };

    const prompt = categoryPrompts[category] || categoryPrompts.motivation;

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const thought = data.choices?.[0]?.message?.content?.trim() || '';

        // Clean up the thought - remove quotes if present
        return thought.replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('Thought generation error:', error);
        throw error;
    }
};

/**
 * Generate a simple response for any prompt using Groq API
 * @param {string} prompt - User prompt/message
 * @param {string} apiKey - Groq API key (optional, will use default if not provided)
 * @returns {Promise<string>} Generated response
 */
export const generateResponse = async (prompt, apiKey = null) => {
    // If no API key provided, try to get from settings or use a fallback
    // For now, return a default response if no API key
    if (!apiKey) {
        console.warn('No API key provided for generateResponse');
        return null;
    }

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
        console.error('Generate response error:', error);
        throw error;
    }
};

export default {
    streamChatCompletion,
    chatCompletion,
    analyzeImage,
    transcribeAudio,
    textToSpeech,
    listModels,
    TTS_VOICES,
    LANGUAGES,
    THOUGHT_CATEGORIES,
    generateThought,
    generateResponse,
};
