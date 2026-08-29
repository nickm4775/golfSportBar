import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:folf/app/app.dart';
import 'package:folf/injection.dart';
import 'package:google_fonts/google_fonts.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarContrastEnforced: false,
    ),
  );
  GoogleFonts.config.allowRuntimeFetching = true;
  await configureDependencies();
  runApp(const FolfApp());
}
