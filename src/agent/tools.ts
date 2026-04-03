import { tool } from 'ai';
import { z } from 'zod';
import { readSheet, appendSheet, createDoc } from './workspace.js';

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

export const agentTools = {
  get_current_time: getCurrentTime,
  read_google_sheet: readGoogleSheet,
  append_google_sheet: appendGoogleSheet,
  create_google_doc: createGoogleDoc,
};
