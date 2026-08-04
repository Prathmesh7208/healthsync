/**
 * HealthSync WebApp — Frontend Logic
 * =================================
 * Core SPA router, dynamic DOM rendering, and API synchronization
 */

'use strict';

// Render serves the website and API from the same service.
var API_BASE = `${window.location.origin}/v1`;

// Global variables
var allDoctors = [];
var todayAppointments = [];
var liveQueueList = [];
var patientPrescriptions = [];
var patientRecords = [
  { id: 'rec-1', name: 'Complete Blood Count', doctor: 'Dr. Priya Sharma', date: '16 Apr 2026', type: 'lab-reports' },
  { id: 'rec-2', name: 'Lipid Profile', doctor: 'Dr. Priya Sharma', date: '15 Apr 2026', type: 'lab-reports' },
  { id: 'rec-3', name: 'Blood Sugar (Fasting)', doctor: 'Dr. Amit Patil', date: '10 Apr 2026', type: 'lab-reports' },
  { id: 'rec-4', name: 'Thyroid Profile', doctor: 'Dr. Amit Patil', date: '02 Apr 2026', type: 'lab-reports' }
];
var doctorPatientReports = [
  { id:'dr-1', name:'Complete Blood Count', date:'16 Apr 2026', facility:'HealthSync Diagnostics', status:'Reviewed', summary:'Haemoglobin and white-cell counts are within the expected range.' },
  { id:'dr-2', name:'Lipid Profile', date:'15 Apr 2026', facility:'Apollo Diagnostics', status:'Action needed', summary:'LDL is mildly elevated; review diet, activity and follow-up treatment.' },
  { id:'dr-3', name:'ECG Report', date:'10 Apr 2026', facility:'Cardiology Unit', status:'Reviewed', summary:'Normal sinus rhythm recorded. No acute abnormality noted.' },
  { id:'dr-4', name:'HbA1c Report', date:'02 Apr 2026', facility:'HealthSync Diagnostics', status:'Reviewed', summary:'Glycaemic control is stable compared with the previous result.' }
];
var currentSelectedPatientId = 'pat1'; // Default demo patient
var currentSelectedDoctorId = 'doc1';  // Default demo doctor
var currentUser = null;
var pendingMobile = '';
var pendingCountryCode = '+91';
var authMode = 'login';
var pendingRegistration = null;
var resendTimer = null;
var bookingMode = 'IN_PERSON';
var persistedReminders = [];
var remindersLoaded = false;
var appHistory = [{ role:'patient', page:'dashboard' }];
var appHistoryIndex = 0;
var healthTipIndex = 0;
var healthTipTimer = null;
var isMobileAppNavigation = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
var curatedHealthTips = [
  { icon:'fa-person-walking', title:'Move regularly', text:'Adults can aim for 150–300 minutes of moderate physical activity each week. If you are starting out, begin with manageable movement and build gradually.', source:'World Health Organization', url:'https://www.who.int/europe/news-room/fact-sheets/item/physical-activity' },
  { icon:'fa-bed', title:'Protect your sleep', text:'Most adults need at least 7 hours of sleep each day. A consistent sleep and wake time can support better sleep habits.', source:'CDC Sleep', url:'https://www.cdc.gov/sleep/about/index.html' },
  { icon:'fa-glass-water', title:'Choose water often', text:'Water supports normal body function and can help prevent dehydration. Your needs can increase with heat, fever, and physical activity.', source:'CDC Healthy Drinks', url:'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html' },
  { icon:'fa-heart-pulse', title:'Make time to unwind', text:'Brief calming practices such as slow breathing, stretching, or a short outdoor break can be part of a healthy stress-management routine.', source:'CDC Mental Health', url:'https://www.cdc.gov/mental-health/living-with/index.html' }
];
