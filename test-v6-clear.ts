import { generateText } from 'ai';
import { groq } from './src/agent/llm.js';

async function test() {
  const result = await generateText({
    model: groq('llama3-8b-8192'),
    system: "assistant",
    messages: [{ role: 'user', content: 'Hi' }],
  });
  console.log("KEYS FOUND:");
  Object.keys(result).forEach(k => console.log(`- ${k}`));
  console.log("RESPONSE MESSAGES TYPE:", typeof (result as any).responseMessages);
  console.log("STEPS TYPE:", typeof (result as any).steps);
}
test();
