import { bot } from './bot/telegram.js';
import http from 'http';
import { startEmailMonitoring } from './agent/notifications.js';

async function bootstrap() {
  try {
    console.log("Démarrage d'OpenGravity...");
    
    // Serveur HTTP minimal pour Render (Free Tier)
    const port = process.env.PORT || 8080;
    http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OpenGravity is ALIVE! 🚀');
    }).listen(port, () => {
      console.log(`📡 Serveur de santé écoutant sur le port ${port}`);
    });

    // Gérer les arrêts propres (Ctrl+C, etc)
    process.once('SIGINT', () => bot.stop());
    process.once('SIGTERM', () => bot.stop());

    // Activer la surveillance des emails en arrière-plan
    await startEmailMonitoring(bot);

    await bot.start({
      onStart: (botInfo) => {
        console.log(`✅ OpenGravity connecté en tant que @${botInfo.username}`);
      }
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage:", error);
    process.exit(1);
  }
}

bootstrap();
