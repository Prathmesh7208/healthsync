import 'package:flutter/material.dart';

class HealthSyncIdCard extends StatelessWidget {
  final String name;
  final String healthSyncId;

  const HealthSyncIdCard({
    super.key,
    required this.name,
    required this.healthSyncId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF007BFF), Color(0xFF00C6FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'HealthSync ID',
                style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              Image.network(
                'https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=$healthSyncId',
                width: 40,
                height: 40,
                color: Colors.white,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.qr_code, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            healthSyncId,
            style: const TextStyle(color: Colors.white, fontSize: 16, letterSpacing: 2),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _buildInfoChip(Icons.bloodtype, 'B+'),
              const SizedBox(width: 12),
              _buildInfoChip(Icons.person, '34 Yrs'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }
}
