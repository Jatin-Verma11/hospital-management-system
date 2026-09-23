const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runCmd } = require('../db/database');

// GET all patients (uses vw_patient_history for consolidated metrics)
router.get('/', async (req, res) => {
  try {
    const { search, blood_group, status } = req.query;
    let sql = 'SELECT * FROM vw_patient_history WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (patient_name LIKE ? OR mrn LIKE ? OR phone LIKE ? OR national_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (blood_group) {
      sql += ' AND blood_group = ?';
      params.push(blood_group);
    }
    if (status && status !== 'all') {
      sql += ' AND clinical_status LIKE ?';
      params.push(`%${status}%`);
    }

    sql += ' ORDER BY patient_id DESC';
    const patients = await queryAll(sql, params);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single patient with medical timeline (Admissions, Appointments, Prescriptions, Bills)
router.get('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await queryOne('SELECT * FROM patients WHERE patient_id = ? OR mrn = ?', [patientId, patientId]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found' });
    }

    const actualId = patient.patient_id;

    const appointments = await queryAll(`
      SELECT a.*, d.name as doctor_name, d.specialization, d.opd_room
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `, [actualId]);

    const admissions = await queryAll(`
      SELECT adm.*, r.room_number, r.ward_unit, r.room_type, r.daily_rate, d.name as attending_doctor
      FROM admissions adm
      JOIN rooms r ON adm.room_id = r.room_id
      LEFT JOIN doctors d ON adm.doctor_id = d.doctor_id
      WHERE adm.patient_id = ?
      ORDER BY adm.admit_date DESC
    `, [actualId]);

    const prescriptions = await queryAll(`
      SELECT rx.*, d.name as doctor_name
      FROM prescriptions rx
      JOIN doctors d ON rx.doctor_id = d.doctor_id
      WHERE rx.patient_id = ?
      ORDER BY rx.prescribed_date DESC
    `, [actualId]);

    const bills = await queryAll(`
      SELECT * FROM bills WHERE patient_id = ? ORDER BY bill_date DESC
    `, [actualId]);

    res.json({
      patient,
      appointments,
      admissions,
      prescriptions,
      bills
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new patient (Triggers trg_audit_patient_insert)
router.post('/', async (req, res) => {
  try {
    const { 
      mrn, name, age, gender, blood_group, phone, national_id, 
      address, emergency_contact, admitting_ward, admitting_diagnosis,
      vitals_bp, vitals_hr, vitals_spo2, vitals_temp, allergies, status 
    } = req.body;

    if (!name || !age || !gender || !blood_group || !phone) {
      return res.status(400).json({ error: 'Missing required fields: Name, Age, Gender, Blood Group, Phone are required' });
    }

    const patientMrn = mrn || `MRN-2024-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await runCmd(`
      INSERT INTO patients (
        mrn, name, age, gender, blood_group, phone, national_id,
        address, emergency_contact, admitting_ward, admitting_diagnosis,
        vitals_bp, vitals_hr, vitals_spo2, vitals_temp, allergies, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      patientMrn,
      name,
      parseInt(age, 10),
      gender,
      blood_group,
      phone,
      national_id || `US-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`,
      address || 'Metropolitan Metro Area',
      emergency_contact || '+1 555-0199',
      admitting_ward || 'Triage & Observation Unit',
      admitting_diagnosis || 'Clinical Evaluation',
      vitals_bp || '120/80',
      vitals_hr ? parseInt(vitals_hr, 10) : 72,
      vitals_spo2 ? parseInt(vitals_spo2, 10) : 98,
      vitals_temp ? parseFloat(vitals_temp) : 98.6,
      allergies || 'None Known',
      status || 'Admitted'
    ]);

    const newPatient = await queryOne('SELECT * FROM patients WHERE patient_id = ?', [result.lastID]);
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    await runCmd('DELETE FROM patients WHERE patient_id = ?', [patientId]);
    res.json({ message: 'Patient record and related records deleted (Cascade)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
