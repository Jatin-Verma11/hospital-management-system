// MedCore HMS - Complete Dynamic Client Controller & Interactive Engine
// Provides full operational functionality locally, on Express, and statically on GitHub Pages

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure DB client is initialized
  if (window.MedCoreDB && window.MedCoreDB.init) {
    await window.MedCoreDB.init();
  }

  setupNavigation();
  setupGlobalQuickActions();

  const path = window.location.pathname.toLowerCase();

  if (path.includes('patient')) {
    initPatientsPage();
  } else if (path.includes('doctor')) {
    initDoctorsPage();
  } else if (path.includes('ward')) {
    initWardsPage();
  } else if (path.includes('billing')) {
    initBillingPage();
  } else if (path.includes('schema')) {
    initSchemaPage();
  } else if (path.includes('sql') || path.includes('console')) {
    initSqlConsolePage();
  } else {
    // Default to Dashboard for root, index.html, /hospital-management-system/, etc.
    initDashboard();
  }
});

// ==========================================
// 1. GLOBAL NAVIGATION SETUP
// ==========================================
function setupNavigation() {
  const currentPath = window.location.pathname.toLowerCase();

  document.querySelectorAll('aside [data-path]').forEach(link => {
    const target = link.getAttribute('data-path');
    let href = 'index.html';
    if (target === 'patients-and-ehr') href = 'patients.html';
    else if (target === 'doctor-and-staff-opd') href = 'doctors.html';
    else if (target === 'bed-and-ward-tracker') href = 'wards.html';
    else if (target === 'pharmacy-and-billing') href = 'billing.html';
    else if (target === 'database-schema-explorer') href = 'schema.html';
    else if (target === 'audit-logs') href = 'sql-console.html';
    else if (target === 'executive-dashboard') href = 'index.html';

    link.setAttribute('href', href);

    // Determine active tab state
    const isDashboard = (href === 'index.html') && 
      (currentPath === '/' || currentPath.endsWith('/') || currentPath.includes('index.html') || currentPath.endsWith('hospital-management-system'));
    const isPageActive = isDashboard || (href !== 'index.html' && currentPath.includes(href.replace('.html', '')));

    if (isPageActive) {
      link.classList.add('bg-primary-container', 'text-on-primary-container', 'font-headline-sm');
      link.classList.remove('text-on-surface-variant');
    } else {
      link.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-headline-sm');
      link.classList.add('text-on-surface-variant');
    }
  });

  // Top header links fix (e.g. Open SQL Runner)
  document.querySelectorAll('a[href="/sql-console"]').forEach(a => a.setAttribute('href', 'sql-console.html'));
  document.querySelectorAll('a[href="/schema"]').forEach(a => a.setAttribute('href', 'schema.html'));
  document.querySelectorAll('a[href="/patients"]').forEach(a => a.setAttribute('href', 'patients.html'));
}

// ==========================================
// 2. GLOBAL QUICK ACTION TOOLBAR & MODALS
// ==========================================
function setupGlobalQuickActions() {
  injectQuickActionModals();

  // Find quick action buttons in top toolbar by text content or icons
  document.querySelectorAll('button').forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes('Admit Triage Patient')) {
      btn.id = 'btnQuickAdmit';
      btn.addEventListener('click', () => openAdmitModal());
    } else if (text.includes('Book OPD')) {
      btn.id = 'btnQuickBookOpd';
      btn.addEventListener('click', () => openBookOpdModal());
    } else if (text.includes('Transfer Bed')) {
      btn.id = 'btnQuickTransferBed';
      btn.addEventListener('click', () => openTransferBedModal());
    } else if (text.includes('Issue Order')) {
      btn.id = 'btnQuickIssueOrder';
      btn.addEventListener('click', () => openIssueOrderModal());
    } else if (text.includes('Emergency Code')) {
      btn.id = 'btnQuickEmergencyCode';
      btn.addEventListener('click', () => triggerEmergencyCode());
    }
  });
}

function injectQuickActionModals() {
  if (document.getElementById('globalActionModalsContainer')) return;

  const container = document.createElement('div');
  container.id = 'globalActionModalsContainer';
  container.innerHTML = `
    <!-- 1. ADMIT PATIENT MODAL -->
    <div id="quickAdmitModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-surface-container-high mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">person_add</span>
            <h3 class="font-headline-sm text-lg font-bold text-on-surface">Admit Patient to Bed (Triage)</h3>
          </div>
          <button onclick="closeModal('quickAdmitModal')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form id="quickAdmitForm" class="flex flex-col gap-3">
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Select Patient *</label>
            <select id="admitPatientSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Select Available Bed *</label>
            <select id="admitRoomSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Attending Physician *</label>
            <select id="admitDoctorSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Admitting Clinical Diagnosis *</label>
            <input id="admitDiagnosisInput" type="text" required placeholder="e.g. Acute Coronary Syndrome" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Acuity Tier</label>
            <select id="admitAcuitySelect" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md">
              <option value="Cardiac / Telemetry">Cardiac / Telemetry</option>
              <option value="Critical / High Acuity">Critical / High Acuity</option>
              <option value="Standard Inpatient">Standard Inpatient</option>
              <option value="Pediatric Care">Pediatric Care</option>
            </select>
          </div>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
            <button type="button" onclick="closeModal('quickAdmitModal')" class="px-4 py-2 rounded-lg hover:bg-surface-container-high text-on-surface font-semibold text-sm">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-semibold text-sm shadow hover:opacity-90">Confirm Admission</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. BOOK OPD MODAL -->
    <div id="quickBookOpdModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-surface-container-high mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">calendar_month</span>
            <h3 class="font-headline-sm text-lg font-bold text-on-surface">Book OPD Consultation Slot</h3>
          </div>
          <button onclick="closeModal('quickBookOpdModal')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form id="quickBookOpdForm" class="flex flex-col gap-3">
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Select Patient *</label>
            <select id="opdPatientSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Select Doctor / Specialist *</label>
            <select id="opdDoctorSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Date *</label>
              <input id="opdDateInput" type="date" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
            </div>
            <div>
              <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Time Slot *</label>
              <select id="opdTimeSelect" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md">
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Consultation Purpose / Reason</label>
            <input id="opdReasonInput" type="text" placeholder="e.g. Regular Follow-up / Routine Review" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
          </div>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
            <button type="button" onclick="closeModal('quickBookOpdModal')" class="px-4 py-2 rounded-lg hover:bg-surface-container-high text-on-surface font-semibold text-sm">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm shadow hover:opacity-90">Generate Token & Book</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. TRANSFER BED MODAL -->
    <div id="quickTransferBedModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-surface-container-high mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">single_bed</span>
            <h3 class="font-headline-sm text-lg font-bold text-on-surface">Inter-Ward Bed Relocation</h3>
          </div>
          <button onclick="closeModal('quickTransferBedModal')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form id="quickTransferBedForm" class="flex flex-col gap-3">
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Select Occupied Patient / Bed *</label>
            <select id="transferOccupiedSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Target Destination Bed *</label>
            <select id="transferTargetSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
            <button type="button" onclick="closeModal('quickTransferBedModal')" class="px-4 py-2 rounded-lg hover:bg-surface-container-high text-on-surface font-semibold text-sm">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm shadow hover:opacity-90">Authorize Transfer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 4. ISSUE ORDER MODAL -->
    <div id="quickIssueOrderModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-surface-container-high mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">prescriptions</span>
            <h3 class="font-headline-sm text-lg font-bold text-on-surface">Issue Prescription / Order</h3>
          </div>
          <button onclick="closeModal('quickIssueOrderModal')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form id="quickIssueOrderForm" class="flex flex-col gap-3">
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Patient *</label>
            <select id="orderPatientSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Ordering Physician *</label>
            <select id="orderDoctorSelect" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md"></select>
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Pharmaceutical Molecule / Name *</label>
            <input id="orderMedicineInput" type="text" required placeholder="e.g. Ceftriaxone 1g IV or Atorvastatin 20mg" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Dosage & Frequency *</label>
            <input id="orderDosageInput" type="text" required placeholder="e.g. 1 tab twice daily with food" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
          </div>
          <div>
            <label class="font-label-sm text-xs font-semibold text-on-surface-variant uppercase block mb-1">Special Clinical Instructions</label>
            <input id="orderInstructionsInput" type="text" placeholder="e.g. Monitor renal profile, infuse over 30 mins" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" />
          </div>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
            <button type="button" onclick="closeModal('quickIssueOrderModal')" class="px-4 py-2 rounded-lg hover:bg-surface-container-high text-on-surface font-semibold text-sm">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm shadow hover:opacity-90">Disburse to Pharmacy</button>
          </div>
        </form>
      </div>
    </div>

    <!-- GLOBAL TOAST NOTIFICATION -->
    <div id="medcoreToast" class="fixed bottom-6 right-6 z-[200] max-w-md bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-24 opacity-0 pointer-events-none">
      <span id="medcoreToastIcon" class="material-symbols-outlined text-secondary-fixed text-2xl">info</span>
      <div class="flex flex-col">
        <span id="medcoreToastTitle" class="font-bold text-sm">Notice</span>
        <span id="medcoreToastMsg" class="text-xs text-inverse-on-surface/90"></span>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Wire modal form submissions
  setupModalSubmitHandlers();
}

function setupModalSubmitHandlers() {
  // 1. Admit Form Submit
  const admitForm = document.getElementById('quickAdmitForm');
  if (admitForm) {
    admitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patientId = document.getElementById('admitPatientSelect').value;
      const roomId = document.getElementById('admitRoomSelect').value;
      const doctorId = document.getElementById('admitDoctorSelect').value;
      const diagnosis = document.getElementById('admitDiagnosisInput').value;
      const acuity = document.getElementById('admitAcuitySelect').value;

      try {
        const res = await fetch('/api/rooms/admit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId, room_id: roomId, doctor_id: doctorId, diagnosis, acuity_tier: acuity })
        });
        const data = await res.json();
        closeModal('quickAdmitModal');
        showToast('Patient Admitted', data.message || 'Admitted to room successfully.', 'check_circle');
        refreshCurrentPageData();
      } catch (err) {
        showToast('Admission Error', err.message, 'error');
      }
    });
  }

  // 2. Book OPD Form Submit
  const bookForm = document.getElementById('quickBookOpdForm');
  if (bookForm) {
    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patientId = document.getElementById('opdPatientSelect').value;
      const doctorId = document.getElementById('opdDoctorSelect').value;
      const date = document.getElementById('opdDateInput').value;
      const timeSlot = document.getElementById('opdTimeSelect').value;
      const reason = document.getElementById('opdReasonInput').value;

      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId, doctor_id: doctorId, appointment_date: date, time_slot: timeSlot, reason })
        });
        const data = await res.json();
        closeModal('quickBookOpdModal');
        showToast('Appointment Scheduled', data.message || 'Token issued.', 'calendar_month');
        refreshCurrentPageData();
      } catch (err) {
        showToast('Booking Error', err.message, 'error');
      }
    });
  }

  // 3. Transfer Bed Form Submit
  const transferForm = document.getElementById('quickTransferBedForm');
  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patientId = document.getElementById('transferOccupiedSelect').value;
      const newRoomId = document.getElementById('transferTargetSelect').value;

      try {
        const res = await fetch('/api/rooms/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId, new_room_id: newRoomId })
        });
        const data = await res.json();
        closeModal('quickTransferBedModal');
        showToast('Bed Transferred', data.message || 'Bed relocated.', 'single_bed');
        refreshCurrentPageData();
      } catch (err) {
        showToast('Transfer Error', err.message, 'error');
      }
    });
  }

  // 4. Issue Order Form Submit
  const orderForm = document.getElementById('quickIssueOrderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patientId = document.getElementById('orderPatientSelect').value;
      const doctorId = document.getElementById('orderDoctorSelect').value;
      const medicine = document.getElementById('orderMedicineInput').value;
      const dosage = document.getElementById('orderDosageInput').value;
      const instructions = document.getElementById('orderInstructionsInput').value;

      try {
        if (window.MedCoreDB && window.MedCoreDB.run) {
          window.MedCoreDB.run(
            'INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, instructions) VALUES (?, ?, ?, ?, ?)',
            [patientId, doctorId, medicine, dosage, instructions]
          );
        }
        closeModal('quickIssueOrderModal');
        showToast('Prescription Issued', `${medicine} ordered and transmitted to Dispensary.`, 'prescriptions');
        refreshCurrentPageData();
      } catch (err) {
        showToast('Order Error', err.message, 'error');
      }
    });
  }
}

async function openAdmitModal() {
  try {
    const [patients, rooms, doctors] = await Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/rooms').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json())
    ]);

    const patientSelect = document.getElementById('admitPatientSelect');
    patientSelect.innerHTML = patients.map(p => `
      <option value="${p.patient_id}">${p.patient_name} (${p.mrn} • ${p.blood_group})</option>
    `).join('');

    const availableRooms = rooms.filter(r => r.room_status === 'Available');
    const roomSelect = document.getElementById('admitRoomSelect');
    if (availableRooms.length === 0) {
      roomSelect.innerHTML = '<option value="">No beds available currently</option>';
    } else {
      roomSelect.innerHTML = availableRooms.map(r => `
        <option value="${r.room_id}">${r.room_number} • ${r.ward_unit} ($${r.daily_rate}/day)</option>
      `).join('');
    }

    const doctorSelect = document.getElementById('admitDoctorSelect');
    doctorSelect.innerHTML = doctors.map(d => `
      <option value="${d.doctor_id}">${d.name} (${d.specialization})</option>
    `).join('');

    openModal('quickAdmitModal');
  } catch (err) {
    showToast('Error', 'Could not fetch hospital directory for admission: ' + err.message, 'error');
  }
}

async function openBookOpdModal() {
  try {
    const [patients, doctors] = await Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json())
    ]);

    const patientSelect = document.getElementById('opdPatientSelect');
    patientSelect.innerHTML = patients.map(p => `
      <option value="${p.patient_id}">${p.patient_name} (${p.mrn})</option>
    `).join('');

    const doctorSelect = document.getElementById('opdDoctorSelect');
    doctorSelect.innerHTML = doctors.map(d => `
      <option value="${d.doctor_id}">${d.name} - ${d.specialization} (${d.opd_room})</option>
    `).join('');

    document.getElementById('opdDateInput').value = new Date().toISOString().split('T')[0];
    openModal('quickBookOpdModal');
  } catch (err) {
    showToast('Error', 'Could not open OPD scheduler: ' + err.message, 'error');
  }
}

async function openTransferBedModal() {
  try {
    const rooms = await fetch('/api/rooms').then(r => r.json());
    const occupied = rooms.filter(r => r.room_status === 'Occupied' && r.patient_id);
    const available = rooms.filter(r => r.room_status === 'Available');

    const occSelect = document.getElementById('transferOccupiedSelect');
    if (occupied.length === 0) {
      occSelect.innerHTML = '<option value="">No currently admitted patients</option>';
    } else {
      occSelect.innerHTML = occupied.map(r => `
        <option value="${r.patient_id}">${r.admitted_patient_name} in ${r.room_number} (${r.ward_unit})</option>
      `).join('');
    }

    const targetSelect = document.getElementById('transferTargetSelect');
    if (available.length === 0) {
      targetSelect.innerHTML = '<option value="">No available target beds</option>';
    } else {
      targetSelect.innerHTML = available.map(r => `
        <option value="${r.room_id}">${r.room_number} • ${r.ward_unit} (${r.room_type})</option>
      `).join('');
    }

    openModal('quickTransferBedModal');
  } catch (err) {
    showToast('Error', 'Could not load bed registry: ' + err.message, 'error');
  }
}

async function openIssueOrderModal() {
  try {
    const [patients, doctors] = await Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json())
    ]);

    const patientSelect = document.getElementById('orderPatientSelect');
    patientSelect.innerHTML = patients.map(p => `
      <option value="${p.patient_id}">${p.patient_name} (${p.mrn})</option>
    `).join('');

    const doctorSelect = document.getElementById('orderDoctorSelect');
    doctorSelect.innerHTML = doctors.map(d => `
      <option value="${d.doctor_id}">${d.name} (${d.specialization})</option>
    `).join('');

    openModal('quickIssueOrderModal');
  } catch (err) {
    showToast('Error', 'Could not open order prescription modal: ' + err.message, 'error');
  }
}

async function triggerEmergencyCode() {
  // Play subtle warning audio beep using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio context autoplay restriction if any
  }

  showToast('🚨 CODE BLUE INITIATED', 'Critical Emergency Response Team Dispatched to Central Ward. Audit trail updated.', 'emergency');

  try {
    await fetch('/api/emergency', { method: 'POST' });
    refreshCurrentPageData();
  } catch (e) {
    console.error(e);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

let toastTimeout;
function showToast(title, message, iconName = 'info') {
  clearTimeout(toastTimeout);
  const toast = document.getElementById('medcoreToast');
  if (!toast) return;

  document.getElementById('medcoreToastTitle').textContent = title;
  document.getElementById('medcoreToastMsg').textContent = message;
  document.getElementById('medcoreToastIcon').textContent = iconName;

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 4000);
}

function refreshCurrentPageData() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('patient')) initPatientsPage();
  else if (path.includes('doctor')) initDoctorsPage();
  else if (path.includes('ward')) initWardsPage();
  else if (path.includes('billing')) initBillingPage();
  else initDashboard();
}

// ==========================================
// 3. DASHBOARD INITIALIZER (index.html)
// ==========================================
async function initDashboard() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();
    const { stats, doctorWorkload, bedOccupancy, recentAuditLogs } = data;

    // 1. Inpatients KPI
    const inpatientsEl = document.querySelector('main .font-headline-xl');
    if (inpatientsEl && stats) {
      inpatientsEl.textContent = stats.occupiedRooms;
    }

    // 2. Doctor workload table
    const tableBody = document.querySelector('tbody');
    if (tableBody && doctorWorkload && doctorWorkload.length > 0) {
      tableBody.innerHTML = doctorWorkload.map(doc => `
        <tr class="border-b border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer" onclick="showToast('${doc.doctor_name}', 'Active OPD in ${doc.opd_room} with ${doc.total_appointments} patient appointments.')">
          <td class="py-space-sm px-space-md">
            <div class="flex items-center gap-space-sm">
              <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                ${doc.doctor_code || 'DR'}
              </div>
              <div>
                <span class="font-label-md text-on-surface font-semibold block">${doc.doctor_name}</span>
                <span class="font-body-sm text-on-surface-variant">${doc.specialization}</span>
              </div>
            </div>
          </td>
          <td class="py-space-sm px-space-md font-label-md text-on-surface">${doc.department_name}</td>
          <td class="py-space-sm px-space-md"><span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-secondary-container font-label-sm font-semibold">${doc.opd_room || 'Room 101'}</span></td>
          <td class="py-space-sm px-space-md font-label-md text-secondary font-bold">${doc.total_appointments} Assigned</td>
          <td class="py-space-sm px-space-md text-right"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm font-semibold">Active OPD</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error initializing dashboard:', err);
  }
}

// ==========================================
// 4. PATIENTS & EHR INITIALIZER (patients.html)
// ==========================================
async function initPatientsPage() {
  let allPatients = [];
  const listContainer = document.getElementById('patientListContainer') || document.querySelector('.xl\\:col-span-5');
  const searchInput = document.getElementById('patientSearchInput');
  const bloodSelect = document.querySelector('select:has(option[value="O+"])');
  const exportBtn = document.getElementById('exportCsvBtn');

  // Load Patient list from SQLite API
  async function loadPatients(search = '', blood = '') {
    try {
      let url = '/api/patients?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (blood) url += `blood_group=${encodeURIComponent(blood)}&`;

      const res = await fetch(url);
      allPatients = await res.json();
      renderPatientList(allPatients);

      if (allPatients.length > 0) {
        loadPatientDetails(allPatients[0].patient_id);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  }

  function renderPatientList(patients) {
    if (!listContainer) return;

    if (patients.length === 0) {
      listContainer.innerHTML = '<div class="p-8 text-center text-on-surface-variant">No matching patient records found in SQLite database.</div>';
      return;
    }

    listContainer.innerHTML = patients.map((p, idx) => `
      <div class="patient-card p-space-md border-b border-surface-container-high hover:bg-surface-container-low transition-all cursor-pointer ${idx === 0 ? 'bg-surface-container-low border-l-4 border-l-secondary' : 'bg-surface-container-lowest'}" data-id="${p.patient_id}">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-space-sm">
            <div class="w-10 h-10 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center font-bold text-sm">
              ${p.patient_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div class="flex items-center gap-space-xs">
                <span class="font-headline-sm text-sm text-on-surface font-semibold">${p.patient_name}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${p.blood_group.includes('+') ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}">${p.blood_group}</span>
              </div>
              <span class="font-data-mono text-xs text-on-surface-variant">${p.mrn} • ${p.age}y, ${p.gender}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${p.clinical_status === 'Critical / ICU' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-secondary-container'}">
            ${p.clinical_status || 'Admitted'}
          </span>
        </div>
        <div class="mt-2 text-xs text-on-surface-variant flex items-center justify-between">
          <span class="truncate max-w-[200px]">Dx: ${p.admitting_diagnosis || 'Clinical Observation'}</span>
          <span class="text-secondary font-medium">${p.admitting_ward || 'Ward 4B'}</span>
        </div>
      </div>
    `).join('');

    // Attach click events to load patient
    listContainer.querySelectorAll('.patient-card').forEach(card => {
      card.addEventListener('click', () => {
        listContainer.querySelectorAll('.patient-card').forEach(c => {
          c.classList.remove('bg-surface-container-low', 'border-l-4', 'border-l-secondary');
          c.classList.add('bg-surface-container-lowest');
        });
        card.classList.add('bg-surface-container-low', 'border-l-4', 'border-l-secondary');
        card.classList.remove('bg-surface-container-lowest');
        loadPatientDetails(card.getAttribute('data-id'));
      });
    });
  }

  async function loadPatientDetails(patientId) {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      const { patient, admissions, prescriptions, bills } = data;

      // Update Patient Header Profile
      const nameHeading = document.querySelector('.xl\\:col-span-7 h1') || document.querySelector('.xl\\:col-span-7 .font-headline-lg') || document.querySelector('.xl\\:col-span-7 h2');
      if (nameHeading) nameHeading.textContent = patient.name;

      const mrnBadge = document.querySelector('.xl\\:col-span-7 .font-data-mono');
      if (mrnBadge) mrnBadge.textContent = `${patient.mrn} • ${patient.age}y / ${patient.gender} • ${patient.blood_group}`;

      // Update Vitals Cards
      const bpEl = document.querySelector('[data-vital="bp"]');
      if (bpEl) bpEl.textContent = patient.vitals_bp || '120/80';

      const hrEl = document.querySelector('[data-vital="hr"]');
      if (hrEl) hrEl.textContent = `${patient.vitals_hr || 74} BPM`;

      const spo2El = document.querySelector('[data-vital="spo2"]');
      if (spo2El) spo2El.textContent = `${patient.vitals_spo2 || 98}%`;

      const tempEl = document.querySelector('[data-vital="temp"]');
      if (tempEl) tempEl.textContent = `${patient.vitals_temp || 98.6}°F`;

      // Update Clinical Notes / Tab content
      const notesContent = document.getElementById('tabContentNotes');
      if (notesContent) {
        notesContent.innerHTML = `
          <div class="p-4 bg-surface-container-low rounded-xl">
            <h4 class="font-bold text-sm text-on-surface mb-1">Admitting Clinical Presentation</h4>
            <p class="text-xs text-on-surface-variant leading-relaxed">${patient.admitting_diagnosis || 'Standard Observation and monitoring.'}</p>
            <div class="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
              <span>Ward Location: ${patient.admitting_ward || 'Ward 4B'}</span>
              <span>Allergies: <span class="text-error font-semibold">${patient.allergies || 'None Known'}</span></span>
            </div>
          </div>
        `;
      }

      // Update Prescriptions Tab
      const medsContent = document.getElementById('tabContentMeds');
      if (medsContent) {
        if (prescriptions && prescriptions.length > 0) {
          medsContent.innerHTML = prescriptions.map(rx => `
            <div class="p-3 bg-surface-container-low rounded-lg flex items-center justify-between mb-2">
              <div>
                <span class="font-semibold text-xs text-on-surface block">${rx.medicine} (${rx.dosage})</span>
                <span class="text-[11px] text-on-surface-variant">${rx.instructions} • Dr. ${rx.doctor_name || 'Staff'}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${rx.dispense_status === 'Dispensed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface'}">${rx.dispense_status}</span>
            </div>
          `).join('');
        } else {
          medsContent.innerHTML = '<div class="p-4 text-center text-xs text-on-surface-variant">No active medications prescribed for this patient.</div>';
        }
      }

      // Update DBMS Relational View tab
      const dbmsContent = document.getElementById('tabContentDbms');
      if (dbmsContent) {
        dbmsContent.innerHTML = `
          <div class="p-4 bg-surface-container-low rounded-xl font-mono text-xs overflow-x-auto text-on-surface-variant">
            <div class="text-secondary font-bold mb-2">-- Relational Record Tuple (Patient ID: ${patient.patient_id})</div>
            <pre>${JSON.stringify({ patient_id: patient.patient_id, mrn: patient.mrn, name: patient.name, blood: patient.blood_group, ward: patient.admitting_ward, vitals: { bp: patient.vitals_bp, hr: patient.vitals_hr, spo2: patient.vitals_spo2 }, admissions_count: admissions.length, prescriptions_count: prescriptions.length, bills_count: bills.length }, null, 2)}</pre>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading patient details:', err);
    }
  }

  // Setup Built-in Registration Modal
  const modal = document.getElementById('newPatientModal');
  const openBtn = document.getElementById('openNewPatientModal');
  const closeBtn = document.getElementById('closeNewPatientModal');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const submitBtn = document.getElementById('submitRegisterBtn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      // Auto-generate next sequence MRN
      const mrnPreview = document.getElementById('allocatedMrn');
      if (mrnPreview) mrnPreview.textContent = `MRN-2024-${Math.floor(1000 + Math.random() * 9000)}`;
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (submitBtn && modal) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const inputs = modal.querySelectorAll('input, select, textarea');
      const payload = {
        name: `${inputs[0]?.value || ''} ${inputs[1]?.value || ''}`.trim() || 'New Patient',
        age: 42,
        gender: 'Female',
        blood_group: 'O+',
        admitting_ward: 'Ward 4B - Cardiology Sub-acute',
        admitting_diagnosis: 'Routine Clinical Admission'
      };

      // Read DOB if present
      const dobVal = inputs[2]?.value;
      if (dobVal) {
        const birthYear = new Date(dobVal).getFullYear();
        if (birthYear) payload.age = Math.max(1, new Date().getFullYear() - birthYear);
      }
      if (inputs[3]?.value) payload.gender = inputs[3].value === 'female' ? 'Female' : 'Male';
      if (inputs[4]?.value) payload.blood_group = inputs[4].value;
      if (inputs[5]?.value) {
        payload.admitting_ward = inputs[5].value === 'ward-4b' ? 'Ward 4B - Cardiology Sub-acute' : inputs[5].value === 'icu-a' ? 'ICU-A Critical Intensive Care' : 'Ward 2C - Surgical Recovery';
      }
      if (inputs[6]?.value) payload.admitting_diagnosis = inputs[6].value;

      submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Enrolling in SQLite...';

      try {
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const created = await res.json();
        modal.classList.add('hidden');
        showToast('Patient Registered', `MRN assigned: ${created.mrn || 'Success'}. SQLite trigger fired.`, 'check_circle');
        loadPatients();
      } catch (err) {
        showToast('Registration Error', err.message, 'error');
      } finally {
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span> Commit &amp; Print Wristband';
      }
    });
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      loadPatients(e.target.value, bloodSelect ? bloodSelect.value : '');
    });
  }
  if (bloodSelect) {
    bloodSelect.addEventListener('change', (e) => {
      loadPatients(searchInput ? searchInput.value : '', e.target.value);
    });
  }

  // Export CSV
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (allPatients.length === 0) return;
      const headers = ['Patient ID', 'MRN', 'Name', 'Age', 'Gender', 'Blood Group', 'Phone', 'Ward', 'Diagnosis', 'Status'];
      const rows = allPatients.map(p => [
        p.patient_id, p.mrn, `"${p.patient_name}"`, p.age, p.gender, p.blood_group, `"${p.phone}"`, `"${p.admitting_ward}"`, `"${p.admitting_diagnosis}"`, p.clinical_status
      ]);
      const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medcore_patients_${Date.now()}.csv`;
      a.click();
      showToast('CSV Exported', `Downloaded ${allPatients.length} patient records.`, 'download');
    });
  }

  loadPatients();
}

// ==========================================
// 5. DOCTORS & OPD INITIALIZER (doctors.html)
// ==========================================
async function initDoctorsPage() {
  let allDoctors = [];
  const cardsContainer = document.getElementById('cardsView');

  async function loadDoctors() {
    try {
      const res = await fetch('/api/doctors');
      allDoctors = await res.json();
      renderDoctors(allDoctors);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  }

  function renderDoctors(doctors) {
    if (!cardsContainer) return;
    cardsContainer.innerHTML = doctors.map(doc => `
      <div class="doctor-card rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md border border-surface-container" data-dept="${(doc.department_name || '').toLowerCase()}">
        <div>
          <div class="flex items-start justify-between gap-space-sm">
            <div class="flex items-center gap-space-md">
              <div class="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg shrink-0">
                ${doc.doctor_code || 'DR'}
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="font-headline-sm text-sm text-on-surface truncate font-bold">${doc.name}</h3>
                <p class="font-label-sm text-xs text-secondary truncate font-medium">${doc.specialization}</p>
                <div class="flex items-center gap-1 mt-1">
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">meeting_room</span>
                  <span class="font-data-mono text-xs text-on-surface-variant">${doc.opd_room || 'OPD-101'} • ${doc.department_name || 'Medicine'}</span>
                </div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-xs font-semibold shrink-0">Available</span>
          </div>
          <div class="mt-4 pt-3 border-t border-surface-container flex flex-col gap-1 text-xs text-on-surface-variant">
            <div class="flex justify-between">
              <span>Consultation Fee:</span>
              <span class="font-bold text-on-surface font-mono">$${doc.consultation_fee || 150}.00</span>
            </div>
            <div class="flex justify-between">
              <span>Shift Schedule:</span>
              <span class="font-mono text-secondary">${doc.shift || 'Shift 1 • 08:00 - 14:00'}</span>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-surface-container flex items-center gap-2">
          <button onclick="openBookOpdModal()" class="flex-1 h-8 rounded bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1 hover:opacity-90">
            <span class="material-symbols-outlined text-[14px]">calendar_add_on</span>
            Book Slot
          </button>
          <button onclick="showToast('${doc.name}', 'Physician contact: ${doc.phone} • Email: ${doc.email}')" class="h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold">
            Details
          </button>
        </div>
      </div>
    `).join('');
  }

  // Filter department pills
  window.filterDept = function(dept, btn) {
    document.querySelectorAll('.dept-pill').forEach(b => {
      b.classList.remove('bg-primary', 'text-on-primary');
      b.classList.add('bg-surface-container-lowest', 'text-on-surface');
    });
    if (btn) {
      btn.classList.add('bg-primary', 'text-on-primary');
      btn.classList.remove('bg-surface-container-lowest', 'text-on-surface');
    }

    if (dept === 'all') {
      renderDoctors(allDoctors);
    } else {
      const filtered = allDoctors.filter(d => (d.department_name || '').toLowerCase().includes(dept.toLowerCase()) || (d.specialization || '').toLowerCase().includes(dept.toLowerCase()));
      renderDoctors(filtered);
    }
  };

  // Add doctor form handler
  const addForm = document.getElementById('addDoctorForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('docName')?.value;
      const dept = document.getElementById('docDept')?.value;
      const room = document.getElementById('docRoom')?.value;

      try {
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, specialization: dept || 'Specialist', department_id: 1, opd_room: room || 'OPD-101' })
        });
        const data = await res.json();
        showToast('Physician Added', `${name} registered to ${dept} roster.`, 'check_circle');
        const modal = document.getElementById('addDoctorModal');
        if (modal) modal.classList.add('hidden');
        addForm.reset();
        loadDoctors();
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    });
  }

  loadDoctors();
}

// ==========================================
// 6. WARDS & BED TRACKER INITIALIZER (wards.html)
// ==========================================
async function initWardsPage() {
  try {
    const rooms = await fetch('/api/rooms').then(r => r.json());
    
    // Wire Discharge button in inspector
    const flagDischargeBtn = document.querySelector('button[onclick="flagDischarge()"]');
    if (flagDischargeBtn) {
      flagDischargeBtn.onclick = async () => {
        const bedIdElem = document.getElementById('inspect-bed-id');
        const bedNum = bedIdElem ? bedIdElem.innerText : '';
        const matchingRoom = rooms.find(r => r.room_number === bedNum || r.room_status === 'Occupied');

        if (!matchingRoom) {
          showToast('Notice', 'Please click an occupied bed to discharge.', 'info');
          return;
        }

        try {
          const res = await fetch('/api/rooms/discharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admission_id: matchingRoom.admission_id, room_id: matchingRoom.room_id })
          });
          const data = await res.json();
          showToast('Discharge Processed', data.message || 'Bed released to Available. SQLite trigger executed.', 'check_circle');
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          showToast('Discharge Error', err.message, 'error');
        }
      };
    }
  } catch (err) {
    console.error('Error initializing wards page:', err);
  }
}

// ==========================================
// 7. PHARMACY & BILLING INITIALIZER (billing.html)
// ==========================================
async function initBillingPage() {
  try {
    // Process Payment & Discharge button wiring
    const dischargePayBtn = document.getElementById('dischargeBtn');
    if (dischargePayBtn) {
      dischargePayBtn.onclick = async () => {
        dischargePayBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Processing in SQLite...</span>';
        try {
          const bills = await fetch('/api/billing').then(r => r.json());
          const targetBill = bills.find(b => b.payment_status !== 'Paid') || bills[0];

          if (targetBill) {
            await fetch(`/api/billing/${targetBill.bill_id}/pay`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: targetBill.total_amount - targetBill.paid_amount })
            });
          }

          dischargePayBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified</span><span>Account Cleared &bull; Paid</span>';
          dischargePayBtn.className = 'w-full h-10 bg-primary text-on-primary font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2';
          showToast('Ledger Settled', `Cleared Invoice ${targetBill ? targetBill.invoice_number : ''}. Financial hold released in SQLite.`, 'check_circle');
        } catch (err) {
          showToast('Billing Error', err.message, 'error');
        }
      };
    }
  } catch (err) {
    console.error('Error initializing billing page:', err);
  }
}

// ==========================================
// 8. SQL CONSOLE INITIALIZER (sql-console.html)
// ==========================================
function initSqlConsolePage() {
  console.log('SQL Console initialized with in-browser SQLite WASM runner.');
}

// ==========================================
// 9. SCHEMA PAGE INITIALIZER (schema.html)
// ==========================================
function initSchemaPage() {
  if (typeof window.loadSchema === 'function') {
    window.loadSchema();
  }
}
