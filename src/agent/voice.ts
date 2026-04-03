import fs from 'fs';
import { env } from '../config/env.js';

/**
 * Transcrit un fichier audio via l'API Groq (Whisper)
 * @param filePath Chemin local vers le fichier audio
 * @returns Le texte transcrit
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'audio/ogg' }); // Telegram voice sont souvent en ogg
    
    formData.append('file', blob, 'audio.ogg');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('language', 'fr'); // Optionnel, mais aide pour le français

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq Transcription Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as { text: string };
    return data.text;
  } catch (error) {
    console.error("ERREUR TRANSCRIPTION:", error);
    throw error;
  }
}
