import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:healthsync_mobile/core/network/dio_client.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this._client, this._storage) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<LoginRequested>(_onLoginRequested);
    on<OtpVerified>(_onOtpVerified);
    on<LogoutRequested>(_onLogoutRequested);
  }

  final DioClient _client;
  final FlutterSecureStorage _storage;

  Future<void> _onAuthCheckRequested(
      AuthCheckRequested event, Emitter<AuthState> emit) async {
    final role = await _storage.read(key: 'user_role');
    final token = await _storage.read(key: 'access_token');
    if (token == null || role == null) {
      return emit(Unauthenticated());
    }
    _emitRole(role, emit);
  }

  Future<void> _onLoginRequested(
      LoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await _client.dio
          .post('/auth/login', data: {'mobileNumber': event.mobileNumber});
      emit(OtpSent(event.mobileNumber));
    } on DioException catch (error) {
      emit(AuthError(_safeMessage(error)));
    } catch (_) {
      emit(const AuthError('Unable to send the OTP. Please try again.'));
    }
  }

  Future<void> _onOtpVerified(
      OtpVerified event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await _client.dio.post('/auth/verify', data: {
        'mobileNumber': event.mobileNumber,
        'otpCode': event.otp,
      });
      final data = Map<String, dynamic>.from(response.data as Map);
      final user = Map<String, dynamic>.from(data['user'] as Map? ?? const {});
      final role = (user['role'] ?? '').toString().toUpperCase();
      final token = data['token']?.toString();
      final refreshToken = data['refreshToken']?.toString();
      if (token == null || role.isEmpty) {
        return emit(const AuthError(
            'We could not complete sign-in. Please try again.'));
      }
      await _storage.write(key: 'access_token', value: token);
      await _storage.write(key: 'refresh_token', value: refreshToken);
      await _storage.write(key: 'user_role', value: role);
      _emitRole(role, emit);
    } on DioException catch (error) {
      emit(AuthError(_safeMessage(error)));
    } catch (_) {
      emit(const AuthError('Unable to verify the OTP. Please try again.'));
    }
  }

  Future<void> _onLogoutRequested(
      LogoutRequested event, Emitter<AuthState> emit) async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    await _storage.delete(key: 'user_role');
    emit(Unauthenticated());
  }

  void _emitRole(String role, Emitter<AuthState> emit) {
    switch (role.toUpperCase()) {
      case 'DOCTOR':
        emit(AuthenticatedDoctor());
      case 'RECEPTIONIST':
        emit(AuthenticatedReceptionist());
      default:
        emit(AuthenticatedPatient());
    }
  }

  String _safeMessage(DioException error) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.connectionError) {
      return 'Unable to reach HealthSync. Check your connection and try again.';
    }
    return 'Something went wrong. Please try again.';
  }
}
