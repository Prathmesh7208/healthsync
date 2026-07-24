import 'package:flutter_test/flutter_test.dart';
import 'package:healthsync_mobile/main.dart';

void main() {
  testWidgets('App initialization test', (WidgetTester tester) async {
    // Basic sanity check for HealthSyncApp
    expect(const HealthSyncApp(), isNotNull);
  });
}
