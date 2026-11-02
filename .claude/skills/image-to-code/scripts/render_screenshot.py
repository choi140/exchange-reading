#!/usr/bin/env python3
"""
Headless Screenshot Capture Utility for Image-to-Code Verification.
Uses Playwright to render local HTML files or HTTP URLs at precise viewport resolutions.
"""

import argparse
import os
import sys
from pathlib import Path


def parse_viewport(viewport_str: str) -> tuple[int, int]:
    """Parse '1440x900' into width, height."""
    try:
        parts = viewport_str.lower().split("x")
        return int(parts[0]), int(parts[1])
    except Exception:
        raise ValueError(f"Invalid viewport format: '{viewport_str}'. Expected 'WIDTHxHEIGHT' (e.g. '1440x900').")


def capture_screenshot(
    source: str,
    output_path: str,
    viewport: tuple[int, int] = (1440, 900),
    full_page: bool = False,
    device_scale_factor: float = 1.0,
    wait_time_ms: int = 1000,
    wait_until: str = "networkidle",
) -> str:
    """Capture a screenshot of an HTML file or URL using Playwright Chromium."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Error: 'playwright' is required. Install via: pip install playwright && playwright install chromium", file=sys.stderr)
        sys.exit(1)

    out_file = Path(output_path).resolve()
    out_file.parent.mkdir(parents=True, exist_ok=True)

    # Normalize source URL
    if source.startswith("http://") or source.startswith("https://") or source.startswith("file://"):
        target_url = source
    elif "?" in source:
        file_part, query_part = source.split("?", 1)
        abs_source = Path(file_part).resolve()
        if not abs_source.exists():
            raise FileNotFoundError(f"Source file not found: {abs_source}")
        target_url = f"file://{abs_source}?{query_part}"
    else:
        abs_source = Path(source).resolve()
        if not abs_source.exists():
            raise FileNotFoundError(f"Source file not found: {abs_source}")
        target_url = f"file://{abs_source}"

    width, height = viewport

    # Auto-detect available chromium executable
    exec_path = None
    for candidate in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
        if Path(candidate).exists() and os.access(candidate, os.X_OK):
            exec_path = candidate
            break

    with sync_playwright() as p:
        launch_kwargs = {"headless": True}
        if exec_path:
            launch_kwargs["executable_path"] = exec_path
        browser = p.chromium.launch(**launch_kwargs)
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=device_scale_factor,
        )
        page = context.new_page()

        # Load target
        page.goto(target_url, wait_until=wait_until, timeout=30000)

        # Allow animations / webfonts / transitions to settle
        if wait_time_ms > 0:
            page.wait_for_timeout(wait_time_ms)

        page.screenshot(path=str(out_file), full_page=full_page)
        browser.close()

    print(f"Captured screenshot: {out_file} ({width}x{height}, full_page={full_page})")
    return str(out_file)


def main():
    parser = argparse.ArgumentParser(description="Capture headless screenshots of HTML files or URLs for visual testing.")
    parser.add_argument("--input", "-i", type=str, required=True, help="Path to local HTML file or web URL")
    parser.add_argument("--output", "-o", type=str, required=True, help="Path to output PNG screenshot")
    parser.add_argument("--viewport", "-v", type=str, default="1440x900", help="Viewport dimensions (e.g. 1440x900, 375x812)")
    parser.add_argument("--full-page", action="store_true", help="Capture full scrollable page instead of viewport")
    parser.add_argument("--scale", type=float, default=1.0, help="Device scale factor (1.0 or 2.0 for Retina)")
    parser.add_argument("--wait", type=int, default=800, help="Wait time in ms after load before capture")
    parser.add_argument("--wait-until", type=str, default="networkidle", choices=["load", "domcontentloaded", "networkidle", "commit"])

    args = parser.parse_args()
    viewport = parse_viewport(args.viewport)

    capture_screenshot(
        source=args.input,
        output_path=args.output,
        viewport=viewport,
        full_page=args.full_page,
        device_scale_factor=args.scale,
        wait_time_ms=args.wait,
        wait_until=args.wait_until,
    )


if __name__ == "__main__":
    main()
