import 'package:flutter/material.dart';

class ConsultationScreen extends StatefulWidget {
  const ConsultationScreen({super.key});

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  final _diagnosisController = TextEditingController();
  final List<Map<String, String>> _medications = [];

  void _addMedication() {
    setState(() {
      _medications.add({
        'name': '',
        'dosage': '',
        'frequency': '',
        'duration': '',
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Consultation'),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('History',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildPatientBrief(),
            const SizedBox(height: 24),
            const Text('Diagnosis',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _diagnosisController,
              maxLines: 3,
              decoration:
                  const InputDecoration(hintText: 'Enter diagnosis details...'),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Medications',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: _addMedication,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Medicine'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._medications.map(_buildMedicationForm),
            if (_medications.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Text('No medications added yet',
                      style: TextStyle(color: Colors.grey)),
                ),
              ),
            const SizedBox(height: 24),
            const Text('Advice / Instructions',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const TextField(
              maxLines: 2,
              decoration:
                  InputDecoration(hintText: 'Enter special instructions...'),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Complete & Generate Prescription'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPatientBrief() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.blue.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12)),
      child: const Row(
        children: [
          CircleAvatar(
              backgroundColor: Colors.blue,
              child: Icon(Icons.person, color: Colors.white)),
          SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Rajesh Kumar',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text('Male, 34 Yrs • HS-2026-112233',
                  style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationForm(Map<String, String> medication) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(
              decoration: const InputDecoration(
                  labelText: 'Medicine Name', filled: false),
              onChanged: (v) => medication['name'] = v,
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                        labelText: 'Dosage', filled: false),
                    onChanged: (v) => medication['dosage'] = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                        labelText: 'Frequency', filled: false),
                    onChanged: (v) => medication['frequency'] = v,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
