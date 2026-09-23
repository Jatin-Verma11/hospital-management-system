const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./db/database');

const dashboardRouter = require('./routes/dashboard');
const patientsRouter = require('./routes/patients');
const doctorsRouter = require('./routes/doctors');
const appointmentsRouter = require('./routes/appointments');
const roomsRouter = require('./routes/rooms');
const billingRouter = require('./routes/billing');
const dbExplorerRouter = require('./routes/dbExplorer');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from public/
const publicDir = path.resolve(__dirname, 'public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/billing', billingRouter);
app.use('/api', dbExplorerRouter);

// Health check endpoint for cloud hosting / deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MedCore Hospital Management System (DBMS)',
    database: 'SQLite (PRAGMA foreign_keys = ON)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Clean Web Routes
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/patients', (req, res) => res.sendFile(path.join(publicDir, 'patients.html')));
app.get('/doctors', (req, res) => res.sendFile(path.join(publicDir, 'doctors.html')));
app.get('/wards', (req, res) => res.sendFile(path.join(publicDir, 'wards.html')));
app.get('/billing', (req, res) => res.sendFile(path.join(publicDir, 'billing.html')));
app.get('/schema', (req, res) => res.sendFile(path.join(publicDir, 'schema.html')));
app.get('/sql-console', (req, res) => res.sendFile(path.join(publicDir, 'sql-console.html')));
app.get('/audit-logs', (req, res) => res.sendFile(path.join(publicDir, 'sql-console.html')));

// Catch-all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start Full-Stack Server
async function start() {
  try {
    await initSchema();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🏥 MedCore Hospital Management System Online Server`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🗄️ Database: SQLite3 with FKs, Triggers & Views`);
      console.log(`🌍 Cloud Ready on port: ${PORT}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

start();
