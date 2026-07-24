import 'package:equatable/equatable.dart';

enum AppointmentStatus { pending, confirmed, checkedIn, inProgress, completed, cancelled, noShow }

class Appointment extends Equatable {
  final String id;
  final String patientId;
  final String patientName;
  final String doctorId;
  final String doctorName;
  final String clinicId;
  final DateTime dateTime;
  final String? tokenNumber;
  final AppointmentStatus status;
  final String? reason;

  const Appointment({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.doctorId,
    required this.doctorName,
    required this.clinicId,
    required this.dateTime,
    this.tokenNumber,
    required this.status,
    this.reason,
  });

  @override
  List<Object?> get props => [id, patientId, doctorId, clinicId, dateTime, tokenNumber, status, reason];
}
