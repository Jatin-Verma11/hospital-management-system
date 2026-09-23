const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runCmd } = require('../db/database');

// GET all rooms & live occupancy (using vw_bed_occupancy)
router.get('/', async (req, res) => {
  try {
    const { status, type, ward } = req.query;
    let sql = 'SELECT * FROM vw_bed_occupancy WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND room_status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND room_type LIKE ?';
      params.push(`%${type}%`);
    }
    if (ward) {
      sql += ' AND ward_unit LIKE ?';
      params.push(`%${ward}%`);
    }

    sql += ' ORDER BY room_number ASC';
    const rooms = await queryAll(sql, params);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active admissions
router.get('/admissions', async (req, res) => {
  try {
    const admissions = await queryAll(`
      SELECT 
        adm.*,
        p.name as patient_name,
        p.mrn as patient_mrn,
        p.blood_group,
        p.phone as patient_phone,
        r.room_number,
        r.ward_unit,
        r.room_type,
        r.daily_rate,
        d.name as attending_doctor
      FROM admissions adm
      JOIN patients p ON adm.patient_id = p.patient_id
      JOIN rooms r ON adm.room_id = r.room_id
      LEFT JOIN doctors d ON adm.doctor_id = d.doctor_id
      ORDER BY adm.admit_date DESC
    `);
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Admit patient to room -> TRIGGERS trg_room_occupied
router.post('/admit', async (req, res) => {
  try {
    const { patient_id, room_id, doctor_id, admit_date, diagnosis, acuity_tier } = req.body;
    if (!patient_id || !room_id || !diagnosis) {
      return res.status(400).json({ error: 'Patient ID, Room ID, and Clinical Diagnosis are required' });
    }

    const room = await queryOne('SELECT * FROM rooms WHERE room_id = ?', [room_id]);
    if (!room) {
      return res.status(404).json({ error: 'Selected room not found' });
    }
    if (room.status === 'Occupied') {
      return res.status(400).json({ error: `Room ${room.room_number} is already occupied!` });
    }

    const today = admit_date || new Date().toISOString().split('T')[0];
    const result = await runCmd(
      'INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, status, diagnosis, acuity_tier) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient_id, room_id, doctor_id || 1, today, 'Admitted', diagnosis, acuity_tier || 'Standard Inpatient']
    );

    const admission = await queryOne(`
      SELECT 
        adm.*,
        p.name as patient_name,
        p.mrn as patient_mrn,
        r.room_number,
        r.ward_unit,
        r.status as updated_room_status
      FROM admissions adm
      JOIN patients p ON adm.patient_id = p.patient_id
      JOIN rooms r ON adm.room_id = r.room_id
      WHERE adm.admission_id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: `Patient admitted. SQLite trigger 'trg_room_occupied' updated Room ${admission.room_number} to Occupied.`,
      admission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Discharge patient -> TRIGGERS trg_room_available_discharge
router.post('/discharge', async (req, res) => {
  try {
    const { admission_id, discharge_date, generate_bill } = req.body;
    if (!admission_id) {
      return res.status(400).json({ error: 'Admission ID is required' });
    }

    const adm = await queryOne('SELECT * FROM admissions WHERE admission_id = ?', [admission_id]);
    if (!adm) {
      return res.status(404).json({ error: 'Admission record not found' });
    }
    if (adm.status === 'Discharged') {
      return res.status(400).json({ error: 'Patient is already discharged' });
    }

    const discDate = discharge_date || new Date().toISOString().split('T')[0];

    // Fires trg_room_available_discharge
    await runCmd(
      'UPDATE admissions SET status = ?, discharge_date = ? WHERE admission_id = ?',
      ['Discharged', discDate, admission_id]
    );

    let newBill = null;
    if (generate_bill !== false) {
      const room = await queryOne('SELECT * FROM rooms WHERE room_id = ?', [adm.room_id]);
      const admitD = new Date(adm.admit_date);
      const discD = new Date(discDate);
      const diffDays = Math.max(1, Math.ceil((discD - admitD) / (1000 * 60 * 60 * 24)));
      const stayCost = diffDays * (room ? room.daily_rate : 350);

      const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const billResult = await runCmd(
        'INSERT INTO bills (invoice_number, patient_id, admission_id, total_amount, paid_amount, payment_status, description, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [invNumber, adm.patient_id, admission_id, stayCost, 0, 'Unpaid', `Inpatient Stay: ${diffDays} day(s) in ${room ? room.ward_unit + ' (' + room.room_number + ')' : 'Room'}`, 'Pending Settlement']
      );
      newBill = await queryOne('SELECT * FROM bills WHERE bill_id = ?', [billResult.lastID]);
    }

    const roomStatus = await queryOne('SELECT status, room_number FROM rooms WHERE room_id = ?', [adm.room_id]);

    res.json({
      message: `Patient discharged. SQLite trigger 'trg_room_available_discharge' released Room ${roomStatus.room_number} to Available.`,
      bill: newBill
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
