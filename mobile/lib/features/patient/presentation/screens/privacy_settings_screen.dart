import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthsync_mobile/features/patient/presentation/bloc/consent/consent_bloc.dart';
import 'package:healthsync_mobile/features/patient/domain/entities/consent.dart';

class PrivacySettingsScreen extends StatelessWidget {
  const PrivacySettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ConsentBloc()..add(LoadConsents()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Privacy & Consent')),
        body: BlocBuilder<ConsentBloc, ConsentState>(
          builder: (context, state) {
            if (state is ConsentLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is ConsentsLoaded) {
              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 24),
                  const Text('Active Access Grants', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  if (state.consents.where((c) => c.status == ConsentStatus.granted).isEmpty)
                    const Center(child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Text('No active access grants', style: TextStyle(color: Colors.grey)),
                    ))
                  else
                    ...state.consents.where((c) => c.status == ConsentStatus.granted).map((c) => _buildConsentCard(context, c)),
                  const SizedBox(height: 24),
                  const Text('Pending Requests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  // Mocked pending request
                  _buildPendingRequest(context),
                ],
              );
            }
            return const Center(child: Text('Something went wrong'));
          },
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.blue.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
      child: const Row(
        children: [
          Icon(Icons.lock_outline, color: Colors.blue),
          SizedBox(width: 16),
          Expanded(
            child: Text(
              'You have full control over who accesses your medical records. No doctor can see your history without your consent.',
              style: TextStyle(fontSize: 12, color: Colors.blue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsentCard(BuildContext context, Consent consent) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                const CircleAvatar(backgroundColor: Colors.blue, child: Icon(Icons.person, color: Colors.white)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(consent.doctorName, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(consent.clinicName, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => context.read<ConsentBloc>().add(RevokeConsent(consent.id)),
                  child: const Text('Revoke', style: TextStyle(color: Colors.red)),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Records: ${consent.recordTypes.join(", ")}', style: const TextStyle(fontSize: 11)),
                Text('Expires: 24 Jul 2026', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingRequest(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Row(
              children: [
                CircleAvatar(backgroundColor: Colors.orange, child: Icon(Icons.person, color: Colors.white)),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Dr. Priya Mehra', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('City Skin Clinic', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Requests access to your medical history for "Follow-up review of previous prescription".',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(onPressed: () {}, child: const Text('Deny')),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(onPressed: () => _showGrantDialog(context), child: const Text('Allow Access')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showGrantDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Grant Access Duration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('This Visit Only'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                title: const Text('24 Hours'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                title: const Text('7 Days'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                title: const Text('Until Revoked'),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }
}
