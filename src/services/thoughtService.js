// Thought Service - Additional thought generation and translation functions

const BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Translate a thought to another language
 * @param {string} apiKey - Groq API key
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 */
export const translateThought = async (
    apiKey,
    text,
    targetLanguage = 'es'
) => {
    const languageNames = {
        en: 'English',
        hi: 'Hindi',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese'
    };

    const langName = languageNames[targetLanguage] || targetLanguage;

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
                        content: `Translate the following thought/quote to ${langName}. Keep the meaning and emotional impact. Only return the translated text, nothing else.\n\n${text}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
};

export default {
    translateThought,
};
