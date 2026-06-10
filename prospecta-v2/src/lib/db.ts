// @ts-nocheck
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 3,
  idle_timeout: 10,
  connect_timeout: 10,
  max_lifetime: 60 * 10,
});

export default sql;

export async function initDB() {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    org_name TEXT NOT NULL DEFAULT 'NOF PROSPECT PROD',
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`.catch(() => {});

  await sql`CREATE TABLE IF NOT EXISTS prospects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    website TEXT,
    linkedin_url TEXT,
    country TEXT,
    city TEXT,
    industry TEXT,
    company_size TEXT,
    status TEXT DEFAULT 'NEW',
    score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    opted_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    daily_limit INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS campaign_steps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    delay_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    campaign_id TEXT REFERENCES campaigns(id),
    prospect_id TEXT REFERENCES prospects(id),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'SENT',
    open_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prospect_id TEXT REFERENCES prospects(id),
    title TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    stage TEXT DEFAULT 'LEAD',
    probability INTEGER DEFAULT 10,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}
