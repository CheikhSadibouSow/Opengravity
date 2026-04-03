import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  TELEGRAM_ALLOWED_USER_IDS: z.string().min(1, "Allowed user IDs are required")
    .transform((str) => str.split(',').map((id) => parseInt(id.trim(), 10)).filter(id => !isNaN(id))),
  GROQ_API_KEY: z.string().min(1, "Groq API key is required"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.1-8b-instruct:free"),
  DB_PATH: z.string().default("./memory.db"),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
