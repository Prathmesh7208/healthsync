import 'package:equatable/equatable.dart';

enum ConsentStatus { requested, granted, denied, revoked, expired }
enum AccessDuration { thisVisit, twentyFourHours, sevenDays, untilRevoked }

class Consent extends Equatable {
  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String clinicName;
  final ConsentStatus status;
  final AccessDuration? duration;
  final List<String> recordTypes;
  final String purpose;
  final DateTime? grantedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;

  const Consent({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.clinicName,
    required this.status,
    this.duration,
    this.recordTypes = const ['ALL'],
    required this.purpose,
    this.grantedAt,
    this.expiresAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, patientId, doctorId, status, duration, recordTypes,
        purpose, grantedAt, expiresAt, createdAt
      ];
}
