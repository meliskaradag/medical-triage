"""Simple file-backed storage for symptom timeline entries."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

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


def _filter_for_user(entries: List[Dict[str, Any]], user_id: str) -> List[Dict[str, Any]]:
    # Legacy entries without a user_id are returned to signed-in users for backward compatibility.
    return [entry for entry in entries if entry.get("user_id") == user_id or entry.get("user_id") is None]


def list_entries(user_id: str) -> List[Dict[str, Any]]:
    """Return stored timeline entries for a user sorted by occurrence time descending."""
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
    filtered = _filter_for_user(entries, user_id)
    try:
        return sorted(filtered, key=lambda item: item.get("occurred_at", ""), reverse=True)
    except Exception:
        return filtered


def add_entry(entry: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
        entry_with_user = {**entry, "user_id": user_id}
        entries.append(entry_with_user)
        _write_entries(settings.timeline_log_path, entries)
    return entry_with_user


def delete_entry(entry_id: str, user_id: str) -> bool:
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
        filtered = [
            entry for entry in entries if not (entry.get("id") == entry_id and entry.get("user_id") in {user_id, None})
        ]
        deleted = len(filtered) != len(entries)
        if deleted:
            _write_entries(settings.timeline_log_path, filtered)
    return deleted


def clear_entries(user_id: str) -> None:
    settings = get_settings()
    with _LOCK:
        entries = _read_entries(settings.timeline_log_path)
        remaining = [entry for entry in entries if entry.get("user_id") not in {user_id, None}]
        _write_entries(settings.timeline_log_path, remaining)


def last_entry_timestamp(user_id: str) -> Optional[datetime]:
    entries = list_entries(user_id)
    if not entries:
        return None
    latest = entries[0].get("occurred_at")
    if not latest:
        return None
    try:
        return datetime.fromisoformat(latest)
    except ValueError:
        return None


def entry_count(user_id: str) -> int:
    return len(list_entries(user_id))


def has_data(user_id: str) -> bool:
    settings = get_settings()
    with _LOCK:
        _ensure_file(settings.timeline_log_path)
        entries = _read_entries(settings.timeline_log_path)
    return len(_filter_for_user(entries, user_id)) > 0


def entries_by_id(user_id: str) -> Dict[str, Dict[str, Any]]:
    return {entry.get("id", ""): entry for entry in list_entries(user_id)}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
