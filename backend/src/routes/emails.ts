// backend/src/routes/emails.ts
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    knex: any;
  }
}

interface Email {
  id?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  type?: 'sales' | 'followup' | 'general';
  created_at?: string;
}

export async function emailRoutes(fastify: FastifyInstance) {
  const { knex } = fastify;

  // Get all emails
  fastify.get('/api/emails', async (request, reply) => {
    try {
      const emails = await knex('emails').orderBy('created_at', 'desc');
      console.log({emails})
      return emails;
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch emails' });
    }
  });

  // Create new email
  fastify.post<{ Body: Email }>('/api/emails', async (request, reply) => {
    try {
      const emailData = {
        ...request.body,
        created_at: new Date().toISOString(),
        id:randomUUID()
      };

      await knex('emails').insert(emailData);
      return emailData;
    } catch (error) {
      console.log(error)
      reply.status(500).send({ error: 'Failed to save email' });
    }
  });
}