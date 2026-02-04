import { OpenAI } from 'openai';

export interface AIClientOptions {
    apiKey?: string;
    baseURL?: string;
    maxRetries?: number;
}

export class AIClient {
    private client: OpenAI;
    private provider: 'groq' | 'openai';

    constructor(provider: 'groq' | 'openai' = 'groq', options: AIClientOptions = {}) {
        this.provider = provider;
        const apiKey = options.apiKey ||
            (provider === 'groq' ? Deno.env.get('GROQ_API_KEY') : Deno.env.get('OPENAI_API_KEY'));

        if (!apiKey) {
            throw new Error(`Missing API key for ${provider}`);
        }

        const baseURL = options.baseURL ||
            (provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined);

        this.client = new OpenAI({
            apiKey,
            baseURL,
            maxRetries: options.maxRetries || 3,
        });
    }

    async generate(prompt: string, model?: string, systemContext?: string): Promise<string> {
        const defaultModel = this.provider === 'groq' ? 'llama3-70b-8192' : 'gpt-4o';

        try {
            const response = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemContext || 'You are a helpful AI assistant.' },
                    { role: 'user', content: prompt }
                ],
                model: model || defaultModel,
                temperature: 0.5,
            });

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error(`AI Generation Error (${this.provider}):`, error);
            throw error;
        }
    }

    async generateJSON<T>(prompt: string, model?: string, systemContext?: string): Promise<T> {
        const jsonPrompt = `${prompt}\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no explanations.`;

        try {
            const result = await this.generate(jsonPrompt, model, systemContext || 'You are a JSON generator.');
            // Clean up potential markdown code blocks
            const cleaned = result.replace(/^```json\n|\n```$/g, '').trim();
            return JSON.parse(cleaned) as T;
        } catch (error) {
            console.error('JSON Parse Error:', error);
            throw new Error('Failed to generate valid JSON');
        }
    }
}
