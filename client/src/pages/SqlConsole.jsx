import React, { useState } from 'react';
import { Play, Sparkles, History, RotateCcw, Database, Terminal, Code2 } from 'lucide-react';
import SQLTable from '../components/SQLTable';

export default function SqlConsole() {
  const [sql, setSql] = useState('SELECT * FROM vw_doctor_workload;');
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState([
    'SELECT * FROM vw_doctor_workload;',
    'SELECT * FROM vw_bed_occupancy;',
    'SELECT * FROM audit_logs ORDER BY timestamp DESC;'
  ]);

  const queryPresets = [
    {
      title: '1. Doctor Workload View',
      category: 'SQL View',
      sql: `SELECT * FROM vw_doctor_workload ORDER BY total_appointments DESC;`
    },
    {
      title: '2. Live Bed Occupancy View',
      category: 'SQL View',
      sql: `SELECT room_number, room_type, department_name, room_status, admitted_patient_name, diagnosis \nFROM vw_bed_occupancy \nORDER BY room_status DESC, room_number ASC;`
    },
    {
      title: '3. Financial Analytics View',
      category: 'SQL View',
      sql: `SELECT * FROM vw_revenue_summary;`
    },
    {
      title: '4. Multi-Table JOIN (4 Tables)',
      category: 'Relational JOIN',
      sql: `SELECT \n  p.name AS patient_name,\n  d.name AS doctor_name,\n  dept.name AS department,\n  a.appointment_date,\n  a.time_slot,\n  a.status\nFROM appointments a\nJOIN patients p ON a.patient_id = p.patient_id\nJOIN doctors d ON a.doctor_id = d.doctor_id\nJOIN departments dept ON d.department_id = dept.department_id\nORDER BY a.appointment_date DESC;`
    },
    {
      title: '5. GROUP BY & HAVING Filter',
      category: 'Aggregation',
      sql: `SELECT \n  dept.name AS department,\n  COUNT(d.doctor_id) AS total_doctors,\n  ROUND(AVG(d.salary), 2) AS avg_doctor_salary\nFROM departments dept\nJOIN doctors d ON dept.department_id = d.department_id\nGROUP BY dept.name\nHAVING COUNT(d.doctor_id) >= 2\nORDER BY avg_doctor_salary DESC;`
    },
    {
      title: '6. Nested Subquery (Above Avg Bills)',
      category: 'Subquery',
      sql: `SELECT patient_id, name, age, blood_group, phone\nFROM patients\nWHERE patient_id IN (\n  SELECT patient_id FROM bills\n  WHERE total_amount > (SELECT AVG(total_amount) FROM bills)\n);`
    },
    {
      title: '7. Trigger Audit Trail Log',
      category: 'Triggers',
      sql: `SELECT log_id, action, table_name, details, timestamp \nFROM audit_logs \nORDER BY timestamp DESC \nLIMIT 20;`
    },
    {
      title: '8. Table Schema PRAGMA',
      category: 'Metadata',
      sql: `PRAGMA table_info(admissions);`
    },
    {
      title: '9. Foreign Keys PRAGMA',
      category: 'Metadata',
      sql: `PRAGMA foreign_key_list(admissions);`
    }
  ];

  const executeQuery = async (queryToRun) => {
    const query = queryToRun || sql;
    if (!query.trim()) return;

    setExecuting(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query })
      });

      const data = await res.json();
      setResult(data);

      if (!history.includes(query)) {
        setHistory([query, ...history.slice(0, 9)]);
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>DBMS Live SQL Query Console</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
          Execute ad-hoc relational queries, JOINs, aggregations, triggers inspection, and views against <code className="font-mono">hospital.db</code> in real-time.
        </p>
      </div>

      {/* Preset Query Chips */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--primary)" />
          <strong style={{ fontSize: '0.85rem' }}>DBMS Query Templates (Click to load & test):</strong>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {queryPresets.map((preset, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                setSql(preset.sql);
                executeQuery(preset.sql);
              }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[{preset.category}]</span> {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="sql-editor-container">
        <div className="sql-editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Terminal size={17} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              SQLite Query Editor (Press Ctrl+Enter / ⌘+Enter to Run)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSql('')}
              title="Clear SQL Editor"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => executeQuery()}
              disabled={executing || !sql.trim()}
            >
              <Play size={14} fill="#fff" />
              <span>{executing ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        <textarea
          className="sql-textarea"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter custom SQL query (e.g. SELECT * FROM patients WHERE age > 30;)"
          spellCheck={false}
        />
      </div>

      {/* Results Section */}
      <SQLTable result={result} />

      {/* Query History */}
      {history.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <History size={16} />
            <span>Recent Query History:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((q, idx) => (
              <div 
                key={idx}
                onClick={() => { setSql(q); executeQuery(q); }}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
