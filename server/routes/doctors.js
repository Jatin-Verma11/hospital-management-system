const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runCmd } = require('../db/database');

// GET all doctors with department details
router.get('/', async (req, res) => {
  try {
    const { department_id } = req.query;
    let sql = `
      SELECT 
        d.*, 
        dept.name as department_name, 
        dept.location as department_location,
        COUNT(a.appointment_id) as total_appointments
      FROM doctors d
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
    `;
    const params = [];

    if (department_id) {
      sql += ' WHERE d.department_id = ?';
      params.push(department_id);
    }

    sql += ' GROUP BY d.doctor_id ORDER BY d.name ASC';
    const doctors = await queryAll(sql, params);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await queryAll(`
      SELECT 
        dept.*,
        COUNT(DISTINCT d.doctor_id) as doctor_count,
        COUNT(DISTINCT r.room_id) as room_count
      FROM departments dept
      LEFT JOIN doctors d ON dept.department_id = d.department_id
      LEFT JOIN rooms r ON dept.department_id = r.department_id
      GROUP BY dept.department_id
      ORDER BY dept.name ASC
    `);
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new doctor
router.post('/', async (req, res) => {
  try {
    const { name, specialization, department_id, email, phone, salary, available_days } = req.body;
    if (!name || !specialization || !email || !phone) {
      return res.status(400).json({ error: 'Missing required doctor fields' });
    }

    const result = await runCmd(
      'INSERT INTO doctors (name, specialization, department_id, email, phone, salary, available_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, specialization, department_id || null, email, phone, salary || 200000, available_days || 'Mon,Tue,Wed,Thu,Fri']
    );

    const newDoc = await queryOne('SELECT * FROM doctors WHERE doctor_id = ?', [result.lastID]);
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
