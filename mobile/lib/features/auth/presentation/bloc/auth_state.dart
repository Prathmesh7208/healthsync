part of 'auth_bloc.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthenticatedPatient extends AuthState {}

class AuthenticatedDoctor extends AuthState {}

class AuthenticatedReceptionist extends AuthState {}

class Unauthenticated extends AuthState {}

class OtpSent extends AuthState {
  final String mobileNumber;
  const OtpSent(this.mobileNumber);

  @override
  List<Object> get props => [mobileNumber];
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);

  @override
  List<Object> get props => [message];
}
