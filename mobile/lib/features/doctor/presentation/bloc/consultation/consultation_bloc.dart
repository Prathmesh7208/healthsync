import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:healthsync_mobile/features/patient/domain/entities/prescription.dart';

part 'consultation_event.dart';
part 'consultation_state.dart';

class ConsultationBloc extends Bloc<ConsultationEvent, ConsultationState> {
  ConsultationBloc() : super(ConsultationInitial()) {
    on<StartConsultation>((event, emit) async {
      emit(ConsultationInProgress());
    });

    on<AddMedication>((event, emit) {
      if (state is ConsultationInProgress) {
        final current = (state as ConsultationInProgress);
        emit(current
            .copyWith(medications: [...current.medications, event.medication]));
      }
    });

    on<CompleteConsultation>((event, emit) async {
      emit(ConsultationSaving());
      // Simulate API call to save and generate PDF
      await Future.delayed(const Duration(seconds: 2));
      emit(ConsultationCompleted());
    });
  }
}
