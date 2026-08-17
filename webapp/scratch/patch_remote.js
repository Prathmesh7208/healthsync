const fs = require('fs');
const file = 'c:/HealthSync/webapp/frontend/js/remote_main.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "const ptUpcoming = document.getElementById('pt-upcoming-appt-container');",
  "const ptBooked = document.getElementById('pt-booked-appt-container');\n  const ptUpcoming = document.getElementById('pt-upcoming-appt-container');"
);

c = c.replace(
  "const upcomingList = todayAppointments.filter(a => ['CONFIRMED', 'CHECKED IN', 'IN PROGRESS', 'WAITING', 'IN CONSULTATION'].includes(status(a)));",
  "const bookedList = todayAppointments.filter(a => status(a) === 'CONFIRMED');\n  const upcomingList = todayAppointments.filter(a => ['CHECKED IN', 'IN PROGRESS', 'WAITING', 'IN CONSULTATION'].includes(status(a)));"
);

c = c.replace(
  "upcoming: ['No upcoming appointments', 'Book an appointment to see your confirmed visits and queue details here.', 'Book an appointment'],",
  "booked: ['No booked appointments', 'Your scheduled future visits will appear here.', 'Book an appointment'],\n      upcoming: ['No upcoming appointments', 'Your active queue and live updates will appear here.', 'Book an appointment'],"
);

c = c.replace(
  "cancelled: ['No cancelled appointments', 'Cancelled visits are kept here so your upcoming appointments stay uncluttered.', 'View upcoming appointments']",
  "cancelled: ['No cancelled appointments', 'Cancelled visits are kept here so your active appointments stay uncluttered.', 'View booked appointments']"
);

c = c.replace(
  "? \"showPatientAppointmentTab('pt-appt-upcoming')\"",
  "? \"showPatientAppointmentTab('pt-appt-booked')\""
);

c = c.replace(
  "const action = category === 'upcoming'",
  "const action = (category === 'upcoming' || category === 'booked')"
);

c = c.replace(
  "if (ptUpcoming) ptUpcoming.innerHTML = upcomingList.length ? upcomingList.map(appt => patientCard(appt, 'upcoming')).join('') : emptyAppointments('upcoming');",
  "if (ptBooked) ptBooked.innerHTML = bookedList.length ? bookedList.map(appt => patientCard(appt, 'booked')).join('') : emptyAppointments('booked');\n  if (ptUpcoming) ptUpcoming.innerHTML = upcomingList.length ? upcomingList.map(appt => patientCard(appt, 'upcoming')).join('') : emptyAppointments('upcoming');"
);

fs.writeFileSync(file, c);
