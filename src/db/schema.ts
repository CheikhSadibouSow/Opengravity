import Database from 'better-sqlite3';
import { env } from '../config/env.js';

export const dbOrig = new Database(env.DB_PATH);
dbOrig.pragma('journal_mode = WAL');

// Initialisation du nouveau schéma plus flexible
dbOrig.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
`);
