"""Daily Telegram → Supabase → GitHub enrichment entrypoint.

Delta loading uses `posted_at` from the Telegram channel as the watermark
(stored in `ingestion_state.last_posted_at`). Message IDs are still used for
idempotent upserts so re-runs never create duplicates.

Usage:
  python telegram_scraper.py
  python telegram_scraper.py --dry-run
  python telegram_scraper.py --skip-enrich
  python telegram_scraper.py --enrich-limit 80
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")


async def run_pipeline(*, dry_run: bool, skip_enrich: bool, enrich_limit: int) -> None:
    from scripts.telegram_ingest import ingest

    channel = os.getenv("TELEGRAM_CHANNEL") or os.getenv("SOURCE_CHANNEL", "githubtrending")
    batch_size = int(os.getenv("INGEST_BATCH_SIZE", "100"))

    print("=== 1/3 Telegram delta ingest (posted_at watermark) ===")
    await ingest(dry_run=dry_run, batch_size=batch_size, channel=channel)

    if dry_run or skip_enrich:
        print("Skipping enrichment.")
        return

    print("=== 2/3 GitHub public-page enrichment ===")
    from scripts.github_enricher import run_enrichment

    await run_enrichment(limit=enrich_limit, dry_run=False)

    print("=== 3/3 Category classification ===")
    from scripts.classify_categories import run as classify_run

    classify_run(limit=max(enrich_limit * 2, 200), dry_run=False)
    print("Pipeline complete.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Delta scrape Telegram, upsert Supabase, enrich GitHub metadata"
    )
    parser.add_argument("--dry-run", action="store_true", help="Scan only; no DB writes")
    parser.add_argument("--skip-enrich", action="store_true", help="Ingest only")
    parser.add_argument(
        "--enrich-limit",
        type=int,
        default=int(os.getenv("ENRICH_BATCH_SIZE", "80")),
        help="Max repos to enrich this run",
    )
    args = parser.parse_args()
    asyncio.run(
        run_pipeline(
            dry_run=args.dry_run,
            skip_enrich=args.skip_enrich,
            enrich_limit=args.enrich_limit,
        )
    )


if __name__ == "__main__":
    main()
