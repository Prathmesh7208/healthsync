import 'package:flutter/material.dart';

class DoctorDashboard extends StatelessWidget {
  const DoctorDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Dr. Amit Shah'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTodaySummary(context),
            const SizedBox(height: 24),
            _buildCurrentPatient(context),
            const SizedBox(height: 24),
            const Text('Next in Queue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildQueueItem(context, '14', 'Priya Sharma', '11:30 AM', false),
            _buildQueueItem(context, '15', 'Amit Patel', '11:45 AM', false),
            _buildQueueItem(context, '16', 'Sunita Devi', '12:00 PM', false),
            const SizedBox(height: 24),
            _buildPendingRequests(context),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_month), label: 'Calendar'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Patients'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }

  Widget _buildTodaySummary(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryStat('Total', '25', Colors.blue),
          _buildSummaryStat('Done', '12', Colors.green),
          _buildSummaryStat('Left', '13', Colors.orange),
        ],
      ),
    );
  }

  Widget _buildSummaryStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _buildCurrentPatient(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF28A745), Color(0xFF218838)]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                child: const Text('13', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current Patient', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('Rajesh Kumar', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  ],
                ),
              ),
              const Icon(Icons.timer_outlined, color: Colors.white70),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {}, // Navigate to Consultation
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.green,
              minimumSize: const Size(double.infinity, 48),
            ),
            child: const Text('Start Consultation'),
          ),
        ],
      ),
    );
  }

  Widget _buildQueueItem(BuildContext context, String token, String name, String time, bool isDone) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Text('#$token', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
          const SizedBox(width: 16),
          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500))),
          Text(time, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildPendingRequests(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Pending Requests', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: const Text('2 NEW', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildRequestCard('Suresh Raina', 'Fever & Cough', 'Tomorrow, 09:30 AM'),
      ],
    );
  }

  Widget _buildRequestCard(String name, String reason, String time) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Row(
            children: [
              const CircleAvatar(backgroundColor: Colors.blue, radius: 20, child: Icon(Icons.person, color: Colors.white)),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(reason, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.access_time, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Text(time, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              const Spacer(),
              TextButton(onPressed: () {}, child: const Text('Decline', style: TextStyle(color: Colors.red))),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(minimumSize: const Size(80, 32)),
                child: const Text('Accept', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
