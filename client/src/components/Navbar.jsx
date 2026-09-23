import React from 'react';
import { Sun, Moon, Plus, UserPlus, CalendarPlus, BedDouble } from 'lucide-react';

export default function Navbar({ activeTab, onOpenNewPatient, onOpenNewAppointment, onOpenAdmit, theme, toggleTheme }) {
  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Hospital Dashboard', desc: 'Real-time operational metrics & DBMS analytics' };
      case 'patients': return { title: 'Patient Directory', desc: 'Electronic medical records & visit histories' };
      case 'doctors': return { title: 'Doctors & Departments', desc: 'Staff directory, specializations & rosters' };
      case 'appointments': return { title: 'Appointments Schedule', desc: 'Outpatient bookings and status tracking' };
      case 'wards': return { title: 'Wards & Bed Allocation', desc: 'Real-time inpatient rooms & floor maps' };
      case 'billing': return { title: 'Invoicing & Payments', desc: 'Hospital finances, bill generation & settlement' };
      case 'sql-console': return { title: 'DBMS Live SQL Console', desc: 'Execute live SQL queries on SQLite database' };
      case 'schema': return { title: 'DBMS Schema & Architecture', desc: 'Relational tables, foreign keys, triggers & views' };
      default: return { title: 'Hospital Management', desc: 'Clinical DBMS suite' };
    }
  };

  const info = getPageInfo();

  return (
    <header className="topbar">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{info.title}</h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>{info.desc}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Quick Action Buttons */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenNewPatient}
          title="Register New Patient"
        >
          <UserPlus size={15} />
          <span>Add Patient</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenNewAppointment}
          title="Schedule Appointment"
        >
          <CalendarPlus size={15} />
          <span>Book Appointment</span>
        </button>

        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenAdmit}
          title="Admit Inpatient to Room"
        >
          <BedDouble size={15} />
          <span>Admit Patient</span>
        </button>

        {/* Database Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-muted)'
        }}>
          <span className="pulse-dot"></span>
          <span>hospital.db</span>
        </div>

        {/* Theme Toggle */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={toggleTheme}
          style={{ padding: '0.45rem', borderRadius: '50%' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
}
