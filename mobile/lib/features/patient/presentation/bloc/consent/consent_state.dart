part of 'consent_bloc.dart';

abstract class ConsentState extends Equatable {
  const ConsentState();

  @override
  List<Object> get props => [];
}

class ConsentInitial extends ConsentState {}

class ConsentLoading extends ConsentState {}

class ConsentsLoaded extends ConsentState {
  final List<Consent> consents;
  const ConsentsLoaded(this.consents);

  @override
  List<Object> get props => [consents];
}

class ConsentError extends ConsentState {
  final String message;
  const ConsentError(this.message);

  @override
  List<Object> get props => [message];
}
