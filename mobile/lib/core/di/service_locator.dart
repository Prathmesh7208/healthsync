import 'package:get_it/get_it.dart';
import 'package:healthsync_mobile/core/network/dio_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:healthsync_mobile/features/auth/presentation/bloc/auth_bloc.dart';

final sl = GetIt.instance;

Future<void> initServiceLocator() async {
  // Core
  sl.registerLazySingleton(() => DioClient());
  sl.registerLazySingleton(() => const FlutterSecureStorage());

  // Repositories
  // sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(sl(), sl()));

  // Blocs
  sl.registerFactory(
      () => AuthBloc(sl<DioClient>(), sl<FlutterSecureStorage>()));
}
