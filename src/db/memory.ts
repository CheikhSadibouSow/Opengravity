import admin from 'firebase-admin';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

// Initialisation de Firebase Admin avec Service Account
// Initialisation de Firebase Admin
if (admin.apps.length === 0) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log("🔄 Initialisation Firebase via FIREBASE_SERVICE_ACCOUNT_JSON...");
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: (serviceAccount as any).project_id
      });
      console.log("✅ Firebase Admin initialisé via la variable d'environnement");
    } else if (fs.existsSync(serviceAccountPath)) {
      console.log(`🔄 Initialisation Firebase via ${serviceAccountPath}...`);
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log("✅ Firebase Admin initialisé avec service-account.json (Mode Local)");
    } else {
      console.log("🔄 Initialisation Firebase avec identifiants par défaut...");
      admin.initializeApp();
      console.log("⚠️ Firebase Admin initialisé avec identifiants par défaut Google Cloud");
    }
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE INITIALISATION FIREBASE:", error);
    // On ne sort pas forcément pour laisser l'agent tourner même sans historique si besoin,
    // mais ici on veut que l'utilisateur sache que ça a raté.
  }
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export const memory = {
  addMessage: async (userId: number, message: any) => {
    try {
      const messagesRef = db.collection('conversations').doc(userId.toString()).collection('messages');
      
      const cleanMessage = {
          role: message.role || 'assistant',
          content: message.content || '',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (message.toolCalls) {
          (cleanMessage as any).toolCalls = message.toolCalls;
      }
      
      await messagesRef.add(cleanMessage);
    } catch (e) {
      console.error("ERREUR ADD MESSAGE (FIRESTORE):", e);
    }
  },

  getHistory: async (userId: number, limit: number = 30): Promise<any[]> => {
    try {
      const messagesRef = db.collection('conversations').doc(userId.toString()).collection('messages');
      const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(limit).get();
      
      const history: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const msg: any = {
            role: data.role,
            content: data.content
        };
        
        if (data.toolCalls) {
            msg.toolCalls = data.toolCalls;
        }
        
        history.push(msg);
      });

      return history.reverse();
    } catch (e) {
      console.error("ERREUR GET HISTORY (FIRESTORE):", e);
      return [];
    }
  },

  clearHistory: async (userId: number) => {
    try {
      const messagesRef = db.collection('conversations').doc(userId.toString()).collection('messages');
      const snapshot = await messagesRef.get();
      
      if (snapshot.empty) return;

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🧹 Historique Firebase nettoyé pour l'utilisateur ${userId}`);
    } catch (e) {
      console.error("ERREUR CLEAR HISTORY (FIRESTORE):", e);
    }
  }
};
