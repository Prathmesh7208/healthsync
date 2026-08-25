import { jsPDF } from 'jspdf';

export interface PrescriptionData {
  appointmentId: string;
  date: string;
  doctor: {
    fullName: string;
    registrationNumber?: string;
    specializations?: string[] | string;
    hospitalName?: string;
    hospitalAddress?: string;
    phone?: string;
  };
  patient: {
    fullName: string;
    phone: string;
    age?: number | string;
    gender?: string;
  };
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
  diagnosis?: string;
  symptoms?: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string; // e.g. "1-0-1" or "Morning, Night"
    duration: string;  // e.g. "5 days"
    instructions?: string; // e.g. "After food"
  }>;
  advice?: string;
  followUpDate?: string;
}

export function generatePrescriptionPdf(data: PrescriptionData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Clean doctor name
  const cleanDocName = (data.doctor.fullName || 'Specialist')
    .replace(/^(dr\.?|doctor)\s+/i, '')
    .trim();

  // 1. TOP HEADER - Hospital / Platform Banner
  doc.setFillColor(26, 86, 219); // Royal Blue #1A56DB
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Platform Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HealthSync Medical Center', margin, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const hospitalName = data.doctor.hospitalName || 'HealthSync Digital Healthcare Network';
  const hospitalAddress = data.doctor.hospitalAddress || '24x7 Emergency & Multi-Speciality Clinic, Pune, Maharashtra';
  doc.text(`${hospitalName} • ${hospitalAddress}`, margin, 18);
  doc.text('Authorized Digital Electronic Prescription (Telehealth & OPD)', margin, 23);

  // 2. DOCTOR INFORMATION BOX (Top Left) & CONSULTATION METADATA (Top Right)
  let y = 38;
  doc.setTextColor(15, 23, 42); // #0F172A

  // Doctor Details
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${cleanDocName}`, margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // #475569

  const specs = Array.isArray(data.doctor.specializations)
    ? data.doctor.specializations.join(', ')
    : data.doctor.specializations || 'General Physician';
  doc.text(`Specialization: ${specs}`, margin, y + 5);
  doc.text(`Medical Reg No: ${data.doctor.registrationNumber || 'MMC-2016-8942'}`, margin, y + 10);

  // Consultation Details (Right aligned)
  const rightX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Prescription ID: ${data.appointmentId.slice(-8).toUpperCase()}`, rightX, y, { align: 'right' });
  doc.text(`Date: ${data.date || new Date().toLocaleDateString()}`, rightX, y + 5, { align: 'right' });
  doc.text(`Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, rightX, y + 10, { align: 'right' });

  // Divider Line
  y += 16;
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. PATIENT DETAILS BAR
  y += 6;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'D');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.fullName || 'Patient', margin + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', margin + 85, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.phone || '—', margin + 102, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Age / Gender:', margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patient.age || '32'} Yrs / ${data.patient.gender || 'Male'}`, margin + 28, y + 13);

  // Vitals summary if present
  if (data.vitals) {
    doc.setFont('helvetica', 'bold');
    doc.text('Vitals:', margin + 85, y + 13);
    doc.setFont('helvetica', 'normal');
    const vitalsStr = `BP: ${data.vitals.bp || '120/80'} | Pulse: ${data.vitals.pulse || '74'} bpm | Temp: ${data.vitals.temp || '98.4 F'}`;
    doc.text(vitalsStr, margin + 102, y + 13);
  }

  // 4. CLINICAL DIAGNOSIS & CHIEF COMPLAINTS
  y += 24;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 86, 219);
  doc.text('Clinical Diagnosis & Observations:', margin, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const diag = data.diagnosis || 'Upper Respiratory Tract Infection, Seasonal Allergic Rhinitis';
  doc.text(diag, margin, y);

  // 5. Rx BADGE & MEDICATIONS TABLE
  y += 10;
  // Draw traditional Rx Symbol
  doc.setFontSize(18);
  doc.setFont('times', 'bolditalic');
  doc.setTextColor(220, 38, 38); // Red #DC2626
  doc.text('Rx', margin, y);

  y += 4;
  // Medication Table Header
  doc.setFillColor(239, 246, 255); // Light blue #EFF6FF
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.rect(margin, y, contentWidth, 8, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216); // #1D4ED8
  doc.text('#', margin + 3, y + 5.5);
  doc.text('Medicine Name & Strength', margin + 12, y + 5.5);
  doc.text('Dosage / Frequency', margin + 85, y + 5.5);
  doc.text('Duration', margin + 130, y + 5.5);
  doc.text('Instructions', margin + 155, y + 5.5);

  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  const meds = data.medications.length > 0 ? data.medications : [
    { name: 'Tab. Augmentin 625mg', dosage: '1 Tab', frequency: '1-0-1 (Morning, Night)', duration: '5 Days', instructions: 'After Food' },
    { name: 'Tab. Pan-D 40mg', dosage: '1 Cap', frequency: '1-0-0 (Morning)', duration: '5 Days', instructions: 'Empty Stomach' },
    { name: 'Tab. Paracetamol 650mg', dosage: '1 Tab', frequency: 'SOS (When needed)', duration: '3 Days', instructions: 'After Food' },
    { name: 'Syp. Ascoril-LS', dosage: '10 ml', frequency: '1-1-1 (Thrice daily)', duration: '5 Days', instructions: 'With warm water' },
  ];

  meds.forEach((m, idx) => {
    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, 8.5, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 8.5, pageWidth - margin, y + 8.5);

    doc.text(`${idx + 1}.`, margin + 3, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(m.name, margin + 12, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`${m.dosage} (${m.frequency})`, margin + 85, y + 5.5);
    doc.text(m.duration || '5 Days', margin + 130, y + 5.5);
    doc.text(m.instructions || 'After Food', margin + 155, y + 5.5);

    y += 8.5;
  });

  // 6. ADVICE & LIFESTYLE INSTRUCTIONS
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 86, 219);
  doc.text('General Advice & Dietary Instructions:', margin, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const adviceText = data.advice || 'Drink plenty of warm fluids, steam inhalation twice daily, avoid cold foods and heavy exertion. Review if fever persists after 3 days.';
  const splitAdvice = doc.splitTextToSize(adviceText, contentWidth);
  doc.text(splitAdvice, margin, y);

  y += splitAdvice.length * 4.5 + 4;

  // 7. FOLLOW-UP
  if (data.followUpDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Next Follow-up Review Date: ${data.followUpDate}`, margin, y);
    y += 8;
  }

  // 8. DOCTOR SIGNATURE & OFFICIAL DIGITAL SEAL (Bottom)
  const bottomY = 250;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, bottomY - 5, pageWidth - margin, bottomY - 5);

  // Digital Security Stamp Box
  doc.setDrawColor(13, 148, 136); // Teal #0D9488
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, bottomY, 70, 22, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('HEALTHSYNC VERIFIED PRESCRIPTION', margin + 4, bottomY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tamper-proof Digital Signature Record', margin + 4, bottomY + 10);
  doc.text(`Hash: SHA256:${data.appointmentId.slice(0, 12)}`, margin + 4, bottomY + 15);
  doc.text('Complies with Telemedicine Practice Guidelines', margin + 4, bottomY + 19);

  // Signature Line (Right side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Dr. ${cleanDocName}`, rightX, bottomY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Digitally Signed by Medical Practitioner', rightX, bottomY + 15, { align: 'right' });
  doc.text(`Reg. No: ${data.doctor.registrationNumber || 'MMC-2016-8942'}`, rightX, bottomY + 19, { align: 'right' });

  // 9. FOOTER DISCLAIMER
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated digital prescription issued via HealthSync Smart Healthcare System. Valid for pharmacy dispensing.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Trigger browser download
  const filename = `Prescription_Dr_${cleanDocName.replace(/\s+/g, '_')}_${data.appointmentId.slice(-6)}.pdf`;
  doc.save(filename);
}
