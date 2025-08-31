import { FastifyInstance } from 'fastify';
import { OpenAI } from "openai";
import 'dotenv/config';

const openAICall = async (prompt: string, systemPrompt: string): Promise<string | null> => {

  await new Promise(resolve => setTimeout(resolve, 300));

  const client = await new OpenAI({
    baseURL: process.env.API_BASE_URL,
    apiKey: process.env.HF_API_KEY,
  });
  const chatCompletion = await client.chat.completions.create({
    model: process.env.API_MODEL ?? "",
    messages: [
      {
        role: "user",
        content: prompt + ":" + systemPrompt,
      },
    ],
  });

  return chatCompletion.choices[0].message.content
}

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

      return { type: classification };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to route email type' });
    }
  });

  // Generate email content with streaming
  fastify.post<{ Body: { prompt: string; type: string; recipient: string } }>('/api/ai/generate', async (request, reply) => {

    try {
      const { prompt, type, recipient } = request.body;

      let systemPrompt = '';
      let userPrompt = '';

      if (type === 'sales') {
        systemPrompt = `You are a SALES email assistant. Generate professional, concise sales emails.

        STRICT RULES:
        - Keep emails under 40 words total
        - Max 7-10 words per sentence
        - Be direct and actionable
        - Include a clear call-to-action
        - Sound professional but friendly
        - No fluff or unnecessary words
        
        Format your response as first line is subject(don't mention its subject), on second line goes body separate lines by \\n\\n`;

        userPrompt = `Generate a sales email about: ${prompt}. Recipient: ${recipient}`;

      } else {
        systemPrompt = `You are a FOLLOWUP email assistant. Generate polite, professional follow-up emails.

        RULES:
        - Be courteous and not pushy
        - Reference the original context
        - Provide an easy way to respond
        - Keep it brief and professional
        - Show genuine interest
        
        Format your response as first line is subject(don't mention its subject), on second line goes body separate lines by \\n\\n`;

        userPrompt = `Generate a follow-up email about: ${prompt}. Recipient: ${recipient}`;


        reply.raw.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
      }

      const client = await new OpenAI({
        baseURL: process.env.API_BASE_URL,
        apiKey: process.env.HF_API_KEY,
      });

      const result = await client.chat.completions.create({
        model: process.env.API_MODEL ?? "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: userPrompt + ":" + systemPrompt,
          },
        ],
        stream: true
      });

      for await (const chunk of result) {
        const text = chunk.choices[0]?.delta?.content || "";
        reply.raw.write(text)
      }
      reply.raw.end()
    } catch (error: unknown) {
      const err = error as Error
      console.error('Streaming error:', err);
    }
  })
}