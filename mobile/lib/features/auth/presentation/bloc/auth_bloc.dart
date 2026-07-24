import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dio/dio.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final _dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/v1'));

  AuthBloc() : super(AuthInitial()) {
    on<AuthCheckRequested>((event, emit) async {
      emit(AuthLoading());
      await Future.delayed(const Duration(milliseconds: 500));
      emit(Unauthenticated());
    });

    on<LoginRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await _dio.post('/auth/login', data: {'mobileNumber': event.mobileNumber});
        emit(OtpSent(event.mobileNumber));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<OtpVerified>((event, emit) async {
      emit(AuthLoading());
      try {
        final res = await _dio.post('/auth/verify', data: {
          'mobileNumber': event.mobileNumber,
          'otp': event.otp,
        });
        final role = res.data['role'];
        if (role == 'doctor') {
          emit(AuthenticatedDoctor());
        } else {
          emit(AuthenticatedPatient());
        }
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<LogoutRequested>((event, emit) async {
      emit(AuthLoading());
      emit(Unauthenticated());
    });
  }
}
