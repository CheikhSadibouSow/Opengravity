import { tool } from 'ai';
import { z } from 'zod';
import { readSheet, appendSheet, createDoc, listCalendarEvents, createCalendarEvent, listGmailMessages, sendGmailMessage } from './workspace.js';

export const getCurrentTime = tool({
  description: 'Obtient l\'heure locale exacte actuelle. Utile pour répondre aux questions sur le temps, la date et l\'heure.',
  parameters: z.object({
    _dummy: z.string().optional()
  }),
  // @ts-ignore
  execute: async () => {
    return {
      currentTime: new Date().toISOString(),
      localeString: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
    };
  },
});

export const readGoogleSheet = tool({
  description: 'Lit les données d\'une feuille de calcul Google Sheets. L\'ID est dans l\'URL de la feuille.',
  parameters: z.object({
    spreadsheetId: z.string().describe('L\'ID de la feuille (ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)'),
    range: z.string().describe('La plage de cellules (ex: "Feuille1!A1:C10")'),
  }),
  execute: async ({ spreadsheetId, range }: { spreadsheetId: string, range: string }) => {
    return await readSheet(spreadsheetId, range);
  },
});

export const appendGoogleSheet = tool({
  description: 'Ajoute des données à la fin d\'une feuille de calcul Google Sheets.',
  parameters: z.object({
    spreadsheetId: z.string().describe('L\'ID de la feuille'),
    range: z.string().describe('La plage ou nom de la feuille (ex: "Feuille1")'),
    values: z.array(z.array(z.any())).describe('Tableau 2D de valeurs à ajouter'),
  }),
  execute: async ({ spreadsheetId, range, values }: { spreadsheetId: string, range: string, values: any[][] }) => {
    return await appendSheet(spreadsheetId, range, values);
  },
});

export const createGoogleDoc = tool({
  description: 'Crée un nouveau document Google Doc et retourne son ID.',
  parameters: z.object({
    title: z.string().describe('Le titre du document'),
  }),
  execute: async ({ title }: { title: string }) => {
    return await createDoc(title);
  },
});

export const listGoogleCalendarEvents = tool({
  description: 'Liste les 10 prochains événements du calendrier Google de l\'utilisateur.',
  parameters: z.object({}),
  execute: async () => {
    return await listCalendarEvents();
  },
});

export const createGoogleCalendarEvent = tool({
  description: 'Crée un nouvel événement dans le calendrier Google.',
  parameters: z.object({
    summary: z.string().describe('Le titre de l\'événement'),
    startTime: z.string().describe('Heure de début au format ISO (ex: 2026-04-03T10:00:00Z)'),
    endTime: z.string().describe('Heure de fin au format ISO'),
  }),
  execute: async ({ summary, startTime, endTime }: { summary: string, startTime: string, endTime: string }) => {
    return await createCalendarEvent(summary, startTime, endTime);
  },
});

export const listGmailInbox = tool({
  description: 'Liste les 5 derniers messages reçus dans Gmail (nécessite délégation).',
  parameters: z.object({}),
  execute: async () => {
    return await listGmailMessages();
  },
});

export const sendGmailEmail = tool({
  description: 'Envoie un email via Gmail (nécessite délégation).',
  parameters: z.object({
    to: z.string().describe('Destinataire'),
    subject: z.string().describe('Sujet de l\'email'),
    body: z.string().describe('Corps de l\'email (HTML possible)'),
  }),
  execute: async ({ to, subject, body }: { to: string, subject: string, body: string }) => {
    return await sendGmailMessage(to, subject, body);
  },
});

export const agentTools = {
  get_current_time: getCurrentTime,
  read_google_sheet: readGoogleSheet,
  append_google_sheet: appendGoogleSheet,
  create_google_doc: createGoogleDoc,
  list_calendar_events: listGoogleCalendarEvents,
  create_calendar_event: createGoogleCalendarEvent,
  list_gmail_inbox: listGmailInbox,
  send_gmail_email: sendGmailEmail,
};
