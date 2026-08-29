import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:folf/core/config/app_config.dart';
import 'package:get_it/get_it.dart';

class MenuImage extends StatelessWidget {
  const MenuImage({super.key, required this.src, this.size = 64});

  final String? src;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final fallback = DecoratedBox(
      decoration: BoxDecoration(
        color: colors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(Icons.local_bar_outlined, color: colors.primary, size: size * 0.42),
    );
    if (src == null || src!.isEmpty) {
      return SizedBox(width: size, height: size, child: fallback);
    }
    final base = GetIt.I<AppConfig>().menuAssetBaseUrl;
    final url = src!.startsWith('http') ? src! : '$base$src';
    if (url.endsWith('.svg')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SvgPicture.network(
          url,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholderBuilder: (_) => fallback,
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: CachedNetworkImage(
        imageUrl: url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => fallback,
      ),
    );
  }
}
