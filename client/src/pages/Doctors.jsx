import React, { useState, useEffect } from 'react';
import { UserCheck, Building2, Mail, Phone, Calendar, DollarSign } from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/doctors' + (selectedDept ? `?department_id=${selectedDept}` : '')).then(r => r.json()),
      fetch('/api/doctors/departments').then(r => r.json())
    ]).then(([docs, depts]) => {
      setDoctors(docs);
      setDepartments(depts);
      setLoading(false);
    });
  }, [selectedDept]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Doctors & Medical Staff</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
          Managed via table <code className="font-mono">doctors</code> with foreign key to <code className="font-mono">departments</code>.
        </p>
      </div>

      {/* Departments Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div 
          className={`glass-panel ${selectedDept === '' ? 'border-primary' : ''}`}
          style={{ padding: '1rem', cursor: 'pointer', borderColor: selectedDept === '' ? 'var(--primary)' : 'var(--border-color)' }}
          onClick={() => setSelectedDept('')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Building2 size={16} color="var(--primary)" />
            <strong style={{ fontSize: '0.9rem' }}>All Departments</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {doctors.length} Doctors
          </div>
        </div>

        {departments.map(dept => (
          <div 
            key={dept.department_id}
            className="glass-panel"
            style={{ 
              padding: '1rem', 
              cursor: 'pointer', 
              borderColor: selectedDept === String(dept.department_id) ? 'var(--primary)' : 'var(--border-color)' 
            }}
            onClick={() => setSelectedDept(String(dept.department_id))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Building2 size={16} color="var(--secondary)" />
              <strong style={{ fontSize: '0.9rem' }}>{dept.name}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {dept.doctor_count} Staff • {dept.room_count} Rooms
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ color: 'var(--text-dim)' }}>Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div style={{ color: 'var(--text-dim)' }}>No doctors found in this department.</div>
        ) : (
          doctors.map(doc => {
            const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('');
            return (
              <div key={doc.doctor_id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{doc.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {doc.specialization}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {doc.department_name} ({doc.department_location})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} color="var(--text-dim)" />
                    <span>{doc.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="var(--text-dim)" />
                    <span>{doc.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="var(--text-dim)" />
                    <span>{doc.available_days}</span>
                  </div>
                </div>

                <div style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Total Appointments: <strong style={{ color: 'var(--text-main)' }}>{doc.total_appointments}</strong>
                  </div>
                  <span className="badge badge-success">
                    Active
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
