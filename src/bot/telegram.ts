import { Bot } from 'grammy';
import { env } from '../config/env.js';
import { processUserMessage } from '../agent/loop.js';
import { memory } from '../db/memory.js';

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
