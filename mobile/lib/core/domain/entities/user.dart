import 'package:equatable/equatable.dart';

enum UserRole { patient, doctor, receptionist, admin }

class User extends Equatable {
  final String id;
  final String mobileNumber;
  final String fullName;
  final UserRole role;
  final String? profilePhotoUrl;

  const User({
    required this.id,
    required this.mobileNumber,
    required this.fullName,
    required this.role,
    this.profilePhotoUrl,
  });

  @override
  List<Object?> get props => [id, mobileNumber, fullName, role, profilePhotoUrl];
}
