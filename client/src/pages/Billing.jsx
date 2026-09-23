import React, { useState, useEffect } from 'react';
import { Receipt, DollarSign, CheckCircle2, Clock, AlertTriangle, Plus, CreditCard } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Pay modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  // New Invoice modal state
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [newPatientId, setNewPatientId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaid, setNewPaid] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/billing?';
      if (statusFilter) url += `status=${statusFilter}&`;

      const [bList, bSum, pList] = await Promise.all([
        fetch(url).then(r => r.json()),
        fetch('/api/billing/summary').then(r => r.json()),
        fetch('/api/patients').then(r => r.json())
      ]);

      setBills(bList);
      setSummary(bSum);
      setPatients(pList);
      if (pList.length > 0) setNewPatientId(pList[0].patient_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill || !payAmount) return;

    try {
      const res = await fetch(`/api/billing/${selectedBill.bill_id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(payAmount) })
      });

      if (res.ok) {
        setPayModalOpen(false);
        setSelectedBill(null);
        setPayAmount('');
        fetchData();
      }
    } catch (err) {
      alert('Payment recording failed: ' + err.message);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: newPatientId,
          total_amount: parseFloat(newAmount),
          paid_amount: parseFloat(newPaid) || 0,
          description: newDesc
        })
      });

      if (res.ok) {
        setNewInvoiceOpen(false);
        setNewAmount('');
        setNewPaid('');
        setNewDesc('');
        fetchData();
      }
    } catch (err) {
      alert('Invoice generation failed: ' + err.message);
    }
  };

  const totalBilled = summary.reduce((acc, curr) => acc + (curr.total_billed || 0), 0);
  const totalCollected = summary.reduce((acc, curr) => acc + (curr.total_collected || 0), 0);
  const totalOutstanding = summary.reduce((acc, curr) => acc + (curr.total_outstanding || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Billing & Financial Settlements</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Managed via table <code className="font-mono">bills</code> and analytical view <code className="font-mono">vw_revenue_summary</code>.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setNewInvoiceOpen(true)}>
          <Plus size={16} />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="kpi-grid">
        <StatCard 
          title="Total Invoiced" 
          value={totalBilled} 
          formatCurrency={true}
          sub="Gross hospital billings"
          icon={Receipt}
        />
        <StatCard 
          title="Collected Payments" 
          value={totalCollected} 
          formatCurrency={true}
          sub={`Settled from patients`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard 
          title="Outstanding Balance" 
          value={totalOutstanding} 
          formatCurrency={true}
          sub="Pending collections"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Payment Status:</span>
        {['', 'Paid', 'Partial', 'Unpaid'].map(st => (
          <button
            key={st}
            className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(st)}
          >
            {st || 'All Invoices'}
          </button>
        ))}
      </div>

      {/* Bills Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Description / Services</th>
              <th>Total Billed</th>
              <th>Amount Paid</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No billing records match the filter.
                </td>
              </tr>
            ) : (
              bills.map(b => {
                const balance = Math.max(0, b.total_amount - b.paid_amount);
                return (
                  <tr key={b.bill_id}>
                    <td className="font-mono">#{b.bill_id}</td>
                    <td>
                      <strong>{b.patient_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{b.patient_phone}</div>
                    </td>
                    <td>{b.bill_date}</td>
                    <td>{b.description || 'Medical Services'}</td>
                    <td><strong>${b.total_amount.toFixed(2)}</strong></td>
                    <td style={{ color: 'var(--emerald)' }}>${b.paid_amount.toFixed(2)}</td>
                    <td style={{ color: balance > 0 ? 'var(--rose)' : 'var(--text-dim)', fontWeight: 600 }}>
                      ${balance.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${b.payment_status === 'Paid' ? 'badge-success' : b.payment_status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {b.payment_status !== 'Paid' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--emerald)' }}
                          onClick={() => {
                            setSelectedBill(b);
                            setPayAmount(String(balance));
                            setPayModalOpen(true);
                          }}
                        >
                          <CreditCard size={14} />
                          <span>Record Pay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {payModalOpen && selectedBill && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Record Patient Payment</h3>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Invoice #{selectedBill.bill_id} for <strong>{selectedBill.patient_name}</strong>
              <div style={{ marginTop: '0.35rem' }}>
                Total: ${selectedBill.total_amount.toFixed(2)} • Already Paid: ${selectedBill.paid_amount.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePaySubmit}>
              <div className="form-group">
                <label className="form-label">Payment Amount ($) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  max={selectedBill.total_amount - selectedBill.paid_amount}
                  className="form-input" 
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {newInvoiceOpen && (
        <div className="modal-overlay" onClick={() => setNewInvoiceOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create New Medical Invoice</h3>
            
            <form onSubmit={handleCreateInvoice}>
              <div className="form-group">
                <label className="form-label">Select Patient (FK: patient_id) *</label>
                <select 
                  className="form-select"
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                >
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      #{p.patient_id} - {p.patient_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Total Amount ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="form-input"
                    placeholder="350.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Paid Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input"
                    placeholder="0.00"
                    value={newPaid}
                    onChange={(e) => setNewPaid(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Description *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="e.g. Diagnostic Ultrasound & Specialized Consultation"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewInvoiceOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
