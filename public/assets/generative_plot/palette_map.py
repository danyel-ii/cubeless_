#!/usr/bin/env python3
"""
palette_map_with_bar.py — Remap an image onto a user-supplied palette (1–8 hex colors)
and append a palette bar at the bottom showing the colors used.

Dependencies:
  pip install pillow numpy

Examples:
  python palette_map_with_bar.py --in in.png --out out.png \
    --colors "#ABD9F0,#5CB7DA,#648BD5,#C2DE76,#64A828" \
    --mode nearest

  python palette_map_with_bar.py --in in.png --out out.png \
    --colors "#ABD9F0,#5CB7DA,#648BD5,#C2DE76,#64A828" \
    --mode dither

  python palette_map_with_bar.py --in in.png --out out.png \
    --colors "b#ABD9F0,#5CB7DA" --mode dither --bar-height 72 --no-hex

  python palette_map_with_bar.py --csv pallette.csv --in in.png --out-dir NEW_out

Notes:
- Mode "nearest" does per-pixel nearest-color mapping in RGB space (crisp).
- Mode "dither" uses Floyd–Steinberg dithering (more “pixel collage” texture).
- The palette bar always shows the palette you provided; if you want it to show only
  actually-used colors, see --used-only.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import re
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont


HEX_RE = re.compile(r"([0-9a-fA-F]{6})")


def parse_hex_color(s: str) -> Tuple[int, int, int]:
    """
    Accepts '#AABBCC', 'AABBCC', 'b#AABBCC' etc.
    Extracts first 6 hex digits and returns (r,g,b).
    """
    m = HEX_RE.search(s.strip())
    if not m:
        raise ValueError(f"Invalid hex color: {s!r}. Expected like '#AABBCC'.")
    h = m.group(1)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def parse_palette(colors_csv: str) -> List[Tuple[int, int, int]]:
    parts = [p.strip() for p in colors_csv.split(",") if p.strip()]
    if not (1 <= len(parts) <= 8):
        raise ValueError("Palette must have 1–8 colors (comma-separated).")
    return [parse_hex_color(p) for p in parts]


def parse_palette_semicolon(colors_scsv: str) -> List[Tuple[int, int, int]]:
    parts = [p.strip() for p in colors_scsv.split(";") if p.strip()]
    if not parts:
        raise ValueError("Palette must have at least 1 color (semicolon-separated).")
    return [parse_hex_color(p) for p in parts]


def nearest_palette_map(img_rgb: Image.Image, palette: List[Tuple[int, int, int]]) -> Image.Image:
    """
    Per-pixel nearest palette color in RGB space.
    """
    arr = np.asarray(img_rgb, dtype=np.int16)  # (H,W,3)
    pal = np.asarray(palette, dtype=np.int16)  # (K,3)
    diffs = arr[..., None, :] - pal[None, None, :, :]  # (H,W,K,3)
    d2 = (diffs * diffs).sum(axis=-1)  # (H,W,K)
    idx = d2.argmin(axis=-1)           # (H,W)
    out = pal[idx]                     # (H,W,3)
    return Image.fromarray(out.astype(np.uint8), mode="RGB")


def dither_palette_map(img_rgb: Image.Image, palette: List[Tuple[int, int, int]]) -> Image.Image:
    """
    Floyd–Steinberg dither using Pillow's quantize with a fixed palette.
    """
    pal_img = Image.new("P", (1, 1))
    flat: List[int] = []
    for (r, g, b) in palette:
        flat += [r, g, b]
    # Pad palette to 256 entries
    flat += [0, 0, 0] * (256 - len(palette))
    pal_img.putpalette(flat)

    return img_rgb.quantize(palette=pal_img, dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")


def used_colors(img_rgb: Image.Image) -> List[Tuple[int, int, int]]:
    arr = np.asarray(img_rgb.convert("RGB"), dtype=np.uint8).reshape(-1, 3)
    uniq = {tuple(x) for x in arr}
    # keep stable order (sorted)
    return sorted(uniq)


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def add_palette_bar(
    img_rgb: Image.Image,
    palette: List[Tuple[int, int, int]],
    bar_height: int = 64,
    padding: int = 12,
    show_hex: bool = True,
) -> Image.Image:
    w, h = img_rgb.size
    out = Image.new("RGB", (w, h + bar_height), (0, 0, 0))
    out.paste(img_rgb, (0, 0))

    draw = ImageDraw.Draw(out)
    draw.rectangle([0, h, w, h + bar_height], fill=(10, 10, 10))
    draw.line([0, h, w, h], fill=(30, 30, 30), width=1)

    n = max(1, len(palette))
    usable_w = max(1, w - 2 * padding)
    swatch_w = max(1, usable_w // n)

    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 16)
    except Exception:
        font = ImageFont.load_default()

    for i, rgb in enumerate(palette):
        x0 = padding + i * swatch_w
        x1 = padding + (i + 1) * swatch_w if i < n - 1 else w - padding
        y0 = h + padding // 2
        y1 = h + bar_height - padding // 2

        draw.rectangle([x0, y0, x1, y1], fill=rgb)

        if show_hex and swatch_w >= 70:
            hexs = "#{:02X}{:02X}{:02X}".format(*rgb)
            lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
            txt = (0, 0, 0) if lum > 160 else (255, 255, 255)
            draw.text((x0 + 6, y0 + 8), hexs, fill=txt, font=font)

    return out


def load_palettes_from_csv(csv_path: Path) -> List[Dict[str, Any]]:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader]
    return rows


def write_palettes_to_csv(csv_path: Path, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        raise ValueError("Cannot write empty palette CSV.")
    fieldnames = list(rows[0].keys())
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def extend_palettes_with_replacement(
    rows: List[Dict[str, Any]],
    target_count: int,
) -> List[Dict[str, Any]]:
    if not rows:
        raise ValueError("Palette CSV is empty.")
    if len(rows) >= target_count:
        return rows[:target_count]
    extended = list(rows)
    while len(extended) < target_count:
        extended.append(random.choice(rows))
    return extended


def parse_hex_list(colors_scsv: str) -> List[str]:
    return [p.strip().upper() for p in colors_scsv.split(";") if p.strip()]


def combine_palettes(
    rows: List[Dict[str, Any]],
    count: int,
) -> Tuple[List[Tuple[int, int, int]], List[str]]:
    if count < 1:
        raise ValueError("combine count must be >= 1")
    chosen = [random.choice(rows) for _ in range(count)]
    combined_hex: List[str] = []
    seen = set()
    for row in chosen:
        for hex_color in parse_hex_list(row.get("hex_colors", "")):
            if hex_color in seen:
                continue
            seen.add(hex_color)
            combined_hex.append(hex_color)
    palette = [parse_hex_color(h) for h in combined_hex]
    return palette, combined_hex


def parse_combine_lines(value: Optional[str]) -> List[int]:
    if not value:
        return []
    parts = [p.strip() for p in value.split(",") if p.strip()]
    counts = []
    for p in parts:
        try:
            v = int(p)
        except ValueError as e:
            raise ValueError(f"Invalid combine line count: {p!r}") from e
        if v < 1:
            raise ValueError("Combine line counts must be >= 1")
        counts.append(v)
    return counts


def encode_seq_base64(seq: int, bytes_len: int) -> str:
    if seq < 0:
        raise ValueError("Sequence must be >= 0")
    raw = seq.to_bytes(bytes_len, "big")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def output_name_for_sequence(seq: int, bytes_len: int) -> str:
    return f"cubixles_{encode_seq_base64(seq, bytes_len)}.png"


def batch_dither_from_csv(
    csv_path: Path,
    image_path: Path,
    out_dir: Path,
    target_count: int,
    limit: int | None = None,
    skip_existing: bool = False,
    bar_height: int = 64,
    show_hex: bool = True,
    used_only: bool = False,
    combine_lines: Optional[str] = None,
) -> None:
    rows = load_palettes_from_csv(csv_path)
    rows = extend_palettes_with_replacement(rows, target_count)
    write_palettes_to_csv(csv_path, rows)
    if limit is not None:
        rows = rows[:limit]

    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(image_path).convert("RGB")

    manifest: List[Dict[str, Any]] = []
    combine_counts = parse_combine_lines(combine_lines)
    total_count = len(rows)
    bytes_len = max(1, (total_count.bit_length() + 7) // 8)

    for i, row in enumerate(rows, start=1):
        palette_id = row.get("palette_id") or str(i)
        try:
            if combine_counts:
                combine_count = random.choice(combine_counts)
                palette, combined_hex = combine_palettes(rows, combine_count)
                if not palette:
                    raise ValueError("Empty combined palette")
                hex_colors = ";".join(combined_hex)
            else:
                hex_colors = row.get("hex_colors", "")
                palette = parse_palette_semicolon(hex_colors)
        except ValueError:
            print(f"[WARN] Skipping row {i}: invalid palette '{row.get('hex_colors', '')}'")
            continue

        out_name = output_name_for_sequence(i, bytes_len)
        out_path = out_dir / out_name
        if skip_existing and out_path.exists():
            continue

        mapped = dither_palette_map(img, palette)
        bar_palette = used_colors(mapped) if used_only else palette
        final = add_palette_bar(
            mapped,
            bar_palette,
            bar_height=bar_height,
            show_hex=show_hex,
        )
        final.save(out_path, format="PNG", optimize=True)

        used = used_colors(mapped)
        manifest.append(
            {
                "output": out_name,
                "palette_id": palette_id,
                "palette_url": row.get("palette_url", ""),
                "hex_colors": [rgb_to_hex(c) for c in palette],
                "used_hex_colors": [rgb_to_hex(c) for c in used],
            }
        )

        if i % 25 == 0:
            print(f"[OK] Processed {i} palettes")

    manifest_path = out_dir / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=True, indent=2)
    print(f"Wrote {len(manifest)} images and manifest to: {out_dir}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--csv",
        type=str,
        default=None,
        help="CSV of palettes (ColorHunt format). Defaults to pallette.csv when --colors is not set.",
    )
    ap.add_argument("--in", dest="inp", required=True, help="Input image path.")
    ap.add_argument("--out", dest="out", required=False, help="Output image path (single mode).")
    ap.add_argument(
        "--out-dir",
        type=str,
        default=None,
        help="Output directory for batch mode (when --csv is set).",
    )
    ap.add_argument("--limit", type=int, default=None, help="Max palettes to process in batch mode.")
    ap.add_argument("--skip-existing", action="store_true", help="Skip images that already exist.")
    ap.add_argument(
        "--target-count",
        type=int,
        default=10000,
        help="Target number of palettes to keep in the CSV (default: 10000).",
    )
    ap.add_argument(
        "--colors",
        required=False,
        help='Comma-separated hex colors (1–8). Example: "#ABD9F0,#5CB7DA,#648BD5"',
    )
    ap.add_argument("--mode", choices=["nearest", "dither"], default="nearest")
    ap.add_argument("--bar-height", type=int, default=64)
    ap.add_argument("--no-hex", action="store_true", help="Hide hex labels in the palette bar.")
    ap.add_argument(
        "--used-only",
        action="store_true",
        help="Palette bar shows only colors actually used in output (sorted).",
    )
    ap.add_argument(
        "--combine-lines",
        type=str,
        default=None,
        help="Combine N lines per output (comma-separated). Example: 4,5,6",
    )
    args = ap.parse_args()

    if args.csv is None and not args.colors:
        default_csv = Path("pallette.csv")
        if default_csv.exists():
            args.csv = str(default_csv)

    image_path = Path(args.inp)

    if args.csv:
        csv_path = Path(args.csv)
        out_dir = Path(args.out_dir) if args.out_dir else Path("palette_outputs")
        batch_dither_from_csv(
            csv_path=csv_path,
            image_path=image_path,
            out_dir=out_dir,
            target_count=args.target_count,
            limit=args.limit,
            skip_existing=args.skip_existing,
            bar_height=args.bar_height,
            show_hex=not args.no_hex,
            used_only=args.used_only,
            combine_lines=args.combine_lines,
        )
        return

    if not args.colors or not args.out:
        raise SystemExit("Single-image mode requires --colors and --out.")

    palette = parse_palette(args.colors)

    img = Image.open(image_path).convert("RGB")

    if args.mode == "nearest":
        mapped = nearest_palette_map(img, palette)
    else:
        mapped = dither_palette_map(img, palette)

    bar_palette = used_colors(mapped) if args.used_only else palette

    final = add_palette_bar(
        mapped,
        bar_palette,
        bar_height=args.bar_height,
        show_hex=not args.no_hex,
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, format="PNG", optimize=True)
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()
