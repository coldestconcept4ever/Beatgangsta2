import { createClient } from '@libsql/client';

if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_URL and TURSO_AUTH_TOKEN must be set');
}

export const turso = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
