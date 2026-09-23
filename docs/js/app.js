// MedCore HMS - Dynamic Client Data Binding & Navigation
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  const path = window.location.pathname;

  if (path === '/' || path.includes('dashboard') || path.includes('index.html')) {
    initDashboard();
  } else if (path.includes('patients')) {
    initPatientsPage();
  } else if (path.includes('doctors')) {
    initDoctorsPage();
  } else if (path.includes('wards')) {
    initWardsPage();
  } else if (path.includes('billing')) {
    initBillingPage();
  }
});

// 1. GLOBAL NAVIGATION SETUP
function setupNavigation() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('aside [data-path]').forEach(link => {
    const target = link.getAttribute('data-path');
    let href = '/';
    if (target === 'patients-and-ehr') href = '/patients';
    else if (target === 'doctor-and-staff-opd') href = '/doctors';
    else if (target === 'bed-and-ward-tracker') href = '/wards';
    else if (target === 'pharmacy-and-billing') href = '/billing';
    else if (target === 'database-schema-explorer') href = '/schema';
    else if (target === 'audit-logs') href = '/sql-console';
    else if (target === 'executive-dashboard') href = '/';

    link.setAttribute('href', href);

    // Active state highlighting
    const isActive = (href === '/' && (currentPath === '/' || currentPath.includes('index'))) ||
                     (href !== '/' && currentPath.includes(href));
    if (isActive) {
      link.classList.add('bg-primary-container', 'text-on-primary-container', 'font-headline-sm');
      link.classList.remove('text-on-surface-variant');
    } else {
      link.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-headline-sm');
      link.classList.add('text-on-surface-variant');
    }
  });
}

// 2. DASHBOARD INITIALIZER
async function initDashboard() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();
    const { stats, doctorWorkload, bedOccupancy, recentAuditLogs } = data;

    // Update KPI counters if present
    const inpatientsEl = document.querySelector('main .font-headline-xl');
    if (inpatientsEl) {
      inpatientsEl.textContent = stats.occupiedRooms;
    }

    // Populate Doctor workload roster in table
    const tableBody = document.querySelector('tbody');
    if (tableBody && doctorWorkload.length > 0) {
      tableBody.innerHTML = doctorWorkload.map(doc => `
        <tr class="border-b border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer">
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

// 3. PATIENTS & EHR INITIALIZER
async function initPatientsPage() {
  let allPatients = [];
  const searchInput = document.getElementById('patientSearchInput') || document.querySelector('input[type="text"]');
  const bloodSelect = document.querySelector('select:has(option[value="O+"])');

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
    const listContainer = document.querySelector('.xl\\:col-span-5 > div:last-child') || document.querySelector('.xl\\:col-span-5');
    if (!listContainer) return;

    if (patients.length === 0) {
      listContainer.innerHTML = '<div class="p-space-lg text-center text-on-surface-variant">No matching patient records found in database.</div>';
      return;
    }

    listContainer.innerHTML = patients.map((p, idx) => `
      <div class="patient-card p-space-md border-b border-surface-container-high hover:bg-surface-container-low transition-all cursor-pointer ${idx === 0 ? 'bg-surface-container-low border-l-4 border-l-secondary' : ''}" data-id="${p.patient_id}">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-space-sm">
            <div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface text-sm">
              ${p.patient_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div class="flex items-center gap-space-xs">
                <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">${p.patient_name}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${p.blood_group.includes('+') ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}">${p.blood_group}</span>
              </div>
              <span class="font-data-mono text-body-sm text-on-surface-variant">${p.mrn} • ${p.age}y, ${p.gender}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-label-sm font-semibold ${p.clinical_status === 'Critical / ICU' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-secondary-container'}">
            ${p.clinical_status || 'Admitted'}
          </span>
        </div>
        <div class="mt-space-xs text-body-sm text-on-surface-variant flex items-center justify-between">
          <span class="truncate max-w-[240px]">Dx: ${p.admitting_diagnosis || 'Clinical Observation'}</span>
          <span class="text-secondary font-medium">${p.admitting_ward || 'Ward 4B'}</span>
        </div>
      </div>
    `).join('');

    // Attach click listener
    listContainer.querySelectorAll('.patient-card').forEach(card => {
      card.addEventListener('click', () => {
        listContainer.querySelectorAll('.patient-card').forEach(c => {
          c.classList.remove('bg-surface-container-low', 'border-l-4', 'border-l-secondary');
        });
        card.classList.add('bg-surface-container-low', 'border-l-4', 'border-l-secondary');
        loadPatientDetails(card.getAttribute('data-id'));
      });
    });
  }

  async function loadPatientDetails(patientId) {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      const { patient, admissions, prescriptions, bills } = data;

      // Update Header Info
      const nameHeading = document.querySelector('.xl\\:col-span-7 h1') || document.querySelector('.xl\\:col-span-7 .font-headline-lg');
      if (nameHeading) nameHeading.textContent = patient.name;

      const mrnBadge = document.querySelector('.xl\\:col-span-7 .font-data-mono');
      if (mrnBadge) mrnBadge.textContent = patient.mrn;

      // Update Vitals Cards
      const bpEl = document.querySelector('[data-vital="bp"]');
      if (bpEl) bpEl.textContent = patient.vitals_bp || '120/80';

      const hrEl = document.querySelector('[data-vital="hr"]');
      if (hrEl) hrEl.textContent = `${patient.vitals_hr || 74} BPM`;

      const spo2El = document.querySelector('[data-vital="spo2"]');
      if (spo2El) spo2El.textContent = `${patient.vitals_spo2 || 98}%`;

      const tempEl = document.querySelector('[data-vital="temp"]');
      if (tempEl) tempEl.textContent = `${patient.vitals_temp || 98.6}°F`;

      // Update Prescriptions List
      const rxContainer = document.querySelector('.xl\\:col-span-7 .prescriptions-list') || document.querySelector('.xl\\:col-span-7 [data-rx-container]');
      if (rxContainer && prescriptions.length > 0) {
        rxContainer.innerHTML = prescriptions.map(rx => `
          <div class="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between mb-2">
            <div>
              <span class="font-label-md text-on-surface font-semibold block">${rx.medicine} (${rx.dosage})</span>
              <span class="font-body-sm text-on-surface-variant">${rx.instructions} • Dr. ${rx.doctor_name}</span>
            </div>
            <span class="px-2 py-0.5 rounded text-label-sm font-semibold ${rx.dispense_status === 'Dispensed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface'}">${rx.dispense_status}</span>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading patient details:', err);
    }
  }

  // Register New Patient Modal Injection
  injectPatientModal(() => loadPatients());

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

  loadPatients();
}

// MODAL: REGISTER NEW PATIENT
function injectPatientModal(onSuccess) {
  const openBtn = document.getElementById('openNewPatientModal') || document.querySelector('button:has(.material-symbols-outlined:contains("add_circle"))');
  
  const modalHtml = `
    <div id="newPatientModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-xl w-full p-space-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-space-sm border-b border-surface-container-high mb-space-md">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-secondary">person_add</span>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Register Patient (EHR Enrollment)</h2>
          </div>
          <button id="closePatientModal" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="newPatientForm" class="flex flex-col gap-space-md">
          <div>
            <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Full Legal Name *</label>
            <input type="text" name="name" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="e.g. Jonathan Edwards" />
          </div>

          <div class="grid grid-cols-3 gap-space-sm">
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Age *</label>
              <input type="number" name="age" required min="0" max="120" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="45" />
            </div>
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Gender *</label>
              <select name="gender" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Blood Group *</label>
              <select name="blood_group" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md">
                <option value="O+">O Rh+</option>
                <option value="A+">A Rh+</option>
                <option value="B+">B Rh+</option>
                <option value="AB+">AB Rh+</option>
                <option value="O-">O Rh-</option>
                <option value="A-">A Rh-</option>
                <option value="B-">B Rh-</option>
                <option value="AB-">AB Rh-</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-space-sm">
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Phone Number *</label>
              <input type="tel" name="phone" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="+1 555-0182" />
            </div>
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Emergency Contact</label>
              <input type="tel" name="emergency_contact" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="+1 555-0999" />
            </div>
          </div>

          <div>
            <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Admitting Clinical Diagnosis *</label>
            <input type="text" name="admitting_diagnosis" required class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="e.g. Non-ST Elevation Myocardial Infarction" />
          </div>

          <div class="grid grid-cols-2 gap-space-sm">
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Admitting Ward</label>
              <select name="admitting_ward" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md">
                <option value="Ward 4B - Cardiology Sub-acute">Ward 4B - Cardiology</option>
                <option value="ICU-A Critical Intensive Care">ICU-A Critical Care</option>
                <option value="Ward 2C - Surgical Recovery">Ward 2C - Surgical</option>
                <option value="Pediatric Day Wing">Pediatric Wing</option>
                <option value="General Medical Unit">General Medical Unit</option>
              </select>
            </div>
            <div>
              <label class="font-label-sm text-on-surface-variant uppercase block mb-1">Known Allergies</label>
              <input type="text" name="allergies" class="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary font-body-md" placeholder="e.g. Penicillin, Codeine" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container-high mt-space-sm">
            <button type="button" id="cancelPatientBtn" class="px-space-md h-10 rounded-lg hover:bg-surface-container-high text-on-surface font-label-md">Cancel</button>
            <button type="submit" class="px-space-lg h-10 bg-primary text-on-primary rounded-lg font-label-lg shadow-sm hover:opacity-95">Enroll in DBMS</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.getElementById('newPatientModal');
  const closeBtn = document.getElementById('closePatientModal');
  const cancelBtn = document.getElementById('cancelPatientBtn');
  const form = document.getElementById('newPatientForm');

  const showModal = () => modal.classList.remove('hidden');
  const hideModal = () => modal.classList.add('hidden');

  if (openBtn) openBtn.addEventListener('click', showModal);
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      hideModal();
      form.reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Error registering patient: ' + err.message);
    }
  });
}

// 4. DOCTORS & OPD INITIALIZER
async function initDoctorsPage() {
  try {
    const res = await fetch('/api/doctors');
    const doctors = await res.json();
    console.log('Loaded doctors count:', doctors.length);
  } catch (err) {
    console.error('Error loading doctors:', err);
  }
}

// 5. WARDS & BED TRACKER INITIALIZER
async function initWardsPage() {
  try {
    const res = await fetch('/api/rooms');
    const rooms = await res.json();
    console.log('Loaded rooms count:', rooms.length);
  } catch (err) {
    console.error('Error loading rooms:', err);
  }
}

// 6. PHARMACY & BILLING INITIALIZER
async function initBillingPage() {
  try {
    const [billsRes, summaryRes] = await Promise.all([
      fetch('/api/billing'),
      fetch('/api/billing/summary')
    ]);
    const bills = await billsRes.json();
    const summary = await summaryRes.json();
    console.log('Loaded bills count:', bills.length, 'Summary:', summary);
  } catch (err) {
    console.error('Error loading billing:', err);
  }
}
