
// backend/src/app.ts (main server file)
import Fastify from 'fastify';
import cors from '@fastify/cors';
import Knex from "knex";
import { emailRoutes } from './routes/emails';
import { aiRoutes } from './routes/ai';

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: ['http://localhost:3000'],
  credentials: true
});

// Register database plugin (assuming you have knex setup)
const knex = Knex({
  client: "sqlite3",
  connection: {
    filename: "./dev.sqlite3",
  },
  useNullAsDefault: true,
});

fastify.decorate("knex", knex)

// Register routes
fastify.register(emailRoutes);
fastify.register(aiRoutes);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();