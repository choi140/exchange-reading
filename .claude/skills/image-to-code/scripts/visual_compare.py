#!/usr/bin/env python3
"""
Visual Difference & Similarity Analysis Engine for Image-to-Code Verification.
Computes perceptual pixel delta, structural similarity, and generates high-contrast
visual diff overlays for LLM multimodal discrepancy inspection.
"""

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageOps
except ImportError:
    print("Error: 'Pillow' is required. Install via: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def normalize_images(
    ref_img: Image.Image, cand_img: Image.Image, mode: str = "pad"
) -> Tuple[Image.Image, Image.Image]:
    """
    Ensure both images have identical dimensions for pixel-by-pixel alignment.
    Options: 'pad' (contain inside max bounds with transparency/white) or 'resize'.
    """
    if ref_img.size == cand_img.size:
        return ref_img.convert("RGBA"), cand_img.convert("RGBA")

    max_w = max(ref_img.width, cand_img.width)
    max_h = max(ref_img.height, cand_img.height)

    if mode == "resize":
        ref_norm = ref_img.convert("RGBA").resize((cand_img.width, cand_img.height), Image.Resampling.LANCZOS)
        return ref_norm, cand_img.convert("RGBA")

    # Pad mode: place both on identical canvas size
    def pad(img: Image.Image) -> Image.Image:
        base = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        base.paste(img.convert("RGBA"), (0, 0))
        return base

    return pad(ref_img), pad(cand_img)


def calculate_perceptual_diff(
    ref_img: Image.Image,
    cand_img: Image.Image,
    threshold: int = 15,
) -> Tuple[float, Image.Image, List[Dict[str, Any]]]:
    """
    Calculates pixel difference ratio and generates a high-contrast magenta diff overlay.
    Returns:
        similarity_percentage (0.0 to 100.0)
        diff_image (Pillow Image with highlights)
        bounding_boxes (List of bounding boxes of differing regions)
    """
    ref, cand = normalize_images(ref_img, cand_img)
    width, height = ref.size
    total_pixels = width * height

    # Compute difference
    diff = ImageChops.difference(ref.convert("RGB"), cand.convert("RGB"))
    diff_gray = diff.convert("L")

    # Threshold mask
    mask = diff_gray.point(lambda p: 255 if p > threshold else 0, mode="1")

    # Count differing pixels
    diff_pixels = 0
    hist = mask.histogram()
    # In Pillow, mask values are 0 and 255 across a 256-element histogram
    if len(hist) >= 256:
        diff_pixels = hist[255]
    elif len(hist) >= 2:
        diff_pixels = hist[-1]

    diff_ratio = diff_pixels / total_pixels if total_pixels > 0 else 0.0
    similarity_score = max(0.0, min(100.0, (1.0 - diff_ratio) * 100.0))

    # Generate high-contrast visual comparison overlay:
    # Dim the reference into subtle grayscale, then paint differing pixels in vivid magenta/rose
    dimmed_ref = ImageEnhance.Brightness(ref.convert("L").convert("RGBA")).enhance(0.4)
    tinted_cand = ImageEnhance.Color(cand).enhance(0.8)

    # Base side-by-side or overlay
    overlay = Image.blend(dimmed_ref, tinted_cand, alpha=0.35)

    # Create vivid magenta highlight for discrepancies
    highlight = Image.new("RGBA", (width, height), (255, 0, 128, 220))
    overlay.paste(highlight, (0, 0), mask)

    # Detect discrepancy bounding clusters
    # Downsample mask to 32x32 blocks to find distinct regions of error
    block_size = max(16, min(width, height) // 30)
    grid_w = math.ceil(width / block_size)
    grid_h = math.ceil(height / block_size)

    clusters: List[Dict[str, Any]] = []
    mask_pixels = mask.load()

    for gy in range(grid_h):
        for gx in range(grid_w):
            x0 = gx * block_size
            y0 = gy * block_size
            x1 = min(width, x0 + block_size)
            y1 = min(height, y0 + block_size)

            block_diffs = 0
            for y in range(y0, y1, 2):
                for x in range(x0, x1, 2):
                    if mask_pixels[x, y] > 0:
                        block_diffs += 1

            block_total = ((x1 - x0) // 2) * ((y1 - y0) // 2)
            if block_total > 0 and (block_diffs / block_total) > 0.15:
                clusters.append({
                    "bbox": [x0, y0, x1, y1],
                    "density": round(block_diffs / block_total, 2),
                    "region": f"x:{x0}-{x1}, y:{y0}-{y1}",
                })

    # Merge nearby clusters (simple 1-pass merge)
    merged_boxes: List[Tuple[int, int, int, int]] = []
    for c in clusters:
        x0, y0, x1, y1 = c["bbox"]
        merged = False
        for i, (bx0, by0, bx1, by1) in enumerate(merged_boxes):
            # Check overlap or proximity within 1.5 * block_size
            if not (x1 + block_size < bx0 or x0 > bx1 + block_size or y1 + block_size < by0 or y0 > by1 + block_size):
                merged_boxes[i] = (min(x0, bx0), min(y0, by0), max(x1, bx1), max(y1, by1))
                merged = True
                break
        if not merged:
            merged_boxes.append((x0, y0, x1, y1))

    # Draw bounding boxes on the overlay
    draw = ImageDraw.Draw(overlay)
    formatted_clusters = []
    for i, (bx0, by0, bx1, by1) in enumerate(merged_boxes[:10]):  # top 10 regions
        draw.rectangle([bx0, by0, bx1, by1], outline="#F43F5E", width=3)
        draw.text((bx0 + 4, by0 + 4), f"#{i+1}", fill="#FFFFFF")
        formatted_clusters.append({
            "id": i + 1,
            "bbox": [bx0, by0, bx1, by1],
            "area_pixels": (bx1 - bx0) * (by1 - by0),
            "location_pct": {
                "top": round((by0 / height) * 100, 1),
                "left": round((bx0 / width) * 100, 1),
                "width": round(((bx1 - bx0) / width) * 100, 1),
                "height": round(((by1 - by0) / height) * 100, 1),
            }
        })

    return round(similarity_score, 2), overlay, formatted_clusters


def create_side_by_side(
    ref_img: Image.Image, cand_img: Image.Image, diff_img: Image.Image
) -> Image.Image:
    """Create a tri-panel comparison: [Reference] | [Candidate] | [Visual Diff Overlay]."""
    w, h = ref_img.size
    triptych = Image.new("RGB", (w * 3, h + 40), (15, 23, 42))

    triptych.paste(ref_img.convert("RGB"), (0, 40))
    triptych.paste(cand_img.convert("RGB"), (w, 40))
    triptych.paste(diff_img.convert("RGB"), (w * 2, 40))

    draw = ImageDraw.Draw(triptych)
    # Panel labels
    draw.text((20, 12), "REFERENCE DESIGN", fill="#38BDF8")
    draw.text((w + 20, 12), "CANDIDATE IMPLEMENTATION", fill="#34D399")
    draw.text((w * 2 + 20, 12), "VISUAL DISCREPANCY OVERLAY (MAGENTA = DRIFT)", fill="#F43F5E")

    return triptych


def compare_images(
    ref_path: str,
    cand_path: str,
    output_diff_path: Optional[str] = None,
    output_triptych_path: Optional[str] = None,
    threshold: int = 15,
) -> Dict[str, Any]:
    """Execute complete visual comparison pipeline between two image paths."""
    r_path = Path(ref_path).resolve()
    c_path = Path(cand_path).resolve()

    if not r_path.exists():
        raise FileNotFoundError(f"Reference image not found: {r_path}")
    if not c_path.exists():
        raise FileNotFoundError(f"Candidate image not found: {c_path}")

    ref_img = Image.open(r_path)
    cand_img = Image.open(c_path)

    ref_norm, cand_norm = normalize_images(ref_img, cand_img)
    score, diff_overlay, clusters = calculate_perceptual_diff(ref_norm, cand_norm, threshold=threshold)

    diff_path_str = None
    if output_diff_path:
        out_p = Path(output_diff_path).resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)
        diff_overlay.save(out_p, "PNG")
        diff_path_str = str(out_p)

    triptych_path_str = None
    if output_triptych_path:
        out_t = Path(output_triptych_path).resolve()
        out_t.parent.mkdir(parents=True, exist_ok=True)
        triptych = create_side_by_side(ref_norm, cand_norm, diff_overlay)
        triptych.save(out_t, "PNG")
        triptych_path_str = str(out_t)

    result = {
        "status": "PASS" if score >= 95.0 else "NEEDS_REVISION",
        "visual_similarity_score": score,
        "reference": {
            "path": str(r_path),
            "original_dimensions": f"{ref_img.width}x{ref_img.height}",
        },
        "candidate": {
            "path": str(c_path),
            "original_dimensions": f"{cand_img.width}x{cand_img.height}",
        },
        "normalized_dimensions": f"{ref_norm.width}x{ref_norm.height}",
        "discrepancy_clusters_count": len(clusters),
        "discrepancy_regions": clusters,
        "diff_image_path": diff_path_str,
        "triptych_image_path": triptych_path_str,
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="Analyze visual similarity & generate discrepancy diffs between reference and code renders.")
    parser.add_argument("--reference", "-r", type=str, required=True, help="Path to reference design image")
    parser.add_argument("--candidate", "-c", type=str, required=True, help="Path to candidate implementation screenshot")
    parser.add_argument("--output-diff", "-o", type=str, default=None, help="Output path for visual diff PNG")
    parser.add_argument("--output-triptych", "-t", type=str, default=None, help="Output path for 3-panel comparison PNG")
    parser.add_argument("--threshold", type=int, default=15, help="Pixel sensitivity delta threshold (0-255)")
    parser.add_argument("--json", action="store_true", help="Print structured JSON result only")

    args = parser.parse_args()

    try:
        report = compare_images(
            ref_path=args.reference,
            cand_path=args.candidate,
            output_diff_path=args.output_diff,
            output_triptych_path=args.output_triptych,
            threshold=args.threshold,
        )

        if args.json:
            print(json.dumps(report, indent=2))
        else:
            status_symbol = "[PASS]" if report["status"] == "PASS" else "[REVISION NEEDED]"
            print(f"\n=======================================================")
            print(f"  IMAGE-TO-CODE VISUAL VERIFICATION: {status_symbol}")
            print(f"=======================================================")
            print(f"Visual Similarity Score: {report['visual_similarity_score']}% (Target: >= 95.0%)")
            print(f"Reference:  {report['reference']['original_dimensions']} -> {report['reference']['path']}")
            print(f"Candidate:  {report['candidate']['original_dimensions']} -> {report['candidate']['path']}")
            print(f"Discrepancy Regions Detected: {report['discrepancy_clusters_count']}")
            if report['diff_image_path']:
                print(f"Diff Overlay Saved: {report['diff_image_path']}")
            if report['triptych_image_path']:
                print(f"Triptych Saved:     {report['triptych_image_path']}")
            print(f"-------------------------------------------------------")
            for c in report["discrepancy_regions"]:
                loc = c["location_pct"]
                print(f"  * Region #{c['id']}: top={loc['top']}%, left={loc['left']}%, width={loc['width']}%, height={loc['height']}%")
            print(f"=======================================================\n")

            sys.exit(0 if report["status"] == "PASS" else 2)

    except Exception as e:
        print(f"Error during visual comparison: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
