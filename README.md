# 🏥 PulseCare Hospital Management System (DBMS Project)

A complete, full-stack Hospital Management System built to demonstrate core **Database Management System (DBMS)** principles alongside a modern web interface.

---

## 🌟 Highlights & DBMS Features

- **Relational Schema**: 9 interconnected relational tables (`departments`, `doctors`, `patients`, `rooms`, `appointments`, `prescriptions`, `admissions`, `bills`, `audit_logs`).
- **Integrity Constraints**: Enforced Primary Keys (`PK`), Foreign Keys (`FK`) with `ON DELETE CASCADE` and `ON DELETE SET NULL`.
- **Automated Database Triggers**:
  - `trg_room_occupied`: Automatically marks room status as `Occupied` upon patient admission.
  - `trg_room_available_discharge`: Automatically marks room status as `Available` upon patient discharge.
  - `trg_audit_patient_insert`: Automatically logs patient registration in `audit_logs`.
- **Database Views**:
  - `vw_doctor_workload`: Aggregates active patients & appointments per doctor.
  - `vw_bed_occupancy`: Real-time room availability per department with occupancy percentage.
  - `vw_revenue_summary`: Financial revenue split by status (Paid vs Outstanding).
  - `vw_patient_history`: Consolidated view of patient visits, admissions, and billing.
- **Interactive Live SQL Console**: Run raw SQL queries (`SELECT`, `JOIN`, `GROUP BY`, `HAVING`, `PRAGMA`) live on the SQLite database with execution timer in milliseconds, formatted data tables, and CSV export.
- **Visual ER Diagram & Schema Inspector**: In-depth inspection of all tables, columns, data types, foreign keys, and trigger DDLs.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm

### 1. Start the Backend API Server
```bash
cd server
npm install
npm run seed     # Seeds realistic initial hospital data (Patients, Doctors, Wards, etc.)
npm start        # Runs Express API on http://localhost:5001
```

### 2. Start the Frontend React Client
```bash
cd client
npm install
npm run dev      # Launches Vite dev server on http://localhost:3000
```

Open your browser at **`http://localhost:3000`** to interact with the application.

---

## 📊 Database Schema Summary

| Table | Description | Primary Key | Key Foreign Keys |
| :--- | :--- | :--- | :--- |
| `departments` | Medical divisions | `department_id` | - |
| `doctors` | Physicians & specialists | `doctor_id` | `department_id` ➔ `departments` |
| `patients` | Patient demographics | `patient_id` | - |
| `rooms` | Wards, ICUs & Private rooms | `room_id` | `department_id` ➔ `departments` |
| `appointments` | Outpatient bookings | `appointment_id` | `patient_id`, `doctor_id` |
| `prescriptions` | Medications & dosages | `prescription_id` | `patient_id`, `doctor_id`, `appointment_id` |
| `admissions` | Inpatient room stays | `admission_id` | `patient_id`, `room_id` |
| `bills` | Invoices & financial tracking | `bill_id` | `patient_id`, `admission_id` |
| `audit_logs` | Trigger-based audit trail | `log_id` | - |

---

## 💻 Tech Stack
- **Database**: SQLite 3 (PRAGMA foreign_keys = ON)
- **Backend**: Node.js, Express, `sqlite3`
- **Frontend**: React 19, Vite, Lucide Icons, Custom Glassmorphic CSS System

---

## 🌐 Live Demo

👉 **[Click here to view the live working website](https://jatin-verma11.github.io/hospital-management-system/)**

> The live demo runs entirely in your browser using an in-browser SQLite WebAssembly engine — no backend server required. All CRUD operations, triggers, views, and SQL console work locally in your browser.
