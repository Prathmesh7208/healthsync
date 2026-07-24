import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class DioClient {
  late Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final Box _settingsBox = Hive.box('settings');

  static const String defaultUrl = 'http://10.0.2.2:3000/v1';

  DioClient() {
    final baseUrl = _settingsBox.get('backend_url', defaultValue: defaultUrl);
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseBody: true,
      responseHeader: false,
      error: true,
      compact: true,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          // TODO: Implement Refresh Token Logic
        }
        return handler.next(e);
      },
    ));
  }

  /// Updates the base URL at runtime and persists it
  void updateBaseUrl(String newUrl) {
    _settingsBox.put('backend_url', newUrl);
    _dio.options.baseUrl = newUrl;
  }

  Dio get dio => _dio;
}
