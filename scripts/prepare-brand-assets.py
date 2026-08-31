#!/usr/bin/env python3
"""Build Golf Sport Bar brand PNGs from the official wordmark photos.

The white wordmark is the high-res master. Black is knocked out to alpha.
The light-theme variant recolors script/sans text to charcoal and keeps the
photorealistic ball. Native icons use the ball on charcoal (#0A0F0C).
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "brand" / "source"
WHITE_NAME = "golf-sport-bar-logo-white.png"
DARK_NAME = "golf-sport-bar-logo-dark.png"

CHARCOAL = (10, 15, 12, 255)
INK = (26, 26, 26)
CREAM = (247, 248, 246, 255)

FRONT_BRAND = ROOT / "folf-front" / "public" / "brand"
APP_BRAND = ROOT / "folf-app" / "assets" / "brand"
ANDROID_RES = ROOT / "folf-app" / "android" / "app" / "src" / "main" / "res"
IOS_ICON = ROOT / "folf-app" / "ios" / "Runner" / "Assets.xcassets" / "AppIcon.appiconset"
IOS_LAUNCH = ROOT / "folf-app" / "ios" / "Runner" / "Assets.xcassets" / "LaunchImage.imageset"

ANDROID_MIPMAP = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

IOS_ICONS = {
    "Icon-App-20x20@1x.png": 20,
    "Icon-App-20x20@2x.png": 40,
    "Icon-App-20x20@3x.png": 60,
    "Icon-App-29x29@1x.png": 29,
    "Icon-App-29x29@2x.png": 58,
    "Icon-App-29x29@3x.png": 87,
    "Icon-App-40x40@1x.png": 40,
    "Icon-App-40x40@2x.png": 80,
    "Icon-App-40x40@3x.png": 120,
    "Icon-App-60x60@2x.png": 120,
    "Icon-App-60x60@3x.png": 180,
    "Icon-App-76x76@1x.png": 76,
    "Icon-App-76x76@2x.png": 152,
    "Icon-App-83.5x83.5@2x.png": 167,
    "Icon-App-1024x1024@1x.png": 1024,
}


def luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def knockout_black(im: Image.Image, floor: int = 10) -> Image.Image:
    src = im.convert("RGBA")
    w, h = src.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    spx = src.load()
    dpx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _a = spx[x, y]
            m = max(r, g, b)
            if m <= floor:
                continue
            dpx[x, y] = (r, g, b, m)
    return out


def alpha_bbox(im: Image.Image, threshold: int = 12) -> tuple[int, int, int, int]:
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > threshold:
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not found:
        raise RuntimeError("No opaque pixels to crop")
    return minx, miny, maxx + 1, maxy + 1


def crop_padded(im: Image.Image, pad_ratio: float = 0.03) -> Image.Image:
    box = alpha_bbox(im)
    w, h = im.size
    bw, bh = box[2] - box[0], box[3] - box[1]
    pad = max(4, int(max(bw, bh) * pad_ratio))
    crop = (
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(w, box[2] + pad),
        min(h, box[3] + pad),
    )
    return im.crop(crop)


def find_ball(im: Image.Image, thresh: int = 120) -> tuple[float, float, float]:
    gray = im.convert("L")
    w, h = gray.size
    px = gray.load()
    seen = bytearray(w * h)
    best = None

    def idx(x: int, y: int) -> int:
        return y * w + x

    for y in range(h):
        for x in range(w):
            i = idx(x, y)
            if seen[i] or px[x, y] <= thresh:
                continue
            stack = [(x, y)]
            seen[i] = 1
            minx = maxx = x
            miny = maxy = y
            n = 0
            while stack:
                cx, cy = stack.pop()
                n += 1
                if cx < minx:
                    minx = cx
                elif cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                elif cy > maxy:
                    maxy = cy
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = idx(nx, ny)
                        if not seen[j] and px[nx, ny] > thresh:
                            seen[j] = 1
                            stack.append((nx, ny))
            bw, bh = maxx - minx + 1, maxy - miny + 1
            ratio = bw / bh
            if n < 800 or not (0.85 <= ratio <= 1.18):
                continue
            candidate = (n, minx, miny, maxx, maxy)
            if best is None or candidate[0] > best[0]:
                best = candidate

    if best is None:
        raise RuntimeError("Could not locate golf ball in wordmark")

    _n, minx, miny, maxx, maxy = best
    cx = (minx + maxx) / 2
    cy = (miny + maxy) / 2
    radius = max(maxx - minx, maxy - miny) / 2
    return cx, cy, radius


def recolor_text(im: Image.Image, cx: float, cy: float, radius: float) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    r2 = radius * radius
    ink_r, ink_g, ink_b = INK
    for y in range(h):
        dy = y - cy
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            dx = x - cx
            if dx * dx + dy * dy <= r2:
                continue
            px[x, y] = (ink_r, ink_g, ink_b, a)
    return out


def circular_alpha(size: tuple[int, int], cx: float, cy: float, radius: float, feather: float = 2.5) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w, h), 0)
    px = mask.load()
    r_inner = max(0.0, radius - feather)
    r_outer = radius
    for y in range(h):
        dy = y - cy
        for x in range(w):
            dist = (dx := x - cx) * dx + dy * dy
            dist = dist ** 0.5
            if dist <= r_inner:
                px[x, y] = 255
            elif dist < r_outer:
                t = (r_outer - dist) / max(feather, 0.001)
                px[x, y] = int(255 * t)
    return mask


def extract_mark(im: Image.Image, cx: float, cy: float, radius: float) -> Image.Image:
    pad = radius + 4
    w, h = im.size
    box = (
        max(0, int(cx - pad)),
        max(0, int(cy - pad)),
        min(w, int(cx + pad)),
        min(h, int(cy + pad)),
    )
    cropped = knockout_black(im.crop(box), floor=8)
    local_cx = cx - box[0]
    local_cy = cy - box[1]
    disc = circular_alpha(cropped.size, local_cx, local_cy, radius, feather=3)
    out = cropped.copy()
    out.putalpha(Image.new("L", cropped.size, 0))
    alpha = ImageChops.multiply(cropped.split()[3], disc)
    out.putalpha(alpha)
    return out


def square_icon(mark: Image.Image, size: int, coverage: float = 0.72) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), CHARCOAL)
    ball = mark.convert("RGBA")
    target = max(1, int(size * coverage))
    bw, bh = ball.size
    scale = target / max(bw, bh)
    nw, nh = max(1, round(bw * scale)), max(1, round(bh * scale))
    ball = ball.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(ball, (x, y))
    return canvas.convert("RGB")


def fit_width(im: Image.Image, width: int) -> Image.Image:
    w, h = im.size
    if w == width:
        return im
    height = max(1, round(h * (width / w)))
    return im.resize((width, height), Image.Resampling.LANCZOS)


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def build_og_image(logo: Image.Image, path: Path, width: int = 1200, height: int = 630) -> None:
    canvas = Image.new("RGBA", (width, height), CREAM)
    logo_rgba = logo.convert("RGBA")
    max_w = int(width * 0.72)
    max_h = int(height * 0.55)
    scale = min(max_w / logo_rgba.width, max_h / logo_rgba.height)
    new_size = (max(1, round(logo_rgba.width * scale)), max(1, round(logo_rgba.height * scale)))
    logo_resized = logo_rgba.resize(new_size, Image.Resampling.LANCZOS)
    x = (width - new_size[0]) // 2
    y = (height - new_size[1]) // 2
    canvas.alpha_composite(logo_resized, (x, y))
    save_png(canvas.convert("RGB"), path)


def main() -> None:
    white_path = SOURCE_DIR / WHITE_NAME
    dark_path = SOURCE_DIR / DARK_NAME
    if not white_path.exists() or not dark_path.exists():
        raise SystemExit(f"Missing source photos in {SOURCE_DIR}")

    white = Image.open(white_path).convert("RGB")
    cx, cy, radius = find_ball(white)

    knocked = knockout_black(white)
    on_dark = crop_padded(knocked)
    # Translate ball into cropped coordinates.
    box = alpha_bbox(knocked)
    pad = max(4, int(max(box[2] - box[0], box[3] - box[1]) * 0.03))
    crop_origin = (max(0, box[0] - pad), max(0, box[1] - pad))
    on_light = recolor_text(
        on_dark,
        cx - crop_origin[0],
        cy - crop_origin[1],
        radius * 1.08,
    )

    mark = crop_padded(extract_mark(white, cx, cy, radius * 1.02), pad_ratio=0.06)
    icon = square_icon(mark, 1024)

    splash_dark = fit_width(on_dark, 420)
    splash_light = fit_width(on_light, 420)

    for dest in (FRONT_BRAND, APP_BRAND):
        save_png(on_light, dest / "logo-on-light.png")
        save_png(on_dark, dest / "logo-on-dark.png")
        save_png(mark, dest / "mark.png")
        save_png(icon, dest / "icon.png")

    build_og_image(on_light, FRONT_BRAND / "og-image.png")

    save_png(icon, ROOT / "folf-front" / "public" / "favicon.png")

    for folder, size in ANDROID_MIPMAP.items():
        save_png(square_icon(mark, size), ANDROID_RES / folder / "ic_launcher.png")

    save_png(splash_light, ANDROID_RES / "drawable" / "splash_logo.png")
    save_png(splash_dark, ANDROID_RES / "drawable-night" / "splash_logo.png")

    for name, size in IOS_ICONS.items():
        save_png(square_icon(mark, size), IOS_ICON / name)

    save_png(fit_width(on_dark, 280), IOS_LAUNCH / "LaunchImage.png")
    save_png(fit_width(on_dark, 560), IOS_LAUNCH / "LaunchImage@2x.png")
    save_png(fit_width(on_dark, 840), IOS_LAUNCH / "LaunchImage@3x.png")

    print("Wrote brand assets")
    print(f"  wordmark {on_dark.size}, mark {mark.size}, ball r={radius:.1f} at ({cx:.1f},{cy:.1f})")
    print(f"  source dark kept at {dark_path} ({Image.open(dark_path).size})")


if __name__ == "__main__":
    main()
