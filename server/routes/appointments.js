const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runCmd } = require('../db/database');

// GET all appointments with patient & doctor JOINs
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;
    let sql = `
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        p.blood_group,
        d.name as doctor_name,
        d.specialization,
        dept.name as department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.time_slot ASC';
    const appointments = await queryAll(sql, params);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST book new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, time_slot, reason } = req.body;
    if (!patient_id || !doctor_id || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    const result = await runCmd(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, time_slot, 'Scheduled', reason || 'Consultation']
    );

    const newAppointment = await queryOne(`
      SELECT 
        a.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_id = ?
    `, [result.lastID]);

    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update status ('Scheduled', 'Completed', 'Cancelled')
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    await runCmd('UPDATE appointments SET status = ? WHERE appointment_id = ?', [status, req.params.id]);
    const updated = await queryOne('SELECT * FROM appointments WHERE appointment_id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create prescription for an appointment/patient
router.post('/prescriptions', async (req, res) => {
  try {
    const { appointment_id, patient_id, doctor_id, medicine, dosage, instructions } = req.body;
    if (!patient_id || !doctor_id || !medicine || !dosage) {
      return res.status(400).json({ error: 'Missing required prescription fields' });
    }

    const result = await runCmd(
      'INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medicine, dosage, instructions) VALUES (?, ?, ?, ?, ?, ?)',
      [appointment_id || null, patient_id, doctor_id, medicine, dosage, instructions || '']
    );

    const newPrescription = await queryOne('SELECT * FROM prescriptions WHERE prescription_id = ?', [result.lastID]);
    res.status(201).json(newPrescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
