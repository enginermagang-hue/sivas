import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type DB = ReturnType<typeof createClient>

function createDb(): DB {
  const url = process.env.NUXT_TURSO_URL || 'file:.data/local.db'
  const authToken = process.env.NUXT_TURSO_AUTH_TOKEN || ''
  let dbUrl = url
  if (url.startsWith('file:')) {
    const filePath = resolve(url.slice(5))
    mkdirSync(dirname(filePath), { recursive: true })
    dbUrl = `file:${filePath}`
  }
  return createClient({ url: dbUrl, authToken })
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','koordinator','anggota','kepala')),
  region_id INTEGER NULL REFERENCES regions(id),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
  last_login DATETIME,
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kode TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  warna TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  kategori_id INTEGER NOT NULL REFERENCES categories(id),
  tanggal DATE NOT NULL,
  jam_mulai TIME,
  jam_selesai TIME,
  deskripsi TEXT NOT NULL,
  npsn TEXT NULL,
  nama_sekolah TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  url_file TEXT,
  tipe_mime TEXT,
  ukuran_bytes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  komentar TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  payload JSON NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','synced','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_active DATETIME,
  revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  detail JSON,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google_connections (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  refresh_token TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  scopes TEXT,
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
`

async function runSql(db: DB, sql: string, args?: any[]) {
  await db.execute({ sql, args: args || [] })
}

async function countTable(db: DB, table: string): Promise<number> {
  const res = await db.execute({ sql: `SELECT COUNT(*) as c FROM ${table}`, args: [] })
  const row = res.rows[0] as any
  return Number(row.c)
}

async function seedAdmin(db: DB) {
  const total = await countTable(db, 'users')
  if (total > 0) return

  const passwordHash = await bcrypt.hash('admin123', 10)
  await runSql(
    db,
    `INSERT INTO users (email, password_hash, nama, role, status) VALUES (?, ?, ?, ?, ?)`,
    ['admin@example.com', passwordHash, 'Administrator', 'admin', 'active']
  )
  console.log('[seed] admin created: admin@example.com / admin123')
}

async function seedRegions(db: DB) {
  const total = await countTable(db, 'regions')
  if (total > 0) return

  await runSql(db, `INSERT INTO regions (nama, kode) VALUES (?, ?)`, ['Wilayah A', 'WIL-A'])
  await runSql(db, `INSERT INTO regions (nama, kode) VALUES (?, ?)`, ['Wilayah B', 'WIL-B'])
  console.log('[seed] regions created: Wilayah A, Wilayah B')
}

async function seedCategories(db: DB) {
  const total = await countTable(db, 'categories')
  if (total > 0) return

  await runSql(db, `INSERT INTO categories (nama, warna) VALUES (?, ?)`, ['Pertemuan', '#3B82F6'])
  await runSql(db, `INSERT INTO categories (nama, warna) VALUES (?, ?)`, ['Lapangan', '#10B981'])
  await runSql(db, `INSERT INTO categories (nama, warna) VALUES (?, ?)`, ['Administrasi', '#F59E0B'])
  await runSql(db, `INSERT INTO categories (nama, warna) VALUES (?, ?)`, ['Lainnya', '#6B7280'])
  console.log('[seed] categories created: Pertemuan, Lapangan, Administrasi, Lainnya')
}

export async function migrate() {
  const db = createDb()
  console.log('[migrate] running schema...')
  const statements = SCHEMA_SQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const sql of statements) {
    await runSql(db, sql)
  }
  console.log('[migrate] schema done')

  // Idempoten tambah kolom status pada regions (existing DB tanpa status)
  try {
    await runSql(db, `ALTER TABLE regions ADD COLUMN status TEXT DEFAULT 'active'`)
    console.log('[migrate] added column status to regions')
  } catch (e: any) {
    const m = (e?.message ?? '').toLowerCase()
    if (!m.includes('duplicate column') && !m.includes('already exists')) {
      console.warn('[migrate] alter regions status skipped:', e?.message)
    }
  }

  // Idempoten tambah kolom npsn/nama_sekolah pada activities (existing DB)
  for (const col of ['npsn TEXT NULL', 'nama_sekolah TEXT NULL']) {
    try {
      await runSql(db, `ALTER TABLE activities ADD COLUMN ${col}`)
      console.log(`[migrate] added column ${col.split(' ')[0]} to activities`)
    } catch (e: any) {
      const m = (e?.message ?? '').toLowerCase()
      if (!m.includes('duplicate column') && !m.includes('already exists')) {
        console.warn('[migrate] alter activities skipped:', e?.message)
      }
    }
  }

  console.log('[migrate] seeding...')
  await seedAdmin(db)
  await seedRegions(db)
  await seedCategories(db)
  console.log('[migrate] seed done')
}

export async function migrateFresh() {
  const db = createDb()
  const tables = [
    'google_connections',
    'activity_log',
    'sessions',
    'sync_queue',
    'notifications',
    'comments',
    'activity_files',
    'activities',
    'categories',
    'regions',
    'users'
  ]

  for (const table of tables) {
    try {
      await runSql(db, `DROP TABLE IF EXISTS ${table}`)
    } catch (e) {
      console.error(`[migrate:fresh] failed to drop ${table}`, e)
    }
  }

  await migrate()
}
