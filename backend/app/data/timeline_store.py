"""Simple file-backed storage for symptom timeline entries."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List

from backend.app.core.config import get_settings

_LOCK = Lock()


def _ensure_file(path: Path) -> None:
    if not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text("[]", encoding="utf-8")


def _read_entries(path: Path) -> List[Dict[str, Any]]:
    _ensure_file(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return []


def _write_entries(path: Path, entries: List[Dict[str, Any]]) -> None:
    _ensure_file(path)
    path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")


def list_entries() -> List[Dict[str, Any]]:
    """Return all stored timeline entries sorted by occurrence time descending."""
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
    try:
        return sorted(entries, key=lambda item: item.get("occurred_at", ""), reverse=True)
    except Exception:
        return entries


def add_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
        entries.append(entry)
        _write_entries(settings.timeline_log_path, entries)
    return entry


def delete_entry(entry_id: str) -> bool:
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
        filtered = [entry for entry in entries if entry.get("id") != entry_id]
        deleted = len(filtered) != len(entries)
        if deleted:
            _write_entries(settings.timeline_log_path, filtered)
    return deleted


def clear_entries() -> None:
    settings = get_settings()
    with _LOCK:
        _write_entries(settings.timeline_log_path, [])


def last_entry_timestamp() -> datetime | None:
    entries = list_entries()
    if not entries:
        return None
    latest = entries[0].get("occurred_at")
    if not latest:
        return None
    try:
        return datetime.fromisoformat(latest)
    except ValueError:
        return None


def entry_count() -> int:
    return len(list_entries())


def has_data() -> bool:
    settings = get_settings()
    with _LOCK:
        _ensure_file(settings.timeline_log_path)
        return settings.timeline_log_path.stat().st_size > 2  # len([]) == 2


def entries_by_id() -> Dict[str, Dict[str, Any]]:
    return {entry.get("id", ""): entry for entry in list_entries()}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
