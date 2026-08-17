const fs = require('fs');
const files = [
  'c:/HealthSync/webapp/frontend/js/main.js',
  'c:/HealthSync/webapp/frontend/js/remote_main.js'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix renderAppointmentsList
  const renderFind = `const status = appt => String(appt.status || '').trim().toUpperCase();
  const bookedList = todayAppointments.filter(a => status(a) === 'CONFIRMED');
  const upcomingList = todayAppointments.filter(a => ['CHECKED IN', 'IN PROGRESS', 'WAITING', 'IN CONSULTATION'].includes(status(a)));
  const completedList = todayAppointments.filter(a => status(a) === 'COMPLETED');
  const cancelledList = todayAppointments.filter(a => ['CANCELLED', 'NO SHOW'].includes(status(a)));`;

  const renderReplace = `const status = appt => String(appt.status || '').trim().toUpperCase();
  
  const parseDate = (d, t) => {
    if (!d) return new Date();
    // Simplified parsing assuming 'YYYY-MM-DD' and 'HH:MM'
    const dateObj = new Date(d);
    if (t) {
      const match = t.match(/(\\d+):(\\d+)\\s*(AM|PM)?/i);
      if (match) {
        let hrs = parseInt(match[1]);
        if (match[3] && match[3].toUpperCase() === 'PM' && hrs < 12) hrs += 12;
        if (match[3] && match[3].toUpperCase() === 'AM' && hrs === 12) hrs = 0;
        dateObj.setHours(hrs, parseInt(match[2]), 0, 0);
      }
    }
    return dateObj;
  };
  
  const now = new Date();
  now.setHours(0,0,0,0); // compare by date initially

  const bookedList = todayAppointments.filter(a => ['BOOKED', 'CONFIRMED'].includes(status(a)));
  
  const upcomingList = todayAppointments.filter(a => {
    const s = status(a);
    if (['CANCELLED', 'NO SHOW', 'REJECTED', 'COMPLETED'].includes(s)) return false;
    const apptDate = parseDate(a.slot_date || a.date || a.appointment_date, null);
    apptDate.setHours(0,0,0,0);
    // If it's today or in the future, it's upcoming
    return apptDate.getTime() >= now.getTime();
  });
  
  const completedList = todayAppointments.filter(a => {
    const s = status(a);
    if (s === 'COMPLETED') return true;
    if (['CANCELLED', 'NO SHOW', 'REJECTED'].includes(s)) return false;
    const apptDate = parseDate(a.slot_date || a.date || a.appointment_date, null);
    apptDate.setHours(0,0,0,0);
    return apptDate.getTime() < now.getTime();
  });
  
  const cancelledList = todayAppointments.filter(a => ['CANCELLED', 'NO SHOW', 'REJECTED'].includes(status(a)));`;

  content = content.replace(renderFind, renderReplace);
  
  // Also fix submitAppointmentBooking
  const submitFind = `if (data.success) {
      // Show success screen
      document.getElementById('success-doc-name').textContent = bookingDoctor.name || bookingDoctor.full_name || 'Doctor';
      document.getElementById('success-date').textContent = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('success-time').textContent = bookingTime;
      document.getElementById('success-appt-id').textContent = data.appointment.id;

      showBookingStep(3);
      syncAllData(); // Refresh dashboards & appointments immediately
    } else {`;
    
  const submitReplace = `if (data.success) {
      // Show success screen
      document.getElementById('success-doc-name').textContent = bookingDoctor.name || bookingDoctor.full_name || 'Doctor';
      document.getElementById('success-date').textContent = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('success-time').textContent = bookingTime;
      document.getElementById('success-appt-id').textContent = data.appointment.id;

      showBookingStep(3);
      if (data.appointment) {
        todayAppointments.push(data.appointment);
        if (typeof renderAppointmentsList === 'function') renderAppointmentsList();
        if (typeof renderNextAppointment === 'function') renderNextAppointment(data.appointment);
      }
      syncAllData(); // Refresh dashboards & appointments immediately
    } else {`;
    
  content = content.replace(submitFind, submitReplace);

  fs.writeFileSync(file, content);
}
console.log("Patched renderAppointmentsList and submitAppointmentBooking.");
