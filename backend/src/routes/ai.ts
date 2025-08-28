// backend/src/routes/ai.ts
import { FastifyInstance } from 'fastify';
import { OpenAI } from "openai";
import 'dotenv/config';

const openAICall = async (prompt: string, systemPrompt: string): Promise<string> => {

  await new Promise(resolve => setTimeout(resolve, 300));

    const client = await new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_API_KEY,
    });
    const chatCompletion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
        messages: [
            {
                role: "user",
                content: systemPrompt+":"+ prompt,
            },
        ],
    });
  
    console.log(chatCompletion.choices[0])
    return       JSON.stringify({ subject: `Quick chat about ${prompt.slice(0, 20)}?`,
                                  body: chatCompletion.choices[0].message.role,
                                  content: chatCompletion.choices[0].message.content})
    
};

export async function aiRoutes(fastify: FastifyInstance) {
  // Router endpoint - determines email type
  fastify.post<{ Body: { prompt: string } }>('/api/ai/route', async (request, reply) => {
    try {
      const { prompt } = request.body;
      
      const systemPrompt = `You are a ROUTER assistant. Analyze the user's email request and classify it as one of these types:
      - "sales": For sales, business development, product pitches, offers, proposals
      - "followup": For following up on previous conversations, checking status, gentle reminders  
      
      Respond with only the classification word: sales or followup.`;
      
      const classification = await openAICall(prompt, systemPrompt);

      return { type: JSON.parse(classification) };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to route email type' });
    }
  });

  // Generate email content with streaming
  fastify.post<{ Body: { prompt: string; type: string; recipient: string } }>('/api/ai/generate', async (request, reply) => {
    try {
      const { prompt, type, recipient } = request.body;
      
      let systemPrompt = '';
      
      if (type === 'sales') {
        systemPrompt = `You are a SALES email assistant. Generate professional, concise sales emails.
        Rules:
        - Keep emails under 40 words total
        - Max 7-10 words per sentence
        - Be direct and actionable
        - Include a clear call-to-action
        - Sound professional but friendly`;
      } else {
        systemPrompt = `You are a FOLLOWUP email assistant. Generate polite, professional follow-up emails.
        Rules:
        - Be courteous and not pushy
        - Reference the original context
        - Provide an easy way to respond
        - Keep it brief and professional`;
      }

      const emailContent = await openAICall(prompt, systemPrompt);
      return emailContent

    } catch (error) {
      reply.status(500).send({ error: 'Failed to generate email content' });
    }
  });
}