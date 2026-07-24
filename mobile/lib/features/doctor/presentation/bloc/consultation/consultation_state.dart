part of 'consultation_bloc.dart';

abstract class ConsultationState extends Equatable {
  const ConsultationState();

  @override
  List<Object> get props => [];
}

class ConsultationInitial extends ConsultationState {}

class ConsultationInProgress extends ConsultationState {
  final List<Medication> medications;
  const ConsultationInProgress({this.medications = const []});

  ConsultationInProgress copyWith({List<Medication>? medications}) {
    return ConsultationInProgress(medications: medications ?? this.medications);
  }

  @override
  List<Object> get props => [medications];
}

class ConsultationSaving extends ConsultationState {}

class ConsultationCompleted extends ConsultationState {}

class ConsultationError extends ConsultationState {
  final String message;
  const ConsultationError(this.message);

  @override
  List<Object> get props => [message];
}
