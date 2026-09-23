import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, BedDouble, FileText, CheckCircle, Clock } from 'lucide-react';

// 1. ADD PATIENT MODAL
export function PatientModal({ isOpen, onClose, onPatientAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    address: '',
    emergency_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age, 10)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add patient');

      onPatientAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserPlus size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Register New Patient</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--rose)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="e.g. Eleanor Vance" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input 
                type="number" 
                required
                min="0"
                max="125"
                className="form-input" 
                placeholder="32" 
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select 
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group *</label>
              <select 
                className="form-select"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input 
                type="tel" 
                required
                className="form-input" 
                placeholder="+1 555-0123" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+1 555-0199" 
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="123 Hospital Way, Boston, MA" 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inserting into DB...' : 'Save Patient Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. BOOK APPOINTMENT MODAL
export function AppointmentModal({ isOpen, onClose, onAppointmentBooked }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState('09:00 AM');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/patients').then(res => res.json()).then(data => {
        setPatients(data);
        if (data.length > 0) setPatientId(data[0].patient_id);
      });
      fetch('/api/doctors').then(res => res.json()).then(data => {
        setDoctors(data);
        if (data.length > 0) setDoctorId(data[0].doctor_id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: date,
          time_slot: slot,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment');

      onAppointmentBooked(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Schedule Appointment</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--rose)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Patient (FK: patient_id) *</label>
            <select 
              className="form-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.patient_name} (Blood: {p.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Doctor (FK: doctor_id) *</label>
            <select 
              className="form-select"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {doctors.map(d => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.name} — {d.specialization} ({d.department_name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input 
                type="date" 
                required
                className="form-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <select 
                className="form-select"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
              >
                {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Chief Complaint / Reason *</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="e.g. Chest pain follow-up or routine checkup" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. ADMIT PATIENT MODAL (TRIGGERS SQLite trg_room_occupied)
export function AdmitModal({ isOpen, onClose, onPatientAdmitted }) {
  const [patients, setPatients] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/patients').then(res => res.json()).then(data => {
        setPatients(data);
        if (data.length > 0) setPatientId(data[0].patient_id);
      });
      fetch('/api/rooms?status=Available').then(res => res.json()).then(data => {
        setAvailableRooms(data);
        if (data.length > 0) setRoomId(data[0].room_id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomId) {
      setError('No rooms currently available!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          room_id: roomId,
          diagnosis
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to admit patient');

      onPatientAdmitted(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BedDouble size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Admit Inpatient to Ward</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          marginBottom: '1.25rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          💡 <strong>DBMS Trigger Highlight:</strong> Submitting will insert a record into <code className="font-mono">admissions</code> and automatically trigger <code className="font-mono">trg_room_occupied</code> to flip the selected room status to <strong>Occupied</strong>.
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--rose)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Patient *</label>
            <select 
              className="form-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.patient_name} ({p.blood_group}, {p.age} yrs)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Room *</label>
            {availableRooms.length === 0 ? (
              <div style={{ color: 'var(--rose)', fontSize: '0.88rem' }}>No rooms currently available!</div>
            ) : (
              <select 
                className="form-select"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                {availableRooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_number} — {r.room_type} ({r.department_name}) - ${r.daily_rate}/day
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Admitting Clinical Diagnosis *</label>
            <textarea 
              required
              rows={3}
              className="form-textarea" 
              placeholder="e.g. Acute Appendicitis requiring laparoscopic appendectomy and IV post-op antibiotics" 
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || availableRooms.length === 0}>
              {loading ? 'Executing Admission & Trigger...' : 'Execute Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. DETAILED PATIENT TIMELINE MODAL
export function PatientDetailsModal({ patientId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patientId) {
      setLoading(true);
      fetch(`/api/patients/${patientId}`)
        .then(res => res.json())
        .then(resData => {
          setData(resData);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-primary">Electronic Medical Record</span>
            <h2 style={{ fontSize: '1.45rem', marginTop: '0.35rem', marginBottom: 0 }}>
              {data?.patient ? data.patient.name : 'Loading...'}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>Loading medical record...</div>
        ) : !data || !data.patient ? (
          <div>Patient record not found</div>
        ) : (
          <div>
            {/* Demographics Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Age & Gender</span>
                <strong>{data.patient.age} yrs, {data.patient.gender}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Blood Group</span>
                <span className="badge badge-danger">{data.patient.blood_group}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Phone</span>
                <strong>{data.patient.phone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Emergency</span>
                <strong>{data.patient.emergency_contact || 'N/A'}</strong>
              </div>
            </div>

            {/* Prescriptions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" /> Prescriptions & Medications ({data.prescriptions.length})
              </h4>
              {data.prescriptions.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No active prescriptions recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.prescriptions.map(rx => (
                    <div key={rx.prescription_id} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>{rx.medicine}</strong> <span style={{ color: 'var(--primary)' }}>({rx.dosage})</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Prescribed by {rx.doctor_name} • {rx.instructions}
                        </div>
                      </div>
                      <span className="badge badge-purple">{rx.prescribed_date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inpatient Admissions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BedDouble size={18} color="var(--amber)" /> Admissions History ({data.admissions.length})
              </h4>
              {data.admissions.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No inpatient admissions on file.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.admissions.map(adm => (
                    <div key={adm.admission_id} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>Room {adm.room_number}</strong> ({adm.room_type})
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Diagnosis: {adm.diagnosis}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${adm.status === 'Admitted' ? 'badge-danger' : 'badge-success'}`}>
                          {adm.status}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          Admitted: {adm.admit_date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--emerald)" /> Invoices & Bills ({data.bills.length})
              </h4>
              {data.bills.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No billing records found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.bills.map(b => (
                    <div key={b.bill_id} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>Invoice #{b.bill_id}</strong>: {b.description}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Date: {b.bill_date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>${b.total_amount.toFixed(2)}</div>
                        <span className={`badge ${b.payment_status === 'Paid' ? 'badge-success' : b.payment_status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                          {b.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
