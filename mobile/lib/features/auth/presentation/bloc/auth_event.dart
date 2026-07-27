part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String mobileNumber;
  final String? fullName;
  final String? requestedRole;
  const LoginRequested(this.mobileNumber, {this.fullName, this.requestedRole});

  @override
  List<Object?> get props => [mobileNumber, fullName, requestedRole];
}

class OtpVerified extends AuthEvent {
  final String mobileNumber;
  final String otp;
  final String? fullName;
  final String? requestedRole;
  const OtpVerified(this.mobileNumber, this.otp,
      {this.fullName, this.requestedRole});

  @override
  List<Object?> get props => [mobileNumber, otp, fullName, requestedRole];
}

class LogoutRequested extends AuthEvent {}
