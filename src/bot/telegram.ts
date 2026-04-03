import { Bot } from 'grammy';
import { env } from '../config/env.js';
import { processUserMessage } from '../agent/loop.js';
import { memory } from '../db/memory.js';
import { transcribeAudio } from '../agent/voice.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

async function downloadFileContent(filePath: string, destPath: string) {
  const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
  if (!response.body) throw new Error('Response body is null');
  
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(response.body as any), fileStream);
}

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// Middleware d'authentification
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return; // Ignore si pas d'id utilisateur
  
  if (!env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    console.warn(`Tentative d'accès non autorisée de l'utilisateur ID: ${userId}`);
    // Sécurité: ne rien répondre empêche l'énumération ou le spam
    return;
  }
  
  await next();
});

bot.command('start', async (ctx) => {
  await ctx.reply("🚀 OpenGravity initialisé. Je suis prêt à t'assister !");
});

bot.command('clear', async (ctx) => {
  const userId = ctx.from!.id;
  memory.clearHistory(userId);
  await ctx.reply("🧹 Historique de la conversation effacé.");
});

bot.on('message:text', async (ctx) => {
  const userId = ctx.from!.id;
  const text = ctx.message.text;
  
  // Afficher que l'agent "écrit..."
  await ctx.replyWithChatAction('typing');
  
  try {
    const response = await processUserMessage(userId, text);
    // Diviser le message s'il dépasse la limite Telegram (4096 caractères)
    if (response.length > 4000) {
        const chunks = response.match(/.{1,4000}/g) || [];
        for (const chunk of chunks) {
            await ctx.reply(chunk);
        }
    } else {
        await ctx.reply(response);
    }
  } catch (error) {
    console.error("Erreur dans le handler message:", error);
    await ctx.reply("❌ Une erreur s'est produite lors du traitement de votre message.");
  }
});
bot.on(['message:voice', 'message:audio'], async (ctx) => {
  const userId = ctx.from!.id;
  
  // Indiquer que l'agent "écoute..."
  await ctx.replyWithChatAction('record_voice');

  let tempPath = '';
  try {
    // 1. Récupération du fichier Telegram
    const file = await ctx.getFile();
    if (!file.file_path) throw new Error("File path not found");
    
    const fileName = `voice_${Date.now()}.${file.file_path.split('.').pop() || 'ogg'}`;
    tempPath = path.join(os.tmpdir(), fileName);

    await downloadFileContent(file.file_path, tempPath);
    console.log(`🎙️ Voice downloaded: ${tempPath}`);

    // 2. Transcription via Groq Whisper
    const transcription = await transcribeAudio(tempPath);
    console.log(`📝 Transcrit : "${transcription}"`);

    if (!transcription || transcription.trim() === "") {
        await ctx.reply("❌ Je n'ai pas pu comprendre l'audio. Essayez de parler plus fort ?");
        return;
    }

    // Informer l'utilisateur de ce que j'ai entendu
    await ctx.reply(`🎙️ **Vous avez dit :**\n_"${transcription}"_`, { parse_mode: 'Markdown' });

    // 3. Traiter comme un message texte normal
    await ctx.replyWithChatAction('typing');
    const response = await processUserMessage(userId, transcription);
    
    // Envoi de la réponse
    if (response.length > 4000) {
        const chunks = response.match(/.{1,4000}/g) || [];
        for (const chunk of chunks) {
            await ctx.reply(chunk);
        }
    } else {
        await ctx.reply(response);
    }

  } catch (error) {
    console.error("Erreur dans le handler audio:", error);
    await ctx.reply("❌ Une erreur s'est produite lors du traitement de l'audio.");
  } finally {
    // Nettoyage du fichier temporaire
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});
