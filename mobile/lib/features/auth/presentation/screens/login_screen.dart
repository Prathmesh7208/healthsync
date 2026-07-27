import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthsync_mobile/features/auth/presentation/bloc/auth_bloc.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _mobileController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isRegistering = false;
  String _role = 'PATIENT';

  @override
  void dispose() {
    _mobileController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => context.push('/settings'),
            icon: const Icon(Icons.settings_outlined),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is OtpSent) {
            context.push('/otp', extra: {
              'mobileNumber': state.mobileNumber,
              if (_isRegistering) 'fullName': _nameController.text.trim(),
              if (_isRegistering) 'requestedRole': _role,
            });
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 28),
                      Text(
                        _isRegistering
                            ? 'Create your HealthSync account'
                            : 'Welcome to HealthSync',
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isRegistering
                            ? 'Choose your role and verify your mobile number to get started.'
                            : 'Login with your mobile number to continue',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey,
                            ),
                      ),
                      const SizedBox(height: 28),
                      SegmentedButton<bool>(
                        segments: const [
                          ButtonSegment(
                              value: false,
                              label: Text('Login'),
                              icon: Icon(Icons.login)),
                          ButtonSegment(
                              value: true,
                              label: Text('Register'),
                              icon: Icon(Icons.person_add_alt_1)),
                        ],
                        selected: {_isRegistering},
                        onSelectionChanged: (selection) =>
                            setState(() => _isRegistering = selection.first),
                      ),
                      const SizedBox(height: 24),
                      if (_isRegistering) ...[
                        TextFormField(
                          controller: _nameController,
                          textCapitalization: TextCapitalization.words,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.name],
                          decoration: const InputDecoration(
                              labelText: 'Full name',
                              prefixIcon: Icon(Icons.person_outline)),
                          validator: (value) => !_isRegistering ||
                                  (value?.trim().length ?? 0) >= 2
                              ? null
                              : 'Enter your full name',
                        ),
                        const SizedBox(height: 16),
                        Text('Register as',
                            style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: {
                            'PATIENT': (
                              'Patient',
                              Icons.personal_injury_outlined
                            ),
                            'DOCTOR': (
                              'Doctor',
                              Icons.medical_services_outlined
                            ),
                            'RECEPTIONIST': (
                              'Receptionist',
                              Icons.support_agent_outlined
                            ),
                          }
                              .entries
                              .map((entry) => ChoiceChip(
                                    label: Text(entry.value.$1),
                                    avatar: Icon(entry.value.$2, size: 18),
                                    selected: _role == entry.key,
                                    onSelected: (_) =>
                                        setState(() => _role = entry.key),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 16),
                        if (_role != 'PATIENT')
                          const Text(
                              'Provider and receptionist accounts are reviewed by the clinic before access is enabled.',
                              style:
                                  TextStyle(fontSize: 12, color: Colors.grey)),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _mobileController,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.telephoneNumber],
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        maxLength: 10,
                        decoration: const InputDecoration(
                          labelText: 'Mobile Number',
                          prefixText: '+91 ',
                          hintText: 'Enter 10 digit number',
                          counterText: '',
                        ),
                        validator: (value) {
                          if (value == null ||
                              !RegExp(r'^[6-9]\d{9}$').hasMatch(value)) {
                            return 'Please enter a valid 10-digit number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 32),
                      BlocBuilder<AuthBloc, AuthState>(
                        builder: (context, state) {
                          return ElevatedButton(
                            onPressed: state is AuthLoading
                                ? null
                                : () {
                                    if (_formKey.currentState!.validate()) {
                                      context.read<AuthBloc>().add(
                                            LoginRequested(
                                              _mobileController.text,
                                              fullName: _isRegistering
                                                  ? _nameController.text.trim()
                                                  : null,
                                              requestedRole:
                                                  _isRegistering ? _role : null,
                                            ),
                                          );
                                    }
                                  },
                            child: state is AuthLoading
                                ? const CircularProgressIndicator(
                                    color: Colors.white)
                                : Text(_isRegistering
                                    ? 'Create account'
                                    : 'Send OTP'),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
