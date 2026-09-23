const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runCmd } = require('../db/database');

// GET all bills
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        b.*,
        p.name as patient_name,
        p.mrn as patient_mrn,
        p.phone as patient_phone,
        p.blood_group
      FROM bills b
      JOIN patients p ON b.patient_id = p.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND b.payment_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.bill_date DESC, b.bill_id DESC';
    const bills = await queryAll(sql, params);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET dispensary queue / prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await queryAll(`
      SELECT 
        rx.*,
        p.name as patient_name,
        p.mrn as patient_mrn,
        p.blood_group,
        p.admitting_ward,
        d.name as doctor_name,
        d.specialization
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.patient_id
      JOIN doctors d ON rx.doctor_id = d.doctor_id
      ORDER BY rx.prescribed_date DESC
    `);
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH dispense prescription
router.patch('/prescriptions/:id/dispense', async (req, res) => {
  try {
    await runCmd('UPDATE prescriptions SET dispense_status = ? WHERE prescription_id = ?', ['Dispensed', req.params.id]);
    res.json({ message: 'Prescription marked as Dispensed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET revenue summary view
router.get('/summary', async (req, res) => {
  try {
    const summary = await queryAll('SELECT * FROM vw_revenue_summary');
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create invoice
router.post('/', async (req, res) => {
  try {
    const { patient_id, admission_id, total_amount, paid_amount, description, payment_method } = req.body;
    if (!patient_id || !total_amount) {
      return res.status(400).json({ error: 'Patient ID and Total Amount are required' });
    }

    const total = parseFloat(total_amount);
    const paid = parseFloat(paid_amount) || 0;
    const status = paid >= total ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');
    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await runCmd(
      'INSERT INTO bills (invoice_number, patient_id, admission_id, total_amount, paid_amount, payment_status, description, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [invNumber, patient_id, admission_id || null, total, paid, status, description || 'Pharmacy & Clinical Services', payment_method || 'Insurance Direct']
    );

    const newBill = await queryOne('SELECT * FROM bills WHERE bill_id = ?', [result.lastID]);
    res.status(201).json(newBill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH record payment
router.patch('/:id/pay', async (req, res) => {
  try {
    const billId = req.params.id;
    const { amount, payment_method } = req.body;
    const payment = parseFloat(amount);

    if (isNaN(payment) || payment <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const bill = await queryOne('SELECT * FROM bills WHERE bill_id = ?', [billId]);
    if (!bill) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const newPaid = Math.min(bill.total_amount, bill.paid_amount + payment);
    const newStatus = newPaid >= bill.total_amount ? 'Paid' : 'Partial';

    await runCmd(
      'UPDATE bills SET paid_amount = ?, payment_status = ?, payment_method = ? WHERE bill_id = ?',
      [newPaid, newStatus, payment_method || 'Credit Card Settlement', billId]
    );

    const updated = await queryOne('SELECT * FROM bills WHERE bill_id = ?', [billId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
