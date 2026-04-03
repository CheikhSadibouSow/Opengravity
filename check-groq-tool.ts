import { generateText } from 'ai';
import { groq } from './src/agent/llm.js';
import { agentTools } from './src/agent/tools.js';

async function test() {
  const result = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [{ role: 'user', content: 'Quelle heure est-il ?' }],
    tools: agentTools,
  });
  console.log("TOOL RESULTS KEYS:", Object.keys(result.toolResults[0] || {}));
  console.log("TOOL RESULT OBJECT:", JSON.stringify(result.toolResults[0], null, 2));
}
test();
