import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Utiliser le même compte de service que Firebase
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account.json');

function getAuth() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error("Fichier service-account.json manquant pour Google Workspace.");
  }
  
  return new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file'
    ],
  });
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
