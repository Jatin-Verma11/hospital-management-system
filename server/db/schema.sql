-- Hospital Management System - Relational DBMS Schema (SQLite)
PRAGMA foreign_keys = ON;

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    phone TEXT NOT NULL,
    head_doctor TEXT
);

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department_id INTEGER,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    opd_room TEXT DEFAULT 'Room 101',
    consultation_fee REAL DEFAULT 150.00,
    salary REAL NOT NULL,
    available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    shift TEXT DEFAULT 'Shift 1 • 08:00 - 14:00',
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mrn TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone TEXT NOT NULL,
    national_id TEXT,
    address TEXT,
    emergency_contact TEXT,
    admitting_ward TEXT,
    admitting_diagnosis TEXT,
    vitals_bp TEXT DEFAULT '120/80',
    vitals_hr INTEGER DEFAULT 74,
    vitals_spo2 INTEGER DEFAULT 98,
    vitals_temp REAL DEFAULT 98.6,
    allergies TEXT DEFAULT 'None Known',
    status TEXT DEFAULT 'Admitted' CHECK(status IN ('Admitted', 'Observation', 'Critical / ICU', 'Discharged')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROOMS / BEDS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL UNIQUE,
    ward_unit TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK(room_type IN ('General Ward', 'Semi-Private', 'Private Deluxe', 'ICU Critical')),
    department_id INTEGER,
    status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Occupied', 'Maintenance', 'Sanitizing')),
    daily_rate REAL NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    token_number INTEGER,
    status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'In-Consultation', 'Completed', 'Cancelled')),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 6. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    medicine TEXT NOT NULL,
    dosage TEXT NOT NULL,
    instructions TEXT,
    prescribed_date DATE DEFAULT (DATE('now')),
    dispense_status TEXT DEFAULT 'Pending' CHECK(dispense_status IN ('Pending', 'Dispensed', 'Cancelled')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 7. ADMISSIONS TABLE (INPATIENTS)
CREATE TABLE IF NOT EXISTS admissions (
    admission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    doctor_id INTEGER,
    admit_date DATE NOT NULL,
    discharge_date DATE,
    status TEXT DEFAULT 'Admitted' CHECK(status IN ('Admitted', 'Discharged')),
    diagnosis TEXT NOT NULL,
    acuity_tier TEXT DEFAULT 'Standard Inpatient',
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
);

-- 8. BILLS / INVOICES TABLE
CREATE TABLE IF NOT EXISTS bills (
    bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL,
    admission_id INTEGER,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'Unpaid' CHECK(payment_status IN ('Unpaid', 'Partial', 'Paid')),
    bill_date DATE DEFAULT (DATE('now')),
    description TEXT,
    payment_method TEXT DEFAULT 'Credit Card / Insurance',
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- ===================================================================
-- DATABASE TRIGGERS
-- ===================================================================

-- Trigger 1: Auto-update room status to 'Occupied' on new patient admission
CREATE TRIGGER IF NOT EXISTS trg_room_occupied
AFTER INSERT ON admissions
WHEN NEW.status = 'Admitted'
BEGIN
    UPDATE rooms SET status = 'Occupied' WHERE room_id = NEW.room_id;
    UPDATE patients SET status = 'Admitted', admitting_ward = (SELECT ward_unit FROM rooms WHERE room_id = NEW.room_id) WHERE patient_id = NEW.patient_id;
    INSERT INTO audit_logs (action, table_name, record_id, details)
    VALUES ('ADMISSION', 'admissions', NEW.admission_id, 
            'Patient #' || NEW.patient_id || ' admitted to Room ' || (SELECT room_number FROM rooms WHERE room_id = NEW.room_id));
END;

-- Trigger 2: Auto-update room status to 'Available' on patient discharge
CREATE TRIGGER IF NOT EXISTS trg_room_available_discharge
AFTER UPDATE OF status ON admissions
WHEN NEW.status = 'Discharged' AND OLD.status != 'Discharged'
BEGIN
    UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id;
    UPDATE patients SET status = 'Discharged' WHERE patient_id = NEW.patient_id;
    INSERT INTO audit_logs (action, table_name, record_id, details)
    VALUES ('DISCHARGE', 'admissions', NEW.admission_id, 
            'Patient #' || NEW.patient_id || ' discharged from Room ' || (SELECT room_number FROM rooms WHERE room_id = NEW.room_id));
END;

-- Trigger 3: Audit log on new patient registration
CREATE TRIGGER IF NOT EXISTS trg_audit_patient_insert
AFTER INSERT ON patients
BEGIN
    INSERT INTO audit_logs (action, table_name, record_id, details)
    VALUES ('INSERT', 'patients', NEW.patient_id, 'Registered: ' || NEW.name || ' (' || NEW.mrn || ', Blood: ' || NEW.blood_group || ')');
END;

-- ===================================================================
-- DATABASE VIEWS
-- ===================================================================

-- View 1: Doctor Workload Analytics
CREATE VIEW IF NOT EXISTS vw_doctor_workload AS
SELECT 
    d.doctor_id,
    d.doctor_code,
    d.name AS doctor_name,
    d.specialization,
    d.opd_room,
    dept.name AS department_name,
    COUNT(a.appointment_id) AS total_appointments,
    SUM(CASE WHEN a.status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled_appointments,
    SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments
FROM doctors d
LEFT JOIN departments dept ON d.department_id = dept.department_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY d.doctor_id, d.doctor_code, d.name, d.specialization, d.opd_room, dept.name;

-- View 2: Live Room & Bed Occupancy
CREATE VIEW IF NOT EXISTS vw_bed_occupancy AS
SELECT 
    r.room_id,
    r.room_number,
    r.ward_unit,
    r.room_type,
    r.daily_rate,
    r.status AS room_status,
    dept.name AS department_name,
    p.patient_id,
    p.mrn AS patient_mrn,
    p.name AS admitted_patient_name,
    p.blood_group,
    p.vitals_bp,
    p.vitals_hr,
    p.vitals_spo2,
    adm.admit_date,
    adm.diagnosis,
    adm.acuity_tier
FROM rooms r
LEFT JOIN departments dept ON r.department_id = dept.department_id
LEFT JOIN admissions adm ON r.room_id = adm.room_id AND adm.status = 'Admitted'
LEFT JOIN patients p ON adm.patient_id = p.patient_id;

-- View 3: Financial & Revenue Analytics Summary
CREATE VIEW IF NOT EXISTS vw_revenue_summary AS
SELECT 
    b.payment_status,
    COUNT(b.bill_id) AS total_invoices,
    ROUND(SUM(b.total_amount), 2) AS total_billed,
    ROUND(SUM(b.paid_amount), 2) AS total_collected,
    ROUND(SUM(b.total_amount - b.paid_amount), 2) AS total_outstanding
FROM bills b
GROUP BY b.payment_status;

-- View 4: Detailed Patient History Summary
CREATE VIEW IF NOT EXISTS vw_patient_history AS
SELECT 
    p.patient_id,
    p.mrn,
    p.name AS patient_name,
    p.age,
    p.gender,
    p.blood_group,
    p.phone,
    p.national_id,
    p.admitting_ward,
    p.admitting_diagnosis,
    p.vitals_bp,
    p.vitals_hr,
    p.vitals_spo2,
    p.vitals_temp,
    p.allergies,
    p.status AS clinical_status,
    COUNT(DISTINCT a.appointment_id) AS total_visits,
    COUNT(DISTINCT adm.admission_id) AS total_admissions,
    COALESCE(SUM(b.total_amount), 0) AS total_spent
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
LEFT JOIN admissions adm ON p.patient_id = adm.patient_id
LEFT JOIN bills b ON p.patient_id = b.patient_id
GROUP BY p.patient_id, p.mrn, p.name, p.age, p.gender, p.blood_group, p.phone, p.national_id, p.admitting_ward, p.admitting_diagnosis, p.vitals_bp, p.vitals_hr, p.vitals_spo2, p.vitals_temp, p.allergies, p.status;
