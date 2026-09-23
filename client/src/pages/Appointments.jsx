import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Filter, Plus } from 'lucide-react';

export default function Appointments({ onOpenNewAppointment }) {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = '/api/appointments?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (dateFilter) url += `date=${dateFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAppointments(appointments.map(a => 
          a.appointment_id === appointmentId ? { ...a, status: newStatus } : a
        ));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Appointments Schedule</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Relational JOIN between <code className="font-mono">appointments</code>, <code className="font-mono">patients</code>, and <code className="font-mono">doctors</code>.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewAppointment}>
          <Plus size={16} />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-dim)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status:</span>
          {['', 'Scheduled', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
            >
              {st || 'All'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date:</span>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '160px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Assigned Doctor</th>
              <th>Department</th>
              <th>Date & Slot</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No appointments found for the selected filter.
                </td>
              </tr>
            ) : (
              appointments.map(a => (
                <tr key={a.appointment_id}>
                  <td className="font-mono" style={{ color: 'var(--text-dim)' }}>
                    #{a.appointment_id}
                  </td>
                  <td>
                    <strong>{a.patient_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{a.patient_phone}</div>
                  </td>
                  <td>
                    <strong>{a.doctor_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{a.specialization}</div>
                  </td>
                  <td>{a.department_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--primary)" />
                      <span>{a.appointment_date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <Clock size={12} />
                      <span>{a.time_slot}</span>
                    </div>
                  </td>
                  <td>{a.reason}</td>
                  <td>
                    <span className={`badge ${a.status === 'Completed' ? 'badge-success' : a.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {a.status === 'Scheduled' && (
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--emerald)' }}
                          onClick={() => updateStatus(a.appointment_id, 'Completed')}
                          title="Mark as Completed"
                        >
                          <CheckCircle size={14} />
                          <span>Complete</span>
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--rose)' }}
                          onClick={() => updateStatus(a.appointment_id, 'Cancelled')}
                          title="Cancel Appointment"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
