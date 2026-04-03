import { generateText } from 'ai';
import { groq } from './src/agent/llm.js';

async function test() {
  try {
    const result = await generateText({
      model: groq('llama3-8b-8192'),
      system: "assistant",
      messages: [{ role: 'user', content: 'What is 2+2?' }],
      maxSteps: 2,
    });
    console.log("KEYS FOUND:", Object.keys(result));
    console.log("RESPONSE MESSAGES:", result.responseMessages);
  } catch (err) {
    console.error(err);
  }
}
test();
