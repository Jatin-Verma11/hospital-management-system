import React, { useState, useEffect } from 'react';
import { BedDouble, CheckCircle2, AlertCircle, LogOut, Plus, ShieldCheck } from 'lucide-react';

export default function Wards({ onOpenAdmit }) {
  const [rooms, setRooms] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggerNotice, setTriggerNotice] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/rooms?';
      if (typeFilter) url += `type=${encodeURIComponent(typeFilter)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;

      const [rms, adms] = await Promise.all([
        fetch(url).then(r => r.json()),
        fetch('/api/rooms/admissions').then(r => r.json())
      ]);

      setRooms(rms);
      setAdmissions(adms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const handleDischarge = async (roomId, patientName) => {
    // Find active admission for this room
    const adm = admissions.find(a => a.room_id === roomId && a.status === 'Admitted');
    if (!adm) {
      alert('Could not locate active admission record for this room.');
      return;
    }

    if (!window.confirm(`Discharge patient "${patientName}" from room?\n\nThis will trigger SQLite trigger "trg_room_available_discharge" and auto-calculate stay invoice.`)) {
      return;
    }

    try {
      const res = await fetch('/api/rooms/discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: adm.admission_id,
          generate_bill: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTriggerNotice(data.message);
      setTimeout(() => setTriggerNotice(''), 7000);
      fetchData();
    } catch (err) {
      alert('Error discharging patient: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Wards & Bed Allocation Map</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Powered by SQL View <code className="font-mono">vw_bed_occupancy</code> with Triggers for automated room status toggles.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAdmit}>
          <Plus size={16} />
          <span>Admit Patient to Room</span>
        </button>
      </div>

      {/* Trigger Notification Alert */}
      {triggerNotice && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: 'var(--emerald)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <ShieldCheck size={20} />
          <div>
            <strong>DBMS Trigger Fired:</strong> {triggerNotice}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Room Status:</span>
          {['', 'Available', 'Occupied'].map(st => (
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
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ward Type:</span>
          <select 
            className="form-select"
            style={{ width: '180px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Ward Types</option>
            <option value="ICU">ICU</option>
            <option value="Private Deluxe">Private Deluxe</option>
            <option value="Semi-Private">Semi-Private</option>
            <option value="General Ward">General Ward</option>
          </select>
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="bed-grid">
        {loading ? (
          <div style={{ color: 'var(--text-dim)' }}>Loading ward rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={{ color: 'var(--text-dim)' }}>No rooms match the criteria.</div>
        ) : (
          rooms.map(rm => {
            const isOccupied = rm.room_status === 'Occupied';
            return (
              <div key={rm.room_id} className={`bed-card ${isOccupied ? 'occupied' : 'available'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isOccupied ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isOccupied ? 'var(--rose)' : 'var(--emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      <BedDouble size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{rm.room_number}</strong>
                    </div>
                  </div>

                  <span className={`badge ${isOccupied ? 'badge-danger' : 'badge-success'}`}>
                    {rm.room_status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <div><strong>{rm.room_type}</strong></div>
                  <div style={{ color: 'var(--text-dim)' }}>{rm.department_name} • ${rm.daily_rate}/day</div>
                </div>

                {isOccupied ? (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ color: 'var(--rose)', fontWeight: 600, marginBottom: '0.2rem' }}>
                      Patient: {rm.admitted_patient_name}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      Diagnosis: {rm.diagnosis || 'Under Observation'}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      Admitted: {rm.admit_date}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px dashed rgba(16, 185, 129, 0.25)',
                    fontSize: '0.8rem',
                    color: 'var(--emerald)',
                    textAlign: 'center',
                    marginBottom: '0.85rem'
                  }}>
                    Bed is Sanitized & Ready
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isOccupied ? (
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => handleDischarge(rm.room_id, rm.admitted_patient_name)}
                    >
                      <LogOut size={14} />
                      <span>Discharge Patient</span>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                      onClick={onOpenAdmit}
                    >
                      <span>Assign Patient</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
