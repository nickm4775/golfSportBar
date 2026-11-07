import 'package:flutter/material.dart';
import 'package:flutter_map_vector_tiles/flutter_map_vector_tiles.dart' as vt;

String mapStyleUrl({required bool dark}) {
  final style = dark ? 'dark' : 'positron';
  return 'https://tiles.openfreemap.org/styles/$style';
}

/// Loads the OpenFreeMap style for the theme and renders it as a map layer.
class ThemedMapLayer extends StatefulWidget {
  const ThemedMapLayer({super.key, required this.dark});

  final bool dark;

  @override
  State<ThemedMapLayer> createState() => _ThemedMapLayerState();
}

class _ThemedMapLayerState extends State<ThemedMapLayer> {
  vt.Style? _style;
  int _request = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(ThemedMapLayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.dark != widget.dark) _load();
  }

  @override
  void dispose() {
    _request++;
    _style?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final request = ++_request;
    try {
      final style = await vt.StyleReader(uri: mapStyleUrl(dark: widget.dark)).read();
      if (!mounted || request != _request) {
        style.dispose();
        return;
      }
      final previous = _style;
      setState(() => _style = style);
      WidgetsBinding.instance.addPostFrameCallback((_) => previous?.dispose());
    } on Exception catch (error) {
      debugPrint('Map style failed to load: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    final style = _style;
    if (style == null) return const SizedBox.shrink();
    return vt.VectorTileLayer(
      key: ValueKey(style),
      theme: style.theme,
      tileProviders: style.providers,
      rasterSources: style.rasterSources,
      sprites: style.sprites,
      glyphs: style.glyphs,
    );
  }
}
