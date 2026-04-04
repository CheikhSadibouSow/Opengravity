import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '../config/env.js';
import { Bot, Context } from 'grammy';

let lastCheckTime = new Date();

/**
 * Surveillance des emails via IMAP
 */
export async function startEmailMonitoring(bot: Bot) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.log("⚠️ Surveillance Gmail désactivée : GMAIL_USER ou GMAIL_APP_PASSWORD manquant.");
    return;
  }

  console.log(`📡 Démarrage du moniteur Gmail pour ${env.GMAIL_USER}...`);

  const pollEmails = async () => {
    // Créer une nouvelle instance à CHAQUE poll pour éviter l'erreur "Can not re-use ImapFlow instance"
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
      logger: false
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        const searchCriteria = { unseen: true, since: lastCheckTime };
        const messages = await client.search(searchCriteria);
        
        for (const messageSeq of messages) {
          const content = await client.fetchOne(messageSeq, { source: true });
          const parsed = await simpleParser(content.source);
          
          if (!parsed) continue;

          const fromText = parsed.from?.text || "Inconnu";
          const subject = parsed.subject || "(Sans sujet)";

          console.log(`📩 Nouvel email de: ${fromText} - Sujet: ${subject}`);

          for (const userId of env.TELEGRAM_ALLOWED_USER_IDS) {
            // Utiliser HTML pour éviter les erreurs de parsing Markdown avec les caractères spéciaux < >
            await bot.api.sendMessage(userId, 
              `📩 <b>Nouvel Email Important</b>\n\n` +
              `👤 <b>De :</b> ${fromText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n` +
              `📝 <b>Sujet :</b> ${subject}\n\n` +
              `🔗 <i>Consultez votre boîte Gmail pour répondre.</i>`,
              { parse_mode: 'HTML' }
            );
          }
        }
        
        lastCheckTime = new Date();
      } finally {
        lock.release();
      }
      
      await client.logout();
    } catch (err) {
      console.error("❌ Erreur moniteur Gmail:", err);
      try { await client.logout(); } catch (e) {}
    }
  };

  pollEmails();
  setInterval(pollEmails, 5 * 60 * 1000);
}
