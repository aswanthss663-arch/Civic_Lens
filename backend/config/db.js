const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres';
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
const POSTGRES_DB = process.env.POSTGRES_DB || 'civictrack';

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

let pgPool = null;
let sqliteDb = null;
let activeDbType = 'sqlite';

function initDatabase() {
  // Try PostgreSQL connection
  try {
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000
    });

    pool.query('SELECT NOW()', (err, res) => {
      if (!err) {
        console.log('✅ Connected to PostgreSQL database:', POSTGRES_DB);
        pgPool = pool;
        activeDbType = 'postgresql';
      } else {
        console.warn('⚠️ PostgreSQL connection failed, using SQLite fallback:', err.message);
        setupSqliteFallback();
      }
    });
  } catch (e) {
    console.warn('⚠️ PostgreSQL pool initialization failed:', e.message);
    setupSqliteFallback();
  }
}

function setupSqliteFallback() {
  const dbPath = path.resolve(__dirname, '../../civictrack.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err);
    } else {
      console.log('✅ Using SQLite database fallback at:', dbPath);
      activeDbType = 'sqlite';
    }
  });
}

initDatabase();

module.exports = {
  getDbType: () => activeDbType,

  async query(text, params = []) {
    if (activeDbType === 'postgresql' && pgPool) {
      try {
        const res = await pgPool.query(text, params);
        return res.rows;
      } catch (err) {
        console.warn('PG Query Error, falling back to SQLite:', err.message);
      }
    }

    // SQLite Execution Fallback
    return new Promise((resolve, reject) => {
      if (!sqliteDb) {
        return resolve([]);
      }
      
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) resolve([]);
          else resolve(rows || []);
        });
      } else {
        sqliteDb.run(text, params, function (err) {
          if (err) resolve([]);
          else resolve([{ id: this.lastID, changes: this.changes }]);
        });
      }
    });
  }
};
