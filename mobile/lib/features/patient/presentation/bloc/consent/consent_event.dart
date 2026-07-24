part of 'consent_bloc.dart';

abstract class ConsentEvent extends Equatable {
  const ConsentEvent();

  @override
  List<Object> get props => [];
}

class LoadConsents extends ConsentEvent {}

class GrantConsent extends ConsentEvent {
  final String consentId;
  final AccessDuration duration;
  const GrantConsent(this.consentId, this.duration);

  @override
  List<Object> get props => [consentId, duration];
}

class RevokeConsent extends ConsentEvent {
  final String consentId;
  const RevokeConsent(this.consentId);

  @override
  List<Object> get props => [consentId];
}
