const { db, initSchema, runCmd, queryOne } = require('./database');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('--- Initializing Clean MedCore Database Schema ---');
  // Re-run schema
  const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSql, async (err) => {
    if (err) {
      console.error('Schema exec error:', err);
      process.exit(1);
    }
    
    // Clear old data for fresh rich seeding
    await runCmd('DELETE FROM audit_logs');
    await runCmd('DELETE FROM bills');
    await runCmd('DELETE FROM prescriptions');
    await runCmd('DELETE FROM appointments');
    await runCmd('DELETE FROM admissions');
    await runCmd('DELETE FROM rooms');
    await runCmd('DELETE FROM patients');
    await runCmd('DELETE FROM doctors');
    await runCmd('DELETE FROM departments');

    console.log('--- Seeding Departments ---');
    const departments = [
      { name: 'Cardiology & Vascular', location: 'Building A, 3rd Floor', phone: '+1 555-0101', head: 'Dr. Sarah Jenkins' },
      { name: 'Neurology & Neurosurgery', location: 'Building B, 2nd Floor', phone: '+1 555-0102', head: 'Dr. Elena Rostova' },
      { name: 'Orthopedics & Trauma', location: 'Building A, 1st Floor', phone: '+1 555-0103', head: 'Dr. Priya Patel' },
      { name: 'Pediatrics & Neonatal', location: 'Building C, Ground Floor', phone: '+1 555-0104', head: 'Dr. Emily Taylor' },
      { name: 'Emergency & Critical Care', location: 'Emergency Wing, Ground Floor', phone: '+1 555-0199', head: 'Dr. James Mitchell' },
      { name: 'General & Internal Medicine', location: 'Building B, 1st Floor', phone: '+1 555-0105', head: 'Dr. Aisha Siddiqui' }
    ];

    for (const d of departments) {
      await runCmd('INSERT INTO departments (name, location, phone, head_doctor) VALUES (?, ?, ?, ?)', [d.name, d.location, d.phone, d.head]);
    }

    console.log('--- Seeding Doctors & Medical Staff ---');
    const doctors = [
      { code: 'DOC-101', name: 'Dr. Sarah Jenkins', spec: 'Interventional Cardiology', dept: 1, email: 's.jenkins@medcore.org', phone: '+1 555-1101', room: 'OPD-301', fee: 200, sal: 280000, days: 'Mon,Wed,Fri', shift: 'Shift 1 • 08:00 - 14:00' },
      { code: 'DOC-102', name: 'Dr. Michael Chen', spec: 'Cardiac Electrophysiology', dept: 1, email: 'm.chen@medcore.org', phone: '+1 555-1102', room: 'OPD-302', fee: 180, sal: 265000, days: 'Tue,Thu,Sat', shift: 'Shift 2 • 14:00 - 20:00' },
      { code: 'DOC-103', name: 'Dr. Elena Rostova', spec: 'Neurosurgeon', dept: 2, email: 'e.rostova@medcore.org', phone: '+1 555-1103', room: 'OPD-201', fee: 250, sal: 320000, days: 'Mon,Tue,Wed', shift: 'Shift 1 • 08:00 - 14:00' },
      { code: 'DOC-104', name: 'Dr. Marcus Vance', spec: 'Cognitive Neurology', dept: 2, email: 'm.vance@medcore.org', phone: '+1 555-1104', room: 'OPD-202', fee: 160, sal: 240000, days: 'Wed,Thu,Fri', shift: 'Shift 2 • 14:00 - 20:00' },
      { code: 'DOC-105', name: 'Dr. Priya Patel', spec: 'Joint Replacement & Spine', dept: 3, email: 'p.patel@medcore.org', phone: '+1 555-1105', room: 'OPD-101', fee: 190, sal: 290000, days: 'Mon,Wed,Fri', shift: 'Shift 1 • 08:00 - 14:00' },
      { code: 'DOC-106', name: 'Dr. David Kim', spec: 'Sports Injury Rehab', dept: 3, email: 'd.kim@medcore.org', phone: '+1 555-1106', room: 'OPD-102', fee: 150, sal: 230000, days: 'Tue,Thu,Sat', shift: 'Shift 2 • 14:00 - 20:00' },
      { code: 'DOC-107', name: 'Dr. Emily Taylor', spec: 'Neonatal Critical Care', dept: 4, email: 'e.taylor@medcore.org', phone: '+1 555-1107', room: 'OPD-401', fee: 175, sal: 220000, days: 'Mon,Tue,Wed,Thu', shift: 'Shift 1 • 08:00 - 14:00' },
      { code: 'DOC-108', name: 'Dr. James Mitchell', spec: 'Trauma & Emergency', dept: 5, email: 'j.mitchell@medcore.org', phone: '+1 555-1109', room: 'ER-BAY-1', fee: 220, sal: 310000, days: 'Mon,Tue,Wed,Thu,Fri', shift: 'Shift 2 • 14:00 - 22:00' },
      { code: 'DOC-109', name: 'Dr. Aisha Siddiqui', spec: 'Internal Medicine & Diabetology', dept: 6, email: 'a.siddiqui@medcore.org', phone: '+1 555-1110', room: 'OPD-105', fee: 140, sal: 215000, days: 'Mon,Wed,Fri', shift: 'Shift 1 • 08:00 - 14:00' }
    ];

    for (const doc of doctors) {
      await runCmd(
        'INSERT INTO doctors (doctor_code, name, specialization, department_id, email, phone, opd_room, consultation_fee, salary, available_days, shift) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [doc.code, doc.name, doc.spec, doc.dept, doc.email, doc.phone, doc.room, doc.fee, doc.sal, doc.days, doc.shift]
      );
    }

    console.log('--- Seeding Patients with MRN & Vitals ---');
    const patients = [
      { mrn: 'MRN-2024-0891', name: 'Eleanor Vance', age: 46, gender: 'Female', bg: 'A+', phone: '+1 555-2001', nid: 'US-982-11-4029', addr: '742 Evergreen Terr, Springfield', ec: '+1 555-9001', ward: 'Ward 4B - Cardiology Sub-acute', diag: 'Acute Coronary Syndrome, Post-PCI', bp: '128/84', hr: 76, spo2: 98, temp: 98.6, allerg: 'Penicillin, Shellfish', status: 'Admitted' },
      { mrn: 'MRN-2024-0412', name: 'Arthur Pendelton', age: 62, gender: 'Male', bg: 'B-', phone: '+1 555-2002', nid: 'US-441-89-1022', addr: '88 Maple St, Cambridge', ec: '+1 555-9002', ward: 'ICU-A Critical Intensive Care', diag: 'Acute Respiratory Failure & Septic Shock', bp: '95/62', hr: 114, spo2: 91, temp: 101.4, allerg: 'Sulfa Drugs', status: 'Critical / ICU' },
      { mrn: 'MRN-2024-1104', name: 'Sophia Martinez', age: 29, gender: 'Female', bg: 'O+', phone: '+1 555-2003', nid: 'US-102-77-9932', addr: '303 Chestnut Way, Boston', ec: '+1 555-9003', ward: 'Ward 2C - Surgical Recovery', diag: 'Post-Laparoscopic Cholecystectomy', bp: '118/76', hr: 72, spo2: 99, temp: 98.4, allerg: 'None Known', status: 'Admitted' },
      { mrn: 'MRN-2024-0733', name: 'Marcus Sterling', age: 58, gender: 'Male', bg: 'AB+', phone: '+1 555-2004', nid: 'US-554-20-4100', addr: '19 Elm Blvd, Newton', ec: '+1 555-9004', ward: 'Ward 2C - Surgical Recovery', diag: 'Lumbar L4-L5 Spinal Decompression', bp: '135/88', hr: 68, spo2: 97, temp: 98.8, allerg: 'Ibuprofen', status: 'Admitted' },
      { mrn: 'MRN-2024-0988', name: 'Liam Davies', age: 8, gender: 'Male', bg: 'O-', phone: '+1 555-2005', nid: 'US-883-11-2091', addr: '12 Oak Ridge Rd, Brookline', ec: '+1 555-9005', ward: 'Pediatric Day Wing', diag: 'Viral Bronchiolitis with Mild Hypoxemia', bp: '102/65', hr: 95, spo2: 96, temp: 99.8, allerg: 'None Known', status: 'Observation' },
      { mrn: 'MRN-2024-0219', name: 'Rachel Chang', age: 34, gender: 'Female', bg: 'B+', phone: '+1 555-2006', nid: 'US-390-12-8874', addr: '404 Pine Ave, Somerville', ec: '+1 555-9006', ward: 'Ward 4B - Cardiology Sub-acute', diag: 'Hypertensive Urgency, Titration Phase', bp: '162/98', hr: 88, spo2: 98, temp: 98.2, allerg: 'Latex', status: 'Admitted' },
      { mrn: 'MRN-2024-0651', name: 'Thomas Wright', age: 71, gender: 'Male', bg: 'A-', phone: '+1 555-2007', nid: 'US-771-00-3321', addr: '99 Sunset Blvd, Waltham', ec: '+1 555-9007', ward: 'General Medical Unit', diag: 'Bilateral Lobar Pneumonia', bp: '124/80', hr: 82, spo2: 97, temp: 98.6, allerg: 'None Known', status: 'Discharged' }
    ];

    for (const p of patients) {
      await runCmd(
        'INSERT INTO patients (mrn, name, age, gender, blood_group, phone, national_id, address, emergency_contact, admitting_ward, admitting_diagnosis, vitals_bp, vitals_hr, vitals_spo2, vitals_temp, allergies, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.mrn, p.name, p.age, p.gender, p.bg, p.phone, p.nid, p.addr, p.ec, p.ward, p.diag, p.bp, p.hr, p.spo2, p.temp, p.allerg, p.status]
      );
    }

    console.log('--- Seeding Wards & Hospital Beds ---');
    const rooms = [
      { num: 'BED-4B-01', ward: 'Ward 4B - Cardiology Sub-acute', type: 'Semi-Private', dept: 1, rate: 450 },
      { num: 'BED-4B-02', ward: 'Ward 4B - Cardiology Sub-acute', type: 'Semi-Private', dept: 1, rate: 450 },
      { num: 'BED-4B-03', ward: 'Ward 4B - Cardiology Sub-acute', type: 'Private Deluxe', dept: 1, rate: 750 },
      { num: 'ICU-A-01', ward: 'ICU-A Critical Intensive Care', type: 'ICU Critical', dept: 5, rate: 1400 },
      { num: 'ICU-A-02', ward: 'ICU-A Critical Intensive Care', type: 'ICU Critical', dept: 5, rate: 1400 },
      { num: 'ICU-A-03', ward: 'ICU-A Critical Intensive Care', type: 'ICU Critical', dept: 5, rate: 1400 },
      { num: 'BED-2C-01', ward: 'Ward 2C - Surgical Recovery', type: 'General Ward', dept: 3, rate: 250 },
      { num: 'BED-2C-02', ward: 'Ward 2C - Surgical Recovery', type: 'General Ward', dept: 3, rate: 250 },
      { num: 'BED-2C-03', ward: 'Ward 2C - Surgical Recovery', type: 'Private Deluxe', dept: 3, rate: 750 },
      { num: 'PED-01', ward: 'Pediatric Day Wing', type: 'General Ward', dept: 4, rate: 220 },
      { num: 'PED-02', ward: 'Pediatric Day Wing', type: 'General Ward', dept: 4, rate: 220 },
      { num: 'GEN-101', ward: 'General Medical Unit', type: 'General Ward', dept: 6, rate: 200 },
      { num: 'GEN-102', ward: 'General Medical Unit', type: 'General Ward', dept: 6, rate: 200 }
    ];

    for (const rm of rooms) {
      await runCmd(
        'INSERT INTO rooms (room_number, ward_unit, room_type, department_id, daily_rate) VALUES (?, ?, ?, ?, ?)',
        [rm.num, rm.ward, rm.type, rm.dept, rm.rate]
      );
    }

    console.log('--- Seeding Inpatient Admissions (Fires Triggers!) ---');
    const admissions = [
      { pid: 1, rid: 1, docId: 1, date: '2026-09-18', status: 'Admitted', diag: 'Acute Coronary Syndrome, Post-PCI', acuity: 'Cardiac / Telemetry' },
      { pid: 2, rid: 4, docId: 8, date: '2026-09-19', status: 'Admitted', diag: 'Acute Respiratory Failure & Septic Shock', acuity: 'Critical / High Acuity' },
      { pid: 3, rid: 7, docId: 5, date: '2026-09-20', status: 'Admitted', diag: 'Post-Laparoscopic Cholecystectomy', acuity: 'Standard Inpatient' },
      { pid: 4, rid: 8, docId: 5, date: '2026-09-21', status: 'Admitted', diag: 'Lumbar L4-L5 Spinal Decompression', acuity: 'Standard Inpatient' },
      { pid: 6, rid: 2, docId: 1, date: '2026-09-22', status: 'Admitted', diag: 'Hypertensive Urgency, Titration Phase', acuity: 'Cardiac / Telemetry' }
    ];

    for (const adm of admissions) {
      await runCmd(
        'INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, status, diagnosis, acuity_tier) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [adm.pid, adm.rid, adm.docId, adm.date, adm.status, adm.diag, adm.acuity]
      );
    }

    console.log('--- Seeding Appointments ---');
    const appointments = [
      { pid: 1, docId: 1, date: '2026-09-23', slot: '09:00 AM', token: 101, status: 'Completed', reason: 'Post-stent 7-day follow-up' },
      { pid: 3, docId: 5, date: '2026-09-23', slot: '10:00 AM', token: 102, status: 'In-Consultation', reason: 'Post-op dressing check' },
      { pid: 5, docId: 7, date: '2026-09-23', slot: '11:00 AM', token: 103, status: 'Scheduled', reason: 'Pediatric nebulization review' },
      { pid: 6, docId: 1, date: '2026-09-24', slot: '09:30 AM', token: 104, status: 'Scheduled', reason: 'BP ambulatory log analysis' },
      { pid: 7, docId: 9, date: '2026-09-24', slot: '10:30 AM', token: 105, status: 'Scheduled', reason: 'Pneumonia resolution chest X-ray' }
    ];

    for (const a of appointments) {
      await runCmd(
        'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, token_number, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [a.pid, a.docId, a.date, a.slot, a.token, a.status, a.reason]
      );
    }

    console.log('--- Seeding Prescriptions & Formulary ---');
    const prescriptions = [
      { apptId: 1, pid: 1, docId: 1, med: 'Atorvastatin 40mg', dose: '1 tab orally at bedtime', inst: 'Lipid lowering therapy. Monitor LFTs.', status: 'Dispensed' },
      { apptId: 1, pid: 1, docId: 1, med: 'Ticagrelor 90mg', dose: '1 tab twice daily', inst: 'Antiplatelet therapy for post-PCI.', status: 'Dispensed' },
      { apptId: 2, pid: 2, docId: 8, med: 'Norepinephrine IV', dose: '0.05 mcg/kg/min titrate', inst: 'Maintain MAP > 65 mmHg in ICU.', status: 'Dispensed' },
      { apptId: 3, pid: 3, docId: 5, med: 'Cefazolin 1g IV', dose: 'Every 8 hours x 3 doses', inst: 'Post-op surgical antibiotic prophylaxis.', status: 'Dispensed' },
      { apptId: 4, pid: 6, docId: 1, med: 'Amlodipine 5mg', dose: '1 tab daily in morning', inst: 'Blood pressure control titration.', status: 'Pending' }
    ];

    for (const rx of prescriptions) {
      await runCmd(
        'INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medicine, dosage, instructions, dispense_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [rx.apptId, rx.pid, rx.docId, rx.med, rx.dose, rx.inst, rx.status]
      );
    }

    console.log('--- Seeding Invoices & Financial Ledger ---');
    const bills = [
      { inv: 'INV-2024-1041', pid: 1, aid: 1, tot: 4250.00, paid: 4250.00, stat: 'Paid', desc: 'Cardiology Cath Lab & Inpatient Stay (Ward 4B)', meth: 'BlueCross Insurance' },
      { inv: 'INV-2024-1042', pid: 2, aid: 2, tot: 8900.00, paid: 4500.00, stat: 'Partial', desc: 'ICU Critical Care, Ventilator Support, Vasopressors', meth: 'Medicare Direct' },
      { inv: 'INV-2024-1043', pid: 3, aid: 3, tot: 3100.00, paid: 0.00, stat: 'Unpaid', desc: 'Surgical Ward Stay, Anesthesia, Pharmacy Disbursal', meth: 'Pending Settlement' },
      { inv: 'INV-2024-1044', pid: 4, aid: 4, tot: 5400.00, paid: 5400.00, stat: 'Paid', desc: 'Spine Surgery Procedure & Hardware Instrumentation', meth: 'Aetna Health Plan' },
      { inv: 'INV-2024-1045', pid: 6, aid: 5, tot: 1850.00, paid: 500.00, stat: 'Partial', desc: 'Cardiology Telemetry & Diagnostic Blood Chemistry', meth: 'Credit Card (Visa)' }
    ];

    for (const b of bills) {
      await runCmd(
        'INSERT INTO bills (invoice_number, patient_id, admission_id, total_amount, paid_amount, payment_status, description, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [b.inv, b.pid, b.aid, b.tot, b.paid, b.stat, b.desc, b.meth]
      );
    }

    console.log('=== MedCore Database Seeded Successfully! ===');
    process.exit(0);
  });
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
