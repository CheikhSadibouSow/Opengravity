import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '../config/env.js';

export const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
});

const _openrouterProvider = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY || '',
  headers: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "OpenGravity Agent"
  }
});

// Utilisation du provider officiel OpenRouter pour résoudre les erreurs
export const openrouter = (model: string) => _openrouterProvider.chat(model);

