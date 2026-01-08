import type { Config } from 'drizzle-kit';

// Load environment variables - use override to ensure .env values are used
// drizzle-kit may run this as CommonJS, so use require
try {
  require('dotenv').config({ path: '.env.local', override: true });
} catch (e) {
  // Ignore if dotenv not available or file doesn't exist
}
try {
  require('dotenv').config({ path: '.env', override: true });
} catch (e) {
  // Ignore if dotenv not available or file doesn't exist
}

// Construct dbCredentials - for Turso, we need both url and authToken
const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_DATABASE_AUTH_TOKEN;

// For Turso, we need both URL and authToken
// If using local SQLite, set TURSO_DATABASE_URL to 'file:./dev.sqlite3' and don't set TURSO_DATABASE_AUTH_TOKEN
if (!dbUrl) {
  throw new Error('TURSO_DATABASE_URL environment variable is required');
}

// For Turso remote databases, authToken is required
if (dbUrl && !dbUrl.startsWith('file:') && !authToken) {
  throw new Error('TURSO_DATABASE_AUTH_TOKEN is required for remote Turso databases');
}

// Use 'turso' dialect for Turso databases, 'sqlite' for local files
const dialect = dbUrl.startsWith('file:') ? 'sqlite' : 'turso';
const dbCredentials = authToken
  ? { url: dbUrl, authToken }
  : { url: dbUrl };

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect,
  dbCredentials,
} satisfies Config;
