const express = require('express');
const router = express.Router();
const { db, queryAll, queryOne, runCmd } = require('../db/database');
const { performance } = require('perf_hooks');

// GET full database schema (Tables, Columns, PK/FKs, Triggers, Views)
router.get('/schema', async (req, res) => {
  try {
    // 1. Get all user tables
    const tablesMaster = await queryAll(`
      SELECT name, sql FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `);

    const tables = [];
    for (const tbl of tablesMaster) {
      const columns = await queryAll(`PRAGMA table_info("${tbl.name}")`);
      const foreignKeys = await queryAll(`PRAGMA foreign_key_list("${tbl.name}")`);
      const rowCount = await queryOne(`SELECT COUNT(*) as count FROM "${tbl.name}"`);

      tables.push({
        name: tbl.name,
        sql: tbl.sql,
        rowCount: rowCount ? rowCount.count : 0,
        columns: columns.map(c => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notNull: !!c.notnull,
          defaultValue: c.dflt_value,
          isPrimaryKey: !!c.pk
        })),
        foreignKeys: foreignKeys.map(fk => ({
          id: fk.id,
          seq: fk.seq,
          table: fk.table,
          from: fk.from,
          to: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete
        }))
      });
    }

    // 2. Get all views
    const views = await queryAll(`
      SELECT name, sql FROM sqlite_master 
      WHERE type = 'view'
      ORDER BY name ASC
    `);

    // 3. Get all triggers
    const triggers = await queryAll(`
      SELECT name, tbl_name, sql FROM sqlite_master 
      WHERE type = 'trigger'
      ORDER BY name ASC
    `);

    res.json({
      tables,
      views,
      triggers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST execute raw SQL query (Live SQL Console runner)
router.post('/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string' || !sql.trim()) {
    return res.status(400).json({ error: 'SQL query string is required' });
  }

  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();
  const startTime = performance.now();

  try {
    if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('EXPLAIN') || upper.startsWith('WITH')) {
      db.all(trimmed, [], (err, rows) => {
        const executionTime = (performance.now() - startTime).toFixed(2);
        if (err) {
          return res.status(400).json({
            error: err.message,
            executionTime: `${executionTime} ms`,
            success: false
          });
        }

        const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];
        res.json({
          success: true,
          type: 'SELECT',
          columns,
          rows: rows || [],
          rowCount: rows ? rows.length : 0,
          executionTime: `${executionTime} ms`
        });
      });
    } else {
      db.run(trimmed, [], function (err) {
        const executionTime = (performance.now() - startTime).toFixed(2);
        if (err) {
          return res.status(400).json({
            error: err.message,
            executionTime: `${executionTime} ms`,
            success: false
          });
        }

        res.json({
          success: true,
          type: 'MUTATION',
          changes: this.changes,
          lastID: this.lastID,
          message: `Query executed successfully. Changes: ${this.changes}, Last ID: ${this.lastID}`,
          executionTime: `${executionTime} ms`
        });
      });
    }
  } catch (err) {
    const executionTime = (performance.now() - startTime).toFixed(2);
    res.status(400).json({
      error: err.message,
      executionTime: `${executionTime} ms`,
      success: false
    });
  }
});

// GET audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await queryAll('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
