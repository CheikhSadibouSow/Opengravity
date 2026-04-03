import { processUserMessage } from './src/agent/loop.js';
import { memory } from './src/db/memory.js';

async function test() {
  console.log("NETTOYAGE FIREBASE POUR LE TEST...");
  await memory.clearHistory(123456789); // Nettoyage id de test (Firestore)

  console.log("TESTING 'bonsoir'...");
  const res1 = await processUserMessage(123456789, "bonsoir");
  console.log("REPLY 1:", res1);

  console.log("TESTING 'quelle heure est-il ?'...");
  const res2 = await processUserMessage(123456789, "quelle heure est-il ?");
  console.log("REPLY 2:", res2);
}

test().catch(err => {
  console.error("ERREUR DURANT LE TEST :", err);
});
