import 'package:flutter/material.dart';
import 'package:healthsync_mobile/features/patient/domain/entities/prescription.dart';

class PrescriptionViewerScreen extends StatelessWidget {
  final Prescription prescription;

  const PrescriptionViewerScreen({super.key, required this.prescription});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prescription Detail'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.download)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.share)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDoctorHeader(),
            const Divider(height: 40),
            _buildPatientInfo(),
            const SizedBox(height: 24),
            const Text('DIAGNOSIS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 8),
            Text(prescription.diagnosis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(height: 32),
            const Text('MEDICATIONS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 12),
            ...prescription.medications.map((m) => _buildMedicationItem(m)),
            const SizedBox(height: 32),
            if (prescription.instructions != null) ...[
              const Text('ADVICE / INSTRUCTIONS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 8),
              Text(prescription.instructions!),
              const SizedBox(height: 32),
            ],
            if (prescription.followUpDate != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.blue.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.event, color: Colors.blue),
                    const SizedBox(width: 16),
                    Text(
                      'Suggested Follow-up: 27 Jul 2026',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 60),
            const Center(
              child: Text(
                'Digitally signed by HealthSync System on behalf of Dr. Amit Shah',
                style: TextStyle(color: Colors.grey, fontSize: 10),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorHeader() {
    return Row(
      children: [
        const CircleAvatar(radius: 30, backgroundColor: Colors.blue, child: Icon(Icons.person, color: Colors.white, size: 30)),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(prescription.doctorName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Text('MBBS, MD (Orthopedics)', style: TextStyle(color: Colors.grey)),
            const Text('Reg No: AMC-12345', style: TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  Widget _buildPatientInfo() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('PATIENT', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 10)),
            const Text('Rajesh Kumar', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            const Text('DATE', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 10)),
            const Text('20 Jul 2026', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  Widget _buildMedicationItem(Medication medication) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Rx', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue, fontStyle: FontStyle.italic)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(medication.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text('${medication.dosage} • ${medication.frequency} • ${medication.duration}', style: const TextStyle(color: Colors.grey)),
                Text(medication.timing, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
