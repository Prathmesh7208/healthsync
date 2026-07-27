import 'package:flutter/material.dart';

class ReceptionDashboard extends StatelessWidget {
  const ReceptionDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('City Clinic Reception'),
        actions: [
          IconButton(
              onPressed: () {}, icon: const Icon(Icons.notifications_none)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTodaySummary(context),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                    child: _buildActionButton(
                        context, 'Walk-in', Icons.add_circle, Colors.blue)),
                const SizedBox(width: 16),
                Expanded(
                    child: _buildActionButton(
                        context, 'Check-in', Icons.how_to_reg, Colors.green)),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Doctor Status & Queues',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildDoctorQueueCard(context, 'Dr. Amit Shah', 'Orthopedics',
                'Token #13', '8 Waiting', true),
            _buildDoctorQueueCard(context, 'Dr. Priya Mehra', 'Dermatology',
                '--', '0 Waiting', false),
          ],
        ),
      ),
    );
  }

  Widget _buildTodaySummary(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Today\'s Overview',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              Text('20 Jul 2026',
                  style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSummaryItem('Total', '65', Colors.black),
              _buildSummaryItem('Waiting', '22', Colors.orange),
              _buildSummaryItem('Done', '40', Colors.green),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _buildActionButton(
      BuildContext context, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(label,
              style: TextStyle(color: color, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildDoctorQueueCard(BuildContext context, String name, String spec,
      String current, String waiting, bool isActive) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                  backgroundColor: isActive ? Colors.green : Colors.grey,
                  radius: 4),
              const SizedBox(width: 8),
              Text(name,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const Spacer(),
              Text(spec,
                  style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Current Serving',
                      style: TextStyle(color: Colors.grey, fontSize: 11)),
                  Text(current,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.blue)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Queue Status',
                      style: TextStyle(color: Colors.grey, fontSize: 11)),
                  Text(waiting,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              ElevatedButton(
                onPressed: () {},
                style:
                    ElevatedButton.styleFrom(minimumSize: const Size(80, 32)),
                child: const Text('View List', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
