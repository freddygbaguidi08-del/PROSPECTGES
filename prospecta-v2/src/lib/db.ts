// @ts-nocheck
import postgres from 'postgres';

let sql: any = null;

function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non configurée');
  }
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sql;
}

export default new Proxy({} as any, {
  get(_target, prop) {
    const s = getSQL();
    return s[prop];
  },
  apply(_target, _this, args) {
    const s = getSQL();
    return s(...args);
  }
});

export async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL non configurée - base de données non initialisée');
    return;
  }

  const s = getSQL();

  await s`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'ADMIN',
    org_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await s`CREATE TABLE IF NOT EXISTS prospects (
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

  await s`CREATE TABLE IF NOT EXISTS campaigns (
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

  await s`CREATE TABLE IF NOT EXISTS campaign_steps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    delay_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await s`CREATE TABLE IF NOT EXISTS email_logs (
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

  await s`CREATE TABLE IF NOT EXISTS deals (
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

  console.log('✅ Database tables ready');
}
