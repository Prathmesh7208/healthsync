function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-root');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${msg}</span>`;
  container.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ---------------------------------------------------------------------------
// MODALS MANAGEMENT
// ---------------------------------------------------------------------------
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

window.closeAllModals = function() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
};

window.onclick = function(event) {
  if (event.target.classList.contains('modal-backdrop')) {
    closeAllModals();
  }
};

window.selectDoctorAppointment = function(id) {
  const appt = window.globalAppointments.find(a => a.id === id);
  if (!appt) return;
  document.getElementById('doc-sel-pat-name').innerText = appt.patient_name;
  document.getElementById('doc-sel-pat-meta').innerText = 'Patient';
  document.getElementById('doc-sel-pat-phone').innerText = 'Token ' + appt.token_number;
  document.getElementById('doc-sel-apt-time').innerText = appt.slot_time;
  document.getElementById('doc-sel-apt-type').innerText = 'Consultation';
  document.getElementById('doc-sel-apt-fee').innerText = '₹800';
};
