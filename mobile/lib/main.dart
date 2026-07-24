import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthsync_mobile/core/di/service_locator.dart';
import 'package:healthsync_mobile/core/router/app_router.dart';
import 'package:healthsync_mobile/core/theme/app_theme.dart';
import 'package:healthsync_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize DI
  await initServiceLocator();

  // Initialize Local Storage
  await Hive.initFlutter();
  await Hive.openBox('settings');

  runApp(const HealthSyncApp());
}

class HealthSyncApp extends StatelessWidget {
  const HealthSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => sl<AuthBloc>()..add(AuthCheckRequested())),
      ],
      child: MaterialApp.router(
        title: 'HealthSync',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
