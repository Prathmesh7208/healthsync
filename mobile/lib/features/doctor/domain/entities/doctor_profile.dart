import 'package:healthsync_mobile/core/domain/entities/user.dart';

class DoctorProfile extends User {
  final String specialization;
  final String qualifications;
  final int experienceYears;
  final double consultationFee;
  final String registrationNumber;
  final List<String> languages;
  final bool isVerified;

  const DoctorProfile({
    required super.id,
    required super.mobileNumber,
    required super.fullName,
    required super.role,
    required this.specialization,
    required this.qualifications,
    required this.experienceYears,
    required this.consultationFee,
    required this.registrationNumber,
    required this.languages,
    this.isVerified = false,
    super.profilePhotoUrl,
  });

  @override
  List<Object?> get props => [
        ...super.props,
        specialization,
        qualifications,
        experienceYears,
        consultationFee,
        registrationNumber,
        languages,
        isVerified,
      ];
}
