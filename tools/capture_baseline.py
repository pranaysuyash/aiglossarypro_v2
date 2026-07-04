#!/usr/bin/env python3
"""
Capture full-page screenshots of aiglossary_v2 at standard viewports
so the design can be audited visually before/after redesign passes.

Usage:
  python3 tools/capture_baseline.py --out tools/screenshots-baseline

Notes:
  - Read-only inspection. No git, no writes outside the output dir.
  - Assumes the Vite dev server is running on http://localhost:5173
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright


ROUTES = [
    ("home", "/"),
    ("explore", "/explore"),
    ("term-transformer", "/term/transformer-architecture"),
    ("term-attention", "/term/attention-mechanism"),
    ("paths", "/paths"),
    ("saved", "/saved"),
    ("notes", "/notes"),
    ("pricing", "/pricing"),
    ("field-lab", "/field-lab"),
    ("families", "/families"),
    ("account", "/account"),
]

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 820, "height": 1180},
    "mobile": {"width": 390, "height": 844},
}


async def capture(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for vp_name, vp in VIEWPORTS.items():
            context = await browser.new_context(
                viewport=vp,
                device_scale_factor=1,
                reduced_motion="reduce",
            )
            page = await context.new_page()
            for slug, path in ROUTES:
                url = f"http://localhost:5173{path}"
                try:
                    await page.goto(url, wait_until="networkidle", timeout=20000)
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! {vp_name} {path}: {exc}", file=sys.stderr)
                    continue
                await page.wait_for_timeout(400)
                file = out / f"{vp_name}-{slug}.png"
                await page.screenshot(path=str(file), full_page=True)
                print(f"  ok  {file.name}")
            await context.close()
        await browser.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="tools/screenshots-baseline")
    args = parser.parse_args()
    out = Path(args.out)
    asyncio.run(capture(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
