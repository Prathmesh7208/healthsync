import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthsync_mobile/features/auth/presentation/bloc/auth_bloc.dart';

class OtpScreen extends StatefulWidget {
  final String mobileNumber;
  const OtpScreen({super.key, required this.mobileNumber});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verification')),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthenticatedPatient) {
            context.go('/patient/dashboard');
          } else if (state is AuthenticatedDoctor) {
            context.go('/doctor/dashboard');
          } else if (state is AuthenticatedReceptionist) {
            context.go('/reception/dashboard');
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter OTP',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'We have sent a 6-digit code to +91 ${widget.mobileNumber}',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, letterSpacing: 12),
                decoration: const InputDecoration(
                  counterText: '',
                  hintText: '000000',
                ),
              ),
              const SizedBox(height: 32),
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, state) {
                  return ElevatedButton(
                    onPressed: state is AuthLoading
                        ? null
                        : () {
                            if (_otpController.text.length == 6) {
                              context.read<AuthBloc>().add(
                                    OtpVerified(
                                      widget.mobileNumber,
                                      _otpController.text,
                                    ),
                                  );
                            }
                          },
                    child: state is AuthLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Verify & Proceed'),
                  );
                },
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () {
                    context.read<AuthBloc>().add(LoginRequested(widget.mobileNumber));
                  },
                  child: const Text('Resend OTP'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
