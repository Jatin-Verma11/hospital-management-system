import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  BedDouble, 
  Receipt, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Dashboard({ setActiveTab, onOpenAdmit, onOpenNewAppointment }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <Activity className="pulse-dot" />
          <span>Loading DBMS Analytical Dashboard...</span>
        </div>
      </div>
    );
  }

  const { stats, doctorWorkload, bedOccupancy, recentAuditLogs } = data;

  return (
    <div>
      {/* Top Banner Alert showcasing DBMS features */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.12))',
        border: '1px solid var(--border-highlight)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Active DBMS Relational Architecture</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Enforcing Foreign Key integrity, automated SQL triggers (Admissions ⇄ Bed Status), and analytical SQL views.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('sql-console')}>
            <span>Open SQL Console</span>
            <ArrowUpRight size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('schema')}>
            <span>View Schema & ER</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <StatCard 
          title="Total Patients" 
          value={stats.totalPatients} 
          sub="Registered in database"
          icon={Users}
          color="emerald"
        />
        <StatCard 
          title="Medical Staff" 
          value={stats.totalDoctors} 
          sub="6 Specialized departments"
          icon={UserCheck}
        />
        <StatCard 
          title="Bed Occupancy" 
          value={`${stats.bedOccupancyRate}%`} 
          sub={`${stats.occupiedRooms} occupied / ${stats.availableRooms} available`}
          icon={BedDouble}
          color={stats.bedOccupancyRate > 75 ? 'rose' : stats.bedOccupancyRate > 40 ? 'amber' : 'emerald'}
        />
        <StatCard 
          title="Collected Revenue" 
          value={stats.collectedRevenue} 
          formatCurrency={true}
          sub={`Total Billed: $${stats.totalRevenue.toLocaleString()}`}
          icon={Receipt}
          color="purple"
        />
      </div>

      {/* 2-Column Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Doctor Workload (vw_doctor_workload) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-primary">SQL View: vw_doctor_workload</span>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.35rem', margin: 0 }}>Doctor Consultations Roster</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('doctors')}>
              View All
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {doctorWorkload.map(doc => (
                  <tr key={doc.doctor_id}>
                    <td>
                      <strong>{doc.doctor_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{doc.specialization}</div>
                    </td>
                    <td>{doc.department_name}</td>
                    <td><span className="badge badge-purple">{doc.total_appointments}</span></td>
                    <td><span className="badge badge-warning">{doc.scheduled_appointments}</span></td>
                    <td><span className="badge badge-success">{doc.completed_appointments}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Bed Occupancy Status (vw_bed_occupancy) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-primary">SQL View: vw_bed_occupancy</span>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.35rem', margin: 0 }}>Active Inpatient Wards</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('wards')}>
              Manage Beds
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {bedOccupancy.slice(0, 5).map(rm => (
              <div key={rm.room_id} style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: rm.room_status === 'Occupied' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: rm.room_status === 'Occupied' ? 'var(--rose)' : 'var(--emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    {rm.room_number.split('-')[1] || rm.room_number}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {rm.room_number} • {rm.room_type}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {rm.room_status === 'Occupied' 
                        ? `Admitted: ${rm.admitted_patient_name} (${rm.diagnosis || 'Observation'})`
                        : `${rm.department_name} • Rate: $${rm.daily_rate}/day`}
                    </div>
                  </div>
                </div>

                <span className={`badge ${rm.room_status === 'Occupied' ? 'badge-danger' : 'badge-success'}`}>
                  {rm.room_status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Database Audit Trail (Audit Logs triggered by SQLite triggers) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-purple">Trigger Audit Trail: audit_logs</span>
            <h3 style={{ fontSize: '1.15rem', marginTop: '0.35rem', margin: 0 }}>Automated Database Audit Trail</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
            Refresh Logs
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
          {recentAuditLogs.map(log => (
            <div key={log.log_id} style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${log.action === 'INSERT' ? 'badge-primary' : log.action === 'ADMISSION' ? 'badge-danger' : 'badge-success'}`}>
                  {log.action} ON {log.table_name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {log.timestamp}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {log.details}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
