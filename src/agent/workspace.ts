import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Utiliser le même compte de service que Firebase
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account.json');

function getAuth() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.file'
  ];

  if (envJson) {
    const credentials = JSON.parse(envJson);
    return new google.auth.GoogleAuth({
      credentials,
      scopes,
    });
  }

  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    return new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes,
    });
  }
  
  throw new Error("Authentification Google Workspace manquante (ni fichier ni variable d'environnement).");
}

/**
 * Lit les données d'une feuille Google Sheets
 */
export async function readSheet(spreadsheetId: string, range: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data;
}

/**
 * Ajoute une ligne à une feuille Google Sheets
 */
export async function appendSheet(spreadsheetId: string, range: string, values: any[][]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
  return response.data;
}

/**
 * Crée un document Google Doc
 */
export async function createDoc(title: string) {
  const auth = getAuth();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
    },
  });
  return res.data;
}

/**
 * Calendar: Liste les événements
 */
export async function listCalendarEvents() {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items;
}

/**
 * Calendar: Crée un événement
 */
export async function createCalendarEvent(summary: string, startTime: string, endTime: string) {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
    },
  });
  return res.data;
}

/**
 * Gmail: Liste les messages (Nécessite Délégation)
 */
export async function listGmailMessages() {
  const auth = getAuth();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5,
  });
  return res.data;
}

/**
 * Gmail: Envoie un email (Nécessite Délégation)
 */
export async function sendGmailMessage(to: string, subject: string, body: string) {
  const auth = getAuth();
  const gmail = google.gmail({ version: 'v1', auth });
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
  return res.data;
}
