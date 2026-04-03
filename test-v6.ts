import { generateText } from 'ai';
import { groq } from './src/agent/llm.js';

async function test() {
  try {
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: "Tu es un assistant.",
      messages: [{ role: 'user', content: 'Hi' }],
    });
    console.log("Keys in result:", Object.keys(result));
    console.log("Check responseMessages:", (result as any).responseMessages);
    console.log("Check fullText:", (result as any).fullText);
  } catch (e: any) {
    console.error("ERROR:", e);
  }
}

test();
