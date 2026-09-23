import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Wards from './pages/Wards';
import Billing from './pages/Billing';
import SqlConsole from './pages/SqlConsole';
import SchemaViewer from './pages/SchemaViewer';
import { PatientModal, AppointmentModal, AdmitModal } from './components/Modals';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('pulse_theme') || 'dark');
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Action Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDataChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenNewPatient={() => setIsPatientModalOpen(true)}
          onOpenNewAppointment={() => setIsAppointmentModalOpen(true)}
          onOpenAdmit={() => setIsAdmitModalOpen(true)}
        />

        {/* Viewport for Active Screen */}
        <main className="content-viewport" key={refreshKey}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab}
              onOpenAdmit={() => setIsAdmitModalOpen(true)}
              onOpenNewAppointment={() => setIsAppointmentModalOpen(true)}
            />
          )}

          {activeTab === 'patients' && (
            <Patients onOpenNewPatient={() => setIsPatientModalOpen(true)} />
          )}

          {activeTab === 'doctors' && (
            <Doctors />
          )}

          {activeTab === 'appointments' && (
            <Appointments onOpenNewAppointment={() => setIsAppointmentModalOpen(true)} />
          )}

          {activeTab === 'wards' && (
            <Wards onOpenAdmit={() => setIsAdmitModalOpen(true)} />
          )}

          {activeTab === 'billing' && (
            <Billing />
          )}

          {activeTab === 'sql-console' && (
            <SqlConsole />
          )}

          {activeTab === 'schema' && (
            <SchemaViewer />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
        onPatientAdded={() => {
          handleDataChanged();
          setActiveTab('patients');
        }}
      />

      <AppointmentModal 
        isOpen={isAppointmentModalOpen} 
        onClose={() => setIsAppointmentModalOpen(false)} 
        onAppointmentBooked={() => {
          handleDataChanged();
          setActiveTab('appointments');
        }}
      />

      <AdmitModal 
        isOpen={isAdmitModalOpen} 
        onClose={() => setIsAdmitModalOpen(false)} 
        onPatientAdmitted={() => {
          handleDataChanged();
          setActiveTab('wards');
        }}
      />
    </div>
  );
}
