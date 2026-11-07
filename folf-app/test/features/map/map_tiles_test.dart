import 'package:flutter_test/flutter_test.dart';
import 'package:folf/features/map/presentation/map_tiles.dart';

void main() {
  test('uses the Positron style in light mode', () {
    expect(
      mapStyleUrl(dark: false),
      'https://tiles.openfreemap.org/styles/positron',
    );
  });

  test('uses the Dark style in dark mode', () {
    expect(
      mapStyleUrl(dark: true),
      'https://tiles.openfreemap.org/styles/dark',
    );
  });
}
