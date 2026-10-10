const path = require('path');
const fs = require('fs');

// Check if PostgreSQL (Supabase) is configured
const isSupabase = Boolean(
  (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) ||
  (process.env.SUPABASE_DB_URL && (process.env.SUPABASE_DB_URL.startsWith('postgres://') || process.env.SUPABASE_DB_URL.startsWith('postgresql://'))) ||
  process.env.DB_TYPE === 'supabase' ||
  process.env.DB_TYPE === 'postgres'
);

let db;
let initDatabase;

if (isSupabase) {
  // ====================================================================
  // SUPABASE (POSTGRESQL) CLOUD DATABASE CLIENT
  // ====================================================================
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  console.log('[Database] Connecting to Supabase (PostgreSQL) Cloud Database...');

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Convert SQLite "?" placeholders to PostgreSQL "$1, $2, $3..."
  function toPgSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  db = {
    isPostgres: true,
    raw: pool,

    async query(sql, params = []) {
      try {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, params);
        return res.rows;
      } catch (err) {
        console.error(`[Supabase Query Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async get(sql, params = []) {
      try {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, params);
        return res.rows[0] || null;
      } catch (err) {
        console.error(`[Supabase Get Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async run(sql, params = []) {
      try {
        let pgSql = toPgSql(sql);
        // Automatically append RETURNING * for INSERT statements if not present
        if (/^\s*insert\s+into\s+/i.test(sql) && !/returning/i.test(sql)) {
          pgSql += ' RETURNING *';
        }
        const res = await pool.query(pgSql, params);
        const insertedId = res.rows && res.rows.length > 0 && res.rows[0].id ? Number(res.rows[0].id) : 0;
        return {
          changes: res.rowCount,
          lastInsertRowid: insertedId
        };
      } catch (err) {
        console.error(`[Supabase Run Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async exec(sql) {
      return pool.query(sql);
    }
  };

  initDatabase = async function() {
    try {
      console.log('[Database] Verifying Supabase connection...');
      const checkRes = await pool.query('SELECT 1 as connected');
      if (checkRes.rows.length > 0) {
        console.log('🌿 [Database] Connected successfully to Supabase (PostgreSQL)!');
      }
    } catch (err) {
      console.error('❌ [Database] Failed to connect to Supabase:', err.message);
      console.error('   Please verify DATABASE_URL in .env matches your Supabase connection string.');
    }
  };

} else {
  // ====================================================================
  // LOCAL SQLITE FALLBACK (Development & Offline Mode)
  // ====================================================================
  const { DatabaseSync } = require('node:sqlite');
  const bcrypt = require('bcryptjs');

  const dbDir = path.resolve(__dirname, '../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbFilePath = process.env.DB_FILE 
    ? path.resolve(__dirname, '../..', process.env.DB_FILE) 
    : path.join(dbDir, 'vellanki.db');

  console.log(`[Database] Connecting to local SQLite database at: ${dbFilePath}`);
  const sqlite = new DatabaseSync(dbFilePath);

  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  db = {
    isPostgres: false,
    raw: sqlite,

    query(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        return stmt.all(...params);
      } catch (err) {
        console.error(`[SQLite Query Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    get(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        return stmt.get(...params) || null;
      } catch (err) {
        console.error(`[SQLite Get Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    run(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid)
        };
      } catch (err) {
        console.error(`[SQLite Run Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    exec(sql) {
      return sqlite.exec(sql);
    }
  };

  initDatabase = function() {
    console.log('[Database] Initializing local SQLite tables...');
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      sqlite.exec(schemaSql);
    }
  };
}

module.exports = {
  db,
  initDatabase,
  isSupabase
};
