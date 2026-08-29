import 'package:flutter/material.dart';
import 'package:folf/core/theme/gsb_colors.dart';
import 'package:google_fonts/google_fonts.dart';

class GsbTheme {
  static ThemeData light() => _build(
        brightness: Brightness.light,
        bg: GsbColors.cream,
        fg: GsbColors.forest,
        muted: GsbColors.lightMuted,
        accent: GsbColors.moss,
        accentSoft: GsbColors.sage,
        surface: const Color(0xF2FFFFFF),
      );

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        bg: GsbColors.charcoal,
        fg: GsbColors.darkFg,
        muted: GsbColors.darkMuted,
        accent: GsbColors.darkAccent,
        accentSoft: GsbColors.fairway,
        surface: const Color(0xC7121C16),
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color bg,
    required Color fg,
    required Color muted,
    required Color accent,
    required Color accentSoft,
    required Color surface,
  }) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: accent,
      onPrimary: Colors.white,
      secondary: accentSoft,
      onSecondary: fg,
      error: const Color(0xFFB42318),
      onError: Colors.white,
      surface: surface,
      onSurface: fg,
    );

    final textTheme = GoogleFonts.dmSansTextTheme(
      ThemeData(brightness: brightness).textTheme.apply(
            bodyColor: fg,
            displayColor: fg,
          ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: fg,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.cormorantGaramond(
          color: fg,
          fontSize: 28,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: fg.withValues(alpha: 0.12)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: fg.withValues(alpha: 0.12)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: accent, width: 1.4),
        ),
        labelStyle: TextStyle(color: muted),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: fg,
          minimumSize: const Size.fromHeight(52),
          shape: const StadiumBorder(),
          side: BorderSide(color: fg.withValues(alpha: 0.16)),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: accent.withValues(alpha: 0.1),
        selectedColor: accent,
        labelStyle: TextStyle(color: fg, fontWeight: FontWeight.w600),
        shape: const StadiumBorder(),
        side: BorderSide.none,
      ),
      dividerColor: fg.withValues(alpha: 0.08),
      popupMenuTheme: PopupMenuThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: TextStyle(color: fg),
      ),
    );
  }

  static TextStyle display(Color color) => GoogleFonts.cormorantGaramond(
        color: color,
        fontSize: 40,
        height: 1.05,
        fontWeight: FontWeight.w600,
      );

  static TextStyle script(Color color) => GoogleFonts.greatVibes(
        color: color,
        fontSize: 48,
        height: 1,
      );
}
