import React, { useState } from 'react';
import { Download, Copy, Check, Clock, Table as TableIcon } from 'lucide-react';

export default function SQLTable({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  if (!result.success) {
    return (
      <div style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(244, 63, 94, 0.1)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        color: 'var(--rose)',
        marginTop: '1.25rem'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>SQL Syntax / Execution Error:</div>
        <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{result.error}</pre>
        {result.executionTime && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-dim)' }}>
            Execution time: {result.executionTime}
          </div>
        )}
      </div>
    );
  }

  if (result.type === 'MUTATION') {
    return (
      <div style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: 'var(--emerald)',
        marginTop: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontWeight: 700 }}>Query Executed Successfully</div>
          <div style={{ fontSize: '0.85rem' }}>{result.message}</div>
        </div>
        <span className="badge badge-success">
          <Clock size={12} /> {result.executionTime}
        </span>
      </div>
    );
  }

  const { columns, rows, rowCount, executionTime } = result;

  const copyAsJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    if (!rows || rows.length === 0) return;
    const headers = columns.join(',');
    const csvRows = rows.map(r => 
      columns.map(c => {
        const val = r[c] === null ? '' : String(r[c]).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Table Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-primary">
            <TableIcon size={12} /> {rowCount} {rowCount === 1 ? 'Row' : 'Rows'}
          </span>
          <span className="badge badge-success">
            <Clock size={12} /> {executionTime}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={copyAsJson}>
            {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Result Grid */}
      <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>#</th>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  (0 rows returned)
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="font-mono" style={{ fontSize: '0.85rem' }}>
                      {row[col] === null ? (
                        <span style={{ color: 'var(--rose)', fontStyle: 'italic', opacity: 0.8 }}>NULL</span>
                      ) : typeof row[col] === 'boolean' ? (
                        row[col] ? 'TRUE' : 'FALSE'
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
