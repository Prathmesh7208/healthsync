part of 'consultation_bloc.dart';

abstract class ConsultationEvent extends Equatable {
  const ConsultationEvent();

  @override
  List<Object> get props => [];
}

class StartConsultation extends ConsultationEvent {
  final String appointmentId;
  const StartConsultation(this.appointmentId);

  @override
  List<Object> get props => [appointmentId];
}

class AddMedication extends ConsultationEvent {
  final Medication medication;
  const AddMedication(this.medication);

  @override
  List<Object> get props => [medication];
}

class CompleteConsultation extends ConsultationEvent {
  final String diagnosis;
  final String instructions;
  const CompleteConsultation(this.diagnosis, this.instructions);

  @override
  List<Object> get props => [diagnosis, instructions];
}
