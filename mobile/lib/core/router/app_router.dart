import 'package:go_router/go_router.dart';
import 'package:healthsync_mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:healthsync_mobile/features/auth/presentation/screens/otp_screen.dart';
import 'package:healthsync_mobile/features/patient/presentation/screens/patient_dashboard.dart';
import 'package:healthsync_mobile/features/patient/presentation/screens/doctor_search_screen.dart';
import 'package:healthsync_mobile/features/patient/presentation/screens/privacy_settings_screen.dart';
import 'package:healthsync_mobile/features/doctor/presentation/screens/doctor_dashboard.dart';
import 'package:healthsync_mobile/features/doctor/presentation/screens/consultation_screen.dart';
import 'package:healthsync_mobile/features/reception/presentation/screens/reception_dashboard.dart';
import 'package:healthsync_mobile/features/settings/presentation/screens/settings_screen.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final details =
              Map<String, String>.from(state.extra as Map? ?? const {});
          return OtpScreen(
            mobileNumber: details['mobileNumber'] ?? '',
            fullName: details['fullName'],
            requestedRole: details['requestedRole'],
          );
        },
      ),
      GoRoute(
        path: '/patient/dashboard',
        builder: (context, state) => const PatientDashboard(),
      ),
      GoRoute(
        path: '/patient/search',
        builder: (context, state) => const DoctorSearchScreen(),
      ),
      GoRoute(
        path: '/patient/privacy',
        builder: (context, state) => const PrivacySettingsScreen(),
      ),
      GoRoute(
        path: '/doctor/dashboard',
        builder: (context, state) => const DoctorDashboard(),
      ),
      GoRoute(
        path: '/doctor/consultation',
        builder: (context, state) => const ConsultationScreen(),
      ),
      GoRoute(
        path: '/reception/dashboard',
        builder: (context, state) => const ReceptionDashboard(),
      ),
    ],
  );
}
