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

  // AI Summary Logic
  const summaryEl = document.getElementById('doc-sel-pat-ai-summary');
  const tagsEl = document.getElementById('doc-sel-pat-ai-tags');
  if (summaryEl && tagsEl) {
    summaryEl.innerHTML = `<strong>AI Insight:</strong> Patient ${appt.patient_name} presents with a history of mild hypertension and seasonal allergies. Recent lab reports from 2 months ago show normal cholesterol levels. No current acute symptoms reported, routine follow-up recommended.`;
    tagsEl.innerHTML = `
      <span style="font-size: 11px; padding: 4px 12px; background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.9); border-radius: 20px; color: #475569; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"><i class="fa-solid fa-notes-medical"></i> Hypertension</span>
      <span style="font-size: 11px; padding: 4px 12px; background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.9); border-radius: 20px; color: #475569; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"><i class="fa-solid fa-allergies"></i> Seasonal Allergies</span>
      <span style="font-size: 11px; padding: 4px 12px; background: rgba(209,250,229,0.7); border: 1px solid #10b981; border-radius: 20px; color: #047857; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"><i class="fa-solid fa-check"></i> Labs Normal</span>
    `;
  }
};
