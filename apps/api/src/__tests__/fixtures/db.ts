import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../../db/schema";
import type { Database } from "../../db";

/**
 * Creates an in-memory SQLite database for testing.
 * Each test should create its own database to ensure isolation.
 */
export function createTestDb(): Database {
  const client = createClient({
    url: ":memory:",
  });

  const db = drizzle(client, { schema });

  return db;
}

/**
 * Sets up a test database with the schema.
 * Note: Since we're using in-memory SQLite, we need to apply the schema manually.
 * For now, we'll create tables using the schema definitions.
 */
export async function setupTestDb(): Promise<Database> {
  const db = createTestDb();

  // Apply migrations or create tables
  // Since Drizzle migrations require files, we'll execute schema SQL directly
  // This is a simplified approach for testing
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      season TEXT NOT NULL,
      invite_code TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      avg_lead_time_days INTEGER,
      notes TEXT,
      is_global INTEGER NOT NULL DEFAULT 0,
      team_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      vendor_id TEXT,
      name TEXT NOT NULL,
      sku TEXT,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      reorder_point INTEGER DEFAULT 0,
      location TEXT,
      unit_price_cents INTEGER,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS bom_items (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      subsystem TEXT NOT NULL DEFAULT 'other',
      quantity_needed INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      total_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      rejection_reason TEXT,
      created_by_id TEXT NOT NULL,
      approved_by_id TEXT,
      created_at INTEGER NOT NULL,
      submitted_at INTEGER,
      approved_at INTEGER,
      ordered_at INTEGER,
      received_at INTEGER,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (approved_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts(id)
    );
  `);

  return db;
}

/**
 * Cleans up the test database.
 * For in-memory databases, this is handled automatically when the connection closes.
 */
export async function cleanupTestDb(_db: Database): Promise<void> {
  // In-memory database will be cleaned up automatically
  // This function is a no-op but provided for consistency
}
