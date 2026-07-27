import 'package:equatable/equatable.dart';

class Medication extends Equatable {
  final String name;
  final String dosage;
  final String frequency;
  final String duration;
  final String timing;
  final String? notes;

  const Medication({
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.duration,
    required this.timing,
    this.notes,
  });

  @override
  List<Object?> get props => [name, dosage, frequency, duration, timing, notes];
}

class Prescription extends Equatable {
  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String diagnosis;
  final List<Medication> medications;
  final String? instructions;
  final DateTime date;
  final DateTime? followUpDate;

  const Prescription({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.diagnosis,
    required this.medications,
    this.instructions,
    required this.date,
    this.followUpDate,
  });

  @override
  List<Object?> get props => [
        id,
        patientId,
        doctorId,
        diagnosis,
        medications,
        instructions,
        date,
        followUpDate
      ];
}
