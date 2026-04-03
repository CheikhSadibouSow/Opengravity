import fs from 'fs';
import { generateText, stepCountIs } from 'ai';
import { openrouter } from './llm.js';
import { agentTools } from './tools.js';
import { memory } from '../db/memory.js';
import { env } from '../config/env.js';

const SYSTEM_PROMPT = `Tu es OpenGravity, un assistant IA personnel sécurisé s'exécutant localement via Telegram.
Tes réponses doivent être utiles, claires et concises. Privilégie le français.

Tu as accès à des outils Google Workspace (Sheets, Docs, Drive) via un compte de service.
- Email du service : firebase-adminsdk-fbsvc@opengravity-5b380.iam.gserviceaccount.com
- IMPORTANT : Si l'utilisateur veut que tu accèdes à une feuille ou un doc, il DOIT partager ce fichier avec cet email avec les droits d'édition.

Utilise les outils si nécessaire et explique TOUJOURS le résultat à la fin dans le texte de ta réponse.`;

export async function processUserMessage(userId: number, text: string): Promise<string> {
  try {
    console.log(`[AGENT] Début récupération historique pour ${userId}...`);
    let history = [];
    try {
        history = await memory.getHistory(userId, 15);
        console.log(`✅ Historique Firestore récupéré : ${history.length} messages.`);
    } catch (hErr) {
        console.error("⚠️ Impossible de lire l'historique Firestore :", hErr);
    }

    const userMessage = { role: 'user', content: text };
    let messages = [...history, userMessage];
    
    console.log(`[AGENT] Appel (${env.OPENROUTER_MODEL}) avec ${messages.length} messages.`);
    
    const result = await generateText({
      model: openrouter(env.OPENROUTER_MODEL),
      system: SYSTEM_PROMPT,
      messages: messages as any,
      tools: agentTools,
      // @ts-ignore
      maxTokens: 1000,
      temperature: 0.3,
      stopWhen: stepCountIs(5),
    });

    console.log("✅ Réponse AI générée avec succès.");

    // SAUVEGARDE FINALE DE TOUTE LA SEQUENCE DANS LA DB
    try {
        const userMsg = { role: 'user' as const, content: text };
        await memory.addMessage(userId, userMsg);
        
        for (const step of result.steps) {
          for (const msg of step.response.messages) {
            await memory.addMessage(userId, msg);
          }
        }
        console.log("✅ Conversation sauvegardée sur Firestore Cloud.");
    } catch (sErr) {
        console.error("⚠️ Impossible de sauvegarder sur Firestore :", sErr);
    }

    fs.appendFileSync('agent-log.txt', `\n--- COMPLETE CYCLE ---\nINPUT: ${text}\nFINAL RESPONSE: "${result.text}"\n`);
    
    return result.text || "J'ai bien reçu votre message. Comment puis-je vous aider ?";

  } catch (error: any) {
    console.error("ERREUR CRITIQUE AGENT:", error);
    fs.appendFileSync('agent-log.txt', `\n--- ERROR ---\n${error.stack || error.toString()}\n`);
    return "Désolé, une erreur technique est survenue.";
  }
}
