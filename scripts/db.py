"""Shared database helpers for GitHub Radar scripts."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env.local and fill values."
        )
    return url


@contextmanager
def get_connection(*, autocommit: bool = False) -> Iterator[psycopg.Connection]:
    conn = psycopg.connect(get_database_url(), row_factory=dict_row, autocommit=autocommit)
    try:
        yield conn
    finally:
        conn.close()


def run_sql_file(path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with get_connection(autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
