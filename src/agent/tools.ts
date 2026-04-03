import { tool } from 'ai';
import { z } from 'zod';

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

export const agentTools = {
  get_current_time: getCurrentTime,
};
