import React, { useState, useEffect } from 'react';
import { Database, Key, Link2, Eye, Zap, Table, ChevronDown, ChevronRight, Code } from 'lucide-react';

export default function SchemaViewer() {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState(null);
  const [activeTab, setActiveTab] = useState('tables'); // 'tables', 'triggers', 'views'

  useEffect(() => {
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        setSchema(data);
        if (data.tables && data.tables.length > 0) {
          setExpandedTable(data.tables[0].name);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !schema) {
    return (
      <div style={{ color: 'var(--text-dim)', padding: '2rem' }}>
        Loading DBMS Schema & Architecture...
      </div>
    );
  }

  const { tables, views, triggers } = schema;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>DBMS Architecture & Schema Visualizer</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
          Interactive schema inspector showing relational tables, foreign key constraints, automated triggers, and views.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${activeTab === 'tables' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tables')}
        >
          <Table size={16} />
          <span>Relational Tables ({tables.length})</span>
        </button>
        <button 
          className={`btn ${activeTab === 'triggers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('triggers')}
        >
          <Zap size={16} />
          <span>Automated Triggers ({triggers.length})</span>
        </button>
        <button 
          className={`btn ${activeTab === 'views' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('views')}
        >
          <Eye size={16} />
          <span>Database Views ({views.length})</span>
        </button>
      </div>

      {/* TAB 1: RELATIONAL TABLES */}
      {activeTab === 'tables' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {tables.map(tbl => {
            const isExpanded = expandedTable === tbl.name;
            return (
              <div key={tbl.name} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
                  onClick={() => setExpandedTable(isExpanded ? null : tbl.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Database size={18} color="var(--primary)" />
                    <strong style={{ fontSize: '1.15rem' }}>{tbl.name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-primary">
                      {tbl.rowCount} Records
                    </span>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>

                {/* Columns List */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Columns & Data Types:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {tbl.columns.map(col => (
                      <div 
                        key={col.cid} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.65rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {col.isPrimaryKey ? (
                            <span title="Primary Key" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                              <Key size={13} />
                              <span>{col.name}</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{col.name}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                            {col.type || 'ANY'}
                          </span>
                          {col.notNull && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--rose)', fontWeight: 600 }}>
                              NOT NULL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foreign Keys List */}
                {tbl.foreignKeys.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Foreign Key References (FK):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {tbl.foreignKeys.map((fk, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            padding: '0.4rem 0.65rem',
                            background: 'rgba(99, 102, 241, 0.08)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Link2 size={14} color="var(--secondary)" />
                          <span>
                            <code className="font-mono">{fk.from}</code> ➔ <code className="font-mono">{fk.table}({fk.to})</code>
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            CASCADE / {fk.onDelete}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DDL SQL Drawer */}
                {isExpanded && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
                      SQL CREATE DDL:
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '0.75rem',
                      background: '#070a12',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {tbl.sql}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AUTOMATED TRIGGERS */}
      {activeTab === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {triggers.map(trg => (
            <div key={trg.name} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Zap size={20} color="var(--amber)" />
                  <strong style={{ fontSize: '1.15rem' }}>{trg.name}</strong>
                </div>
                <span className="badge badge-warning">
                  ON TABLE: {trg.tbl_name}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Automates relational state changes & audit logging without requiring manual application intervention.
              </div>

              <pre style={{
                margin: 0,
                padding: '1rem',
                background: '#070a12',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: '#f59e0b',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {trg.sql}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DATABASE VIEWS */}
      {activeTab === 'views' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {views.map(vw => (
            <div key={vw.name} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Eye size={20} color="var(--primary)" />
                  <strong style={{ fontSize: '1.15rem' }}>{vw.name}</strong>
                </div>
                <span className="badge badge-primary">
                  VIRTUAL TABLE VIEW
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Precompiled SQL query enabling fast analytical reporting and decoupled queries.
              </div>

              <pre style={{
                margin: 0,
                padding: '1rem',
                background: '#070a12',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: '#38bdf8',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {vw.sql}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
