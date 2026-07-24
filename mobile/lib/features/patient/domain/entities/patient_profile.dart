import 'package:healthsync_mobile/core/domain/entities/user.dart';

class PatientProfile extends User {
  final String healthSyncId;
  final DateTime dob;
  final String gender;
  final String? bloodGroup;
  final String? emergencyContactName;
  final String? emergencyContactNumber;

  const PatientProfile({
    required super.id,
    required super.mobileNumber,
    required super.fullName,
    required super.role,
    required this.healthSyncId,
    required this.dob,
    required this.gender,
    this.bloodGroup,
    this.emergencyContactName,
    this.emergencyContactNumber,
    super.profilePhotoUrl,
  });

  @override
  List<Object?> get props => [
        ...super.props,
        healthSyncId,
        dob,
        gender,
        bloodGroup,
        emergencyContactName,
        emergencyContactNumber,
      ];
}
