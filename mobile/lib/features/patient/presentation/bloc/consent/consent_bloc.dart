import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:healthsync_mobile/features/patient/domain/entities/consent.dart';

part 'consent_event.dart';
part 'consent_state.dart';

class ConsentBloc extends Bloc<ConsentEvent, ConsentState> {
  ConsentBloc() : super(ConsentInitial()) {
    on<LoadConsents>((event, emit) async {
      emit(ConsentLoading());
      // Mocked data
      await Future.delayed(const Duration(seconds: 1));
      emit(const ConsentsLoaded([]));
    });

    on<GrantConsent>((event, emit) async {
      emit(ConsentLoading());
      await Future.delayed(const Duration(seconds: 1));
      // Logic to update consent on server
      add(LoadConsents());
    });

    on<RevokeConsent>((event, emit) async {
      emit(ConsentLoading());
      await Future.delayed(const Duration(seconds: 1));
      add(LoadConsents());
    });
  }
}
