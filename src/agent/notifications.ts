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

  console.log(`📡 Démarrage du moniteur Gmail pour ${env.GMAIL_USER}...`);

  const pollEmails = async () => {
    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        // Chercher les mails non lus depuis la dernière vérification
        const searchCriteria = { unseen: true, since: lastCheckTime };
        const messages = await client.search(searchCriteria);
        
        for (const messageSeq of messages) {
          const content = await client.fetchOne(messageSeq, { source: true });
          const parsed = await simpleParser(content.source);
          
          if (!parsed) continue;

          console.log(`📩 Nouvel email de: ${parsed.from?.text} - Sujet: ${parsed.subject}`);

          // Notifier tous les utilisateurs autorisés
          for (const userId of env.TELEGRAM_ALLOWED_USER_IDS) {
            await bot.api.sendMessage(userId, 
              `📩 **Nouvel Email Important**\n\n` +
              `👤 **De :** ${parsed.from?.text}\n` +
              `📝 **Sujet :** ${parsed.subject}\n\n` +
              `🔗 _Consultez votre boîte Gmail pour répondre._`,
              { parse_mode: 'Markdown' }
            );
          }
        }
        
        lastCheckTime = new Date(); // Mettre à jour l'heure de dernière vérification
      } finally {
        lock.release();
      }
      
      await client.logout();
    } catch (err) {
      console.error("❌ Erreur moniteur Gmail:", err);
      try { await client.logout(); } catch (e) {}
    }
  };

  // Lancer la première vérification
  pollEmails();

  // Programmer une vérification toutes les 5 minutes
  setInterval(pollEmails, 5 * 60 * 1000);
}
