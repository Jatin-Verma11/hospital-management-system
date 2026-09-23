import React, { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, Trash2, Eye, Droplet } from 'lucide-react';
import { PatientDetailsModal } from '../components/Modals';

export default function Patients({ onOpenNewPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let url = '/api/patients?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (bloodFilter) url += `blood_group=${encodeURIComponent(bloodFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [bloodFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleDelete = async (patientId, name) => {
    if (!window.confirm(`Are you sure you want to delete patient "${name}" (ID #${patientId})?\n\nNote: Database CASCADE rules will automatically delete all associated appointments, prescriptions, admissions, and bills!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      if (res.ok) {
        setPatients(patients.filter(p => p.patient_id !== patientId));
      }
    } catch (err) {
      alert('Error deleting patient: ' + err.message);
    }
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Registered Patients</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Managed via table <code className="font-mono">patients</code> with consolidated metrics from <code className="font-mono">vw_patient_history</code>.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewPatient}>
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '260px', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by patient name or phone number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplet size={16} color="var(--rose)" />
          <select 
            className="form-select" 
            style={{ width: '160px' }}
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Demographics</th>
              <th>Blood Group</th>
              <th>Phone</th>
              <th>Visits</th>
              <th>Admissions</th>
              <th>Total Billed</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  Loading patient records...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No matching patient records found.
                </td>
              </tr>
            ) : (
              patients.map(p => (
                <tr key={p.patient_id}>
                  <td>
                    <span className="font-mono" style={{ color: 'var(--text-dim)' }}>#{p.patient_id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.patient_name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {p.age} yrs • {p.gender}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-danger">
                      {p.blood_group}
                    </span>
                  </td>
                  <td>{p.phone}</td>
                  <td>
                    <span className="badge badge-primary">{p.total_visits}</span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{p.total_admissions}</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--emerald)' }}>
                      ${p.total_spent ? p.total_spent.toFixed(2) : '0.00'}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedPatientId(p.patient_id)}
                        title="View Medical Record"
                      >
                        <Eye size={14} color="var(--primary)" />
                        <span>EMR</span>
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.patient_id, p.patient_name)}
                        title="Delete Patient (Cascade)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Patient EMR Details Modal */}
      <PatientDetailsModal 
        patientId={selectedPatientId} 
        isOpen={!!selectedPatientId} 
        onClose={() => setSelectedPatientId(null)} 
      />
    </div>
  );
}
