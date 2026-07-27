import 'package:flutter/material.dart';
import 'package:healthsync_mobile/core/di/service_locator.dart';
import 'package:healthsync_mobile/core/network/dio_client.dart';
import 'package:hive_flutter/hive_flutter.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  final Box _settingsBox = Hive.box('settings');

  @override
  void initState() {
    super.initState();
    final currentUrl =
        _settingsBox.get('backend_url', defaultValue: DioClient.defaultUrl);
    _urlController = TextEditingController(text: currentUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _saveSettings() {
    final newUrl = _urlController.text.trim();
    if (newUrl.isNotEmpty) {
      try {
        sl<DioClient>().updateBaseUrl(newUrl);
      } on FormatException catch (error) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('API Configuration Saved Successfully')),
      );
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Backend Settings'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'API Base URL',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            const Text(
              'Configure the backend endpoint for HealthSync services.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'Endpoint URL',
                hintText: 'http://192.168.1.1:3000/v1',
                prefixIcon: Icon(Icons.link),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saveSettings,
              child: const Text('Save Configuration'),
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () {
                  _urlController.text = DioClient.defaultUrl;
                },
                child: const Text('Reset to Default'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
