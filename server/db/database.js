const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'hospital.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable Foreign Keys
db.run('PRAGMA foreign_keys = ON;');

// Helper to execute multi-statement SQL scripts (schema)
function initSchema() {
  return new Promise((resolve, reject) => {
    try {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(sql, (err) => {
        if (err) {
          console.error('Error applying schema:', err.message);
          return reject(err);
        }
        console.log('Schema initialized successfully.');
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Promise-based query helpers
function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function runCmd(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  db,
  initSchema,
  queryAll,
  queryOne,
  runCmd
};
