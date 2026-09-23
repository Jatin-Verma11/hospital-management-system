import React from 'react';
import { 
  Activity, 
  Users, 
  UserCheck, 
  Calendar, 
  BedDouble, 
  Receipt, 
  Terminal, 
  Database,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Activity },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    { id: 'doctors', label: 'Doctors & Depts', icon: UserCheck },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'wards', label: 'Wards & Beds Map', icon: BedDouble },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'sql-console', label: 'Live SQL Console', icon: Terminal, highlight: true },
    { id: 'schema', label: 'DBMS Schema & ER', icon: Database }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
        }}>
          <Activity size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>PulseCare</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            DBMS Clinical Suite
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem 0.5rem' }}>
          Management
        </div>
        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </div>
          );
        })}

        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1.2rem 0.75rem 0.5rem' }}>
          DBMS Tools
        </div>
        {navItems.slice(6).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={item.highlight && !isActive ? { borderColor: 'rgba(56, 189, 248, 0.2)', background: 'rgba(14, 165, 233, 0.05)' } : {}}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  SQL
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom DBMS Status Badge */}
      <div style={{
        padding: '0.9rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SQLite 3 Engine</span>
          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ONLINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'var(--text-dim)' }}>
          <ShieldCheck size={14} color="var(--emerald)" />
          <span>FK Constraints Enforced</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          Triggers & Views Active
        </div>
      </div>
    </aside>
  );
}
