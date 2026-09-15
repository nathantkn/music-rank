import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

export default db;

// Supabase pauses a free project's database after a week without traffic, and
// every route in here talks to it. When that happens Prisma fails the same way
// a dropped network would, and the difference matters to the client: a query
// that can't reach the database is worth its own screen and a retry button,
// while a genuine bug in a handler is not.
//
// P1001/P1002 are "can't reach"/"timed out", P1008 is a query timeout, P1017 is
// the server closing the connection mid-flight. A cold Supabase project usually
// surfaces as P1001 wrapped in PrismaClientInitializationError, but the client
// reports a few of these depending on where in the connection it gave up.
const CONNECTION_ERROR_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1010', 'P1017']);

export function isConnectionError(err) {
  if (!err) return false;
  if (CONNECTION_ERROR_CODES.has(err.code)) return true;
  if (err.name === 'PrismaClientInitializationError') return true;
  // Connection-pool exhaustion and socket-level failures don't carry a Pxxxx
  // code, so fall back to what the driver puts in the message.
  return /can't reach database server|connection.*(closed|terminated|refused|reset)|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i
    .test(err.message ?? '');
}

// A single cheap round trip that proves the database is actually answering, not
// just that the Node process is up. Used by /api/health.
export async function pingDatabase() {
  await db.$queryRaw`SELECT 1`;
}
