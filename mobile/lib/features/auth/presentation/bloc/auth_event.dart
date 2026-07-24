part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class AuthCheckRequested extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String mobileNumber;
  const LoginRequested(this.mobileNumber);

  @override
  List<Object> get props => [mobileNumber];
}

class OtpVerified extends AuthEvent {
  final String mobileNumber;
  final String otp;
  const OtpVerified(this.mobileNumber, this.otp);

  @override
  List<Object> get props => [mobileNumber, otp];
}

class LogoutRequested extends AuthEvent {}
