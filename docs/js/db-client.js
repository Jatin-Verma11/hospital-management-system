// MedCore HMS - In-Browser SQLite Engine & API Proxy (Enables 100% GitHub Pages Deployment)
(function() {
  window.MedCoreDB = {
    isLocalFallback: false,
    db: null,
    readyPromise: null,

    init: function() {
      if (this.readyPromise) return this.readyPromise;
      this.readyPromise = this._checkBackendAndInit();
      return this.readyPromise;
    },

    _checkBackendAndInit: async function() {
      try {
        const ping = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
        if (ping.ok) {
          console.log('📡 Connected to active Express backend.');
          return;
        }
      } catch (e) {
        // Backend unreachable (e.g. running on GitHub Pages)
      }

      console.log('⚡ Standalone mode detected (GitHub Pages). Booting WebAssembly SQLite engine...');
      this.isLocalFallback = true;
      await this._bootWasmSqlite();
    },

    _bootWasmSqlite: function() {
      return new Promise((resolve, reject) => {
        // Load sql.js script dynamically if not present
        if (!window.initSqlJs) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js';
          script.onload = () => this._createDbInstance().then(resolve).catch(reject);
          script.onerror = reject;
          document.head.appendChild(script);
        } else {
          this._createDbInstance().then(resolve).catch(reject);
        }
      });
    },

    _createDbInstance: async function() {
      const SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });

      const savedData = localStorage.getItem('medcore_sqlite_db');
      if (savedData) {
        try {
          const uInt8Array = new Uint8Array(JSON.parse(savedData));
          this.db = new SQL.Database(uInt8Array);
          console.log('Restored SQLite state from localStorage.');
          return;
        } catch (e) {
          console.warn('Could not restore from localStorage, creating fresh DB:', e);
        }
      }

      this.db = new SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON;');
      this._seedInitialData();
      this.save();
    },

    save: function() {
      if (this.db) {
        try {
          const binary = this.db.export();
          localStorage.setItem('medcore_sqlite_db', JSON.stringify(Array.from(binary)));
        } catch (e) {
          console.warn('Storage quota exceeded, state kept in memory.');
        }
      }
    },

    _seedInitialData: function() {
      const ddl = `
        CREATE TABLE departments (department_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, location TEXT NOT NULL, phone TEXT NOT NULL, head_doctor TEXT);
        CREATE TABLE doctors (doctor_id INTEGER PRIMARY KEY AUTOINCREMENT, doctor_code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, specialization TEXT NOT NULL, department_id INTEGER, email TEXT UNIQUE NOT NULL, phone TEXT NOT NULL, opd_room TEXT DEFAULT 'Room 101', consultation_fee REAL DEFAULT 150.00, salary REAL NOT NULL, available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri', shift TEXT DEFAULT 'Shift 1 • 08:00 - 14:00');
        CREATE TABLE patients (patient_id INTEGER PRIMARY KEY AUTOINCREMENT, mrn TEXT UNIQUE NOT NULL, name TEXT NOT NULL, age INTEGER NOT NULL, gender TEXT NOT NULL, blood_group TEXT NOT NULL, phone TEXT NOT NULL, national_id TEXT, address TEXT, emergency_contact TEXT, admitting_ward TEXT, admitting_diagnosis TEXT, vitals_bp TEXT DEFAULT '120/80', vitals_hr INTEGER DEFAULT 74, vitals_spo2 INTEGER DEFAULT 98, vitals_temp REAL DEFAULT 98.6, allergies TEXT DEFAULT 'None Known', status TEXT DEFAULT 'Admitted', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE rooms (room_id INTEGER PRIMARY KEY AUTOINCREMENT, room_number TEXT NOT NULL UNIQUE, ward_unit TEXT NOT NULL, room_type TEXT NOT NULL, department_id INTEGER, status TEXT DEFAULT 'Available', daily_rate REAL NOT NULL);
        CREATE TABLE appointments (appointment_id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, appointment_date DATE NOT NULL, time_slot TEXT NOT NULL, token_number INTEGER, status TEXT DEFAULT 'Scheduled', reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE prescriptions (prescription_id INTEGER PRIMARY KEY AUTOINCREMENT, appointment_id INTEGER, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, medicine TEXT NOT NULL, dosage TEXT NOT NULL, instructions TEXT, prescribed_date DATE DEFAULT (DATE('now')), dispense_status TEXT DEFAULT 'Pending');
        CREATE TABLE admissions (admission_id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, room_id INTEGER NOT NULL, doctor_id INTEGER, admit_date DATE NOT NULL, discharge_date DATE, status TEXT DEFAULT 'Admitted', diagnosis TEXT NOT NULL, acuity_tier TEXT DEFAULT 'Standard Inpatient');
        CREATE TABLE bills (bill_id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number TEXT UNIQUE NOT NULL, patient_id INTEGER NOT NULL, admission_id INTEGER, total_amount REAL NOT NULL, paid_amount REAL DEFAULT 0, payment_status TEXT DEFAULT 'Unpaid', bill_date DATE DEFAULT (DATE('now')), description TEXT, payment_method TEXT DEFAULT 'Credit Card / Insurance');
        CREATE TABLE audit_logs (log_id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, table_name TEXT NOT NULL, record_id INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, details TEXT);

        -- TRIGGERS
        CREATE TRIGGER trg_room_occupied AFTER INSERT ON admissions WHEN NEW.status = 'Admitted' BEGIN UPDATE rooms SET status = 'Occupied' WHERE room_id = NEW.room_id; UPDATE patients SET status = 'Admitted', admitting_ward = (SELECT ward_unit FROM rooms WHERE room_id = NEW.room_id) WHERE patient_id = NEW.patient_id; INSERT INTO audit_logs (action, table_name, record_id, details) VALUES ('ADMISSION', 'admissions', NEW.admission_id, 'Patient #' || NEW.patient_id || ' admitted to Room ' || (SELECT room_number FROM rooms WHERE room_id = NEW.room_id)); END;
        CREATE TRIGGER trg_room_available_discharge AFTER UPDATE OF status ON admissions WHEN NEW.status = 'Discharged' AND OLD.status != 'Discharged' BEGIN UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id; UPDATE patients SET status = 'Discharged' WHERE patient_id = NEW.patient_id; INSERT INTO audit_logs (action, table_name, record_id, details) VALUES ('DISCHARGE', 'admissions', NEW.admission_id, 'Patient #' || NEW.patient_id || ' discharged from Room ' || (SELECT room_number FROM rooms WHERE room_id = NEW.room_id)); END;
        CREATE TRIGGER trg_audit_patient_insert AFTER INSERT ON patients BEGIN INSERT INTO audit_logs (action, table_name, record_id, details) VALUES ('INSERT', 'patients', NEW.patient_id, 'Registered: ' || NEW.name || ' (' || NEW.mrn || ', Blood: ' || NEW.blood_group || ')'); END;

        -- VIEWS
        CREATE VIEW vw_doctor_workload AS SELECT d.doctor_id, d.doctor_code, d.name AS doctor_name, d.specialization, d.opd_room, dept.name AS department_name, COUNT(a.appointment_id) AS total_appointments, SUM(CASE WHEN a.status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled_appointments, SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id LEFT JOIN appointments a ON d.doctor_id = a.doctor_id GROUP BY d.doctor_id, d.doctor_code, d.name, d.specialization, d.opd_room, dept.name;
        CREATE VIEW vw_bed_occupancy AS SELECT r.room_id, r.room_number, r.ward_unit, r.room_type, r.daily_rate, r.status AS room_status, dept.name AS department_name, p.patient_id, p.mrn AS patient_mrn, p.name AS admitted_patient_name, p.blood_group, p.vitals_bp, p.vitals_hr, p.vitals_spo2, adm.admit_date, adm.diagnosis, adm.acuity_tier FROM rooms r LEFT JOIN departments dept ON r.department_id = dept.department_id LEFT JOIN admissions adm ON r.room_id = adm.room_id AND adm.status = 'Admitted' LEFT JOIN patients p ON adm.patient_id = p.patient_id;
        CREATE VIEW vw_revenue_summary AS SELECT b.payment_status, COUNT(b.bill_id) AS total_invoices, ROUND(SUM(b.total_amount), 2) AS total_billed, ROUND(SUM(b.paid_amount), 2) AS total_collected, ROUND(SUM(b.total_amount - b.paid_amount), 2) AS total_outstanding FROM bills b GROUP BY b.payment_status;
        CREATE VIEW vw_patient_history AS SELECT p.patient_id, p.mrn, p.name AS patient_name, p.age, p.gender, p.blood_group, p.phone, p.national_id, p.admitting_ward, p.admitting_diagnosis, p.vitals_bp, p.vitals_hr, p.vitals_spo2, p.vitals_temp, p.allergies, p.status AS clinical_status, COUNT(DISTINCT a.appointment_id) AS total_visits, COUNT(DISTINCT adm.admission_id) AS total_admissions, COALESCE(SUM(b.total_amount), 0) AS total_spent FROM patients p LEFT JOIN appointments a ON p.patient_id = a.patient_id LEFT JOIN admissions adm ON p.patient_id = adm.patient_id LEFT JOIN bills b ON p.patient_id = b.patient_id GROUP BY p.patient_id, p.mrn, p.name, p.age, p.gender, p.blood_group, p.phone, p.national_id, p.admitting_ward, p.admitting_diagnosis, p.vitals_bp, p.vitals_hr, p.vitals_spo2, p.vitals_temp, p.allergies, p.status;

        -- SEED INITIAL DATA
        INSERT INTO departments (name, location, phone, head_doctor) VALUES 
          ('Cardiology & Vascular', 'Building A, 3rd Floor', '+1 555-0101', 'Dr. Sarah Jenkins'),
          ('Neurology & Neurosurgery', 'Building B, 2nd Floor', '+1 555-0102', 'Dr. Elena Rostova'),
          ('Orthopedics & Trauma', 'Building A, 1st Floor', '+1 555-0103', 'Dr. Priya Patel'),
          ('Pediatrics & Neonatal', 'Building C, Ground Floor', '+1 555-0104', 'Dr. Emily Taylor'),
          ('Emergency & Critical Care', 'Emergency Wing, Ground Floor', '+1 555-0199', 'Dr. James Mitchell'),
          ('General & Internal Medicine', 'Building B, 1st Floor', '+1 555-0105', 'Dr. Aisha Siddiqui');

        INSERT INTO doctors (doctor_code, name, specialization, department_id, email, phone, opd_room, consultation_fee, salary, available_days, shift) VALUES 
          ('DOC-101', 'Dr. Sarah Jenkins', 'Interventional Cardiology', 1, 's.jenkins@medcore.org', '+1 555-1101', 'OPD-301', 200, 280000, 'Mon,Wed,Fri', 'Shift 1 • 08:00 - 14:00'),
          ('DOC-102', 'Dr. Michael Chen', 'Cardiac Electrophysiology', 1, 'm.chen@medcore.org', '+1 555-1102', 'OPD-302', 180, 265000, 'Tue,Thu,Sat', 'Shift 2 • 14:00 - 20:00'),
          ('DOC-103', 'Dr. Elena Rostova', 'Neurosurgeon', 2, 'e.rostova@medcore.org', '+1 555-1103', 'OPD-201', 250, 320000, 'Mon,Tue,Wed', 'Shift 1 • 08:00 - 14:00'),
          ('DOC-104', 'Dr. Marcus Vance', 'Cognitive Neurology', 2, 'm.vance@medcore.org', '+1 555-1104', 'OPD-202', 160, 240000, 'Wed,Thu,Fri', 'Shift 2 • 14:00 - 20:00'),
          ('DOC-105', 'Dr. Priya Patel', 'Joint Replacement & Spine', 3, 'p.patel@medcore.org', '+1 555-1105', 'OPD-101', 190, 290000, 'Mon,Wed,Fri', 'Shift 1 • 08:00 - 14:00'),
          ('DOC-106', 'Dr. David Kim', 'Sports Injury Rehab', 3, 'd.kim@medcore.org', '+1 555-1106', 'OPD-102', 150, 230000, 'Tue,Thu,Sat', 'Shift 2 • 14:00 - 20:00'),
          ('DOC-107', 'Dr. Emily Taylor', 'Neonatal Critical Care', 4, 'e.taylor@medcore.org', '+1 555-1107', 'OPD-401', 175, 220000, 'Mon,Tue,Wed,Thu', 'Shift 1 • 08:00 - 14:00'),
          ('DOC-108', 'Dr. James Mitchell', 'Trauma & Emergency', 5, 'j.mitchell@medcore.org', '+1 555-1109', 'ER-BAY-1', 220, 310000, 'Mon,Tue,Wed,Thu,Fri', 'Shift 2 • 14:00 - 22:00'),
          ('DOC-109', 'Dr. Aisha Siddiqui', 'Internal Medicine & Diabetology', 6, 'a.siddiqui@medcore.org', '+1 555-1110', 'OPD-105', 140, 215000, 'Mon,Wed,Fri', 'Shift 1 • 08:00 - 14:00');

        INSERT INTO patients (mrn, name, age, gender, blood_group, phone, national_id, address, emergency_contact, admitting_ward, admitting_diagnosis, vitals_bp, vitals_hr, vitals_spo2, vitals_temp, allergies, status) VALUES 
          ('MRN-2024-0891', 'Eleanor Vance', 46, 'Female', 'A+', '+1 555-2001', 'US-982-11-4029', '742 Evergreen Terr, Springfield', '+1 555-9001', 'Ward 4B - Cardiology Sub-acute', 'Acute Coronary Syndrome, Post-PCI', '128/84', 76, 98, 98.6, 'Penicillin, Shellfish', 'Admitted'),
          ('MRN-2024-0412', 'Arthur Pendelton', 62, 'Male', 'B-', '+1 555-2002', 'US-441-89-1022', '88 Maple St, Cambridge', '+1 555-9002', 'ICU-A Critical Intensive Care', 'Acute Respiratory Failure & Septic Shock', '95/62', 114, 91, 101.4, 'Sulfa Drugs', 'Critical / ICU'),
          ('MRN-2024-1104', 'Sophia Martinez', 29, 'Female', 'O+', '+1 555-2003', 'US-102-77-9932', '303 Chestnut Way, Boston', '+1 555-9003', 'Ward 2C - Surgical Recovery', 'Post-Laparoscopic Cholecystectomy', '118/76', 72, 99, 98.4, 'None Known', 'Admitted'),
          ('MRN-2024-0733', 'Marcus Sterling', 58, 'Male', 'AB+', '+1 555-2004', 'US-554-20-4100', '19 Elm Blvd, Newton', '+1 555-9004', 'Ward 2C - Surgical Recovery', 'Lumbar L4-L5 Spinal Decompression', '135/88', 68, 97, 98.8, 'Ibuprofen', 'Admitted'),
          ('MRN-2024-0988', 'Liam Davies', 8, 'Male', 'O-', '+1 555-2005', 'US-883-11-2091', '12 Oak Ridge Rd, Brookline', '+1 555-9005', 'Pediatric Day Wing', 'Viral Bronchiolitis with Mild Hypoxemia', '102/65', 95, 96, 99.8, 'None Known', 'Observation'),
          ('MRN-2024-0219', 'Rachel Chang', 34, 'Female', 'B+', '+1 555-2006', 'US-390-12-8874', '404 Pine Ave, Somerville', '+1 555-9006', 'Ward 4B - Cardiology Sub-acute', 'Hypertensive Urgency, Titration Phase', '162/98', 88, 98, 98.2, 'Latex', 'Admitted'),
          ('MRN-2024-0651', 'Thomas Wright', 71, 'Male', 'A-', '+1 555-2007', 'US-771-00-3321', '99 Sunset Blvd, Waltham', '+1 555-9007', 'General Medical Unit', 'Bilateral Lobar Pneumonia', '124/80', 82, 97, 98.6, 'None Known', 'Discharged');

        INSERT INTO rooms (room_number, ward_unit, room_type, department_id, status, daily_rate) VALUES 
          ('BED-4B-01', 'Ward 4B - Cardiology Sub-acute', 'Semi-Private', 1, 'Occupied', 450),
          ('BED-4B-02', 'Ward 4B - Cardiology Sub-acute', 'Semi-Private', 1, 'Occupied', 450),
          ('BED-4B-03', 'Ward 4B - Cardiology Sub-acute', 'Private Deluxe', 1, 'Available', 750),
          ('ICU-A-01', 'ICU-A Critical Intensive Care', 'ICU Critical', 5, 'Occupied', 1400),
          ('ICU-A-02', 'ICU-A Critical Intensive Care', 'ICU Critical', 5, 'Available', 1400),
          ('BED-2C-01', 'Ward 2C - Surgical Recovery', 'General Ward', 3, 'Occupied', 250),
          ('BED-2C-02', 'Ward 2C - Surgical Recovery', 'General Ward', 3, 'Occupied', 250),
          ('PED-01', 'Pediatric Day Wing', 'General Ward', 4, 'Available', 220),
          ('GEN-101', 'General Medical Unit', 'General Ward', 6, 'Available', 200);

        INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, status, diagnosis, acuity_tier) VALUES 
          (1, 1, 1, '2026-09-18', 'Admitted', 'Acute Coronary Syndrome, Post-PCI', 'Cardiac / Telemetry'),
          (2, 4, 8, '2026-09-19', 'Admitted', 'Acute Respiratory Failure & Septic Shock', 'Critical / High Acuity'),
          (3, 6, 5, '2026-09-20', 'Admitted', 'Post-Laparoscopic Cholecystectomy', 'Standard Inpatient'),
          (4, 7, 5, '2026-09-21', 'Admitted', 'Lumbar L4-L5 Spinal Decompression', 'Standard Inpatient'),
          (6, 2, 1, '2026-09-22', 'Admitted', 'Hypertensive Urgency, Titration Phase', 'Cardiac / Telemetry');

        INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, token_number, status, reason) VALUES 
          (1, 1, '2026-09-23', '09:00 AM', 101, 'Completed', 'Post-stent 7-day follow-up'),
          (3, 5, '2026-09-23', '10:00 AM', 102, 'In-Consultation', 'Post-op dressing check'),
          (5, 7, '2026-09-23', '11:00 AM', 103, 'Scheduled', 'Pediatric nebulization review'),
          (6, 1, '2026-09-24', '09:30 AM', 104, 'Scheduled', 'BP ambulatory log analysis'),
          (7, 9, '2026-09-24', '10:30 AM', 105, 'Scheduled', 'Pneumonia resolution chest X-ray');

        INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medicine, dosage, instructions, dispense_status) VALUES 
          (1, 1, 1, 'Atorvastatin 40mg', '1 tab orally at bedtime', 'Lipid lowering therapy. Monitor LFTs.', 'Dispensed'),
          (1, 1, 1, 'Ticagrelor 90mg', '1 tab twice daily', 'Antiplatelet therapy for post-PCI.', 'Dispensed'),
          (2, 2, 8, 'Norepinephrine IV', '0.05 mcg/kg/min titrate', 'Maintain MAP > 65 mmHg in ICU.', 'Dispensed'),
          (3, 3, 5, 'Cefazolin 1g IV', 'Every 8 hours x 3 doses', 'Post-op surgical antibiotic prophylaxis.', 'Dispensed'),
          (4, 6, 1, 'Amlodipine 5mg', '1 tab daily in morning', 'Blood pressure control titration.', 'Pending');

        INSERT INTO bills (invoice_number, patient_id, admission_id, total_amount, paid_amount, payment_status, description, payment_method) VALUES 
          ('INV-2024-1041', 1, 1, 4250.00, 4250.00, 'Paid', 'Cardiology Cath Lab & Inpatient Stay (Ward 4B)', 'BlueCross Insurance'),
          ('INV-2024-1042', 2, 2, 8900.00, 4500.00, 'Partial', 'ICU Critical Care, Ventilator Support, Vasopressors', 'Medicare Direct'),
          ('INV-2024-1043', 3, 3, 3100.00, 0.00, 'Unpaid', 'Surgical Ward Stay, Anesthesia, Pharmacy Disbursal', 'Pending Settlement'),
          ('INV-2024-1044', 4, 4, 5400.00, 5400.00, 'Paid', 'Spine Surgery Procedure & Hardware Instrumentation', 'Aetna Health Plan'),
          ('INV-2024-1045', 6, 5, 1850.00, 500.00, 'Partial', 'Cardiology Telemetry & Diagnostic Blood Chemistry', 'Credit Card (Visa)');
      `;
      this.db.run(ddl);
    },

    query: function(sql) {
      if (!this.db) throw new Error('Database not initialized');
      const start = performance.now();
      const results = this.db.exec(sql);
      const executionTime = (performance.now() - start).toFixed(2) + ' ms';

      if (!results || results.length === 0) {
        this.save();
        return { success: true, type: 'MUTATION', changes: 0, executionTime };
      }

      const res = results[0];
      const rows = res.values.map(valArr => {
        const obj = {};
        res.columns.forEach((col, i) => { obj[col] = valArr[i]; });
        return obj;
      });

      this.save();
      return {
        success: true,
        type: 'SELECT',
        columns: res.columns,
        rows: rows,
        rowCount: rows.length,
        executionTime
      };
    }
  };

  // Auto-init on page load
  window.MedCoreDB.init();
})();
