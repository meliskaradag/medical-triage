"""File-backed user store with token-based authentication."""
from __future__ import annotations

import hashlib
import json
import secrets
import uuid
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


def _read_users(path: Path) -> List[Dict[str, Any]]:
    _ensure_file(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return []


def _write_users(path: Path, users: List[Dict[str, Any]]) -> None:
    _ensure_file(path)
    path.write_text(json.dumps(users, ensure_ascii=False, indent=2), encoding="utf-8")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    salt_to_use = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_to_use.encode("utf-8"), 100_000)
    return salt_to_use, digest.hex()


def create_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Create a new user if the email is unused."""
    normalized_email = _normalize_email(email)
    settings = get_settings()
    with _LOCK:
        users = _read_users(settings.user_store_path)
        if any(user.get("email") == normalized_email for user in users):
            raise ValueError("Email already registered")
        salt, password_hash = _hash_password(password)
        user = {
            "id": str(uuid.uuid4()),
            "name": name.strip() or normalized_email,
            "email": normalized_email,
            "salt": salt,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_token": None,
        }
        users.append(user)
        _write_users(settings.user_store_path, users)
    return user


def authenticate(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validate credentials and return the user dict if valid."""
    normalized_email = _normalize_email(email)
    settings = get_settings()
    with _LOCK:
        users = _read_users(settings.user_store_path)
        for user in users:
            if user.get("email") != normalized_email:
                continue
            salt = user.get("salt")
            if not salt:
                continue
            _, password_hash = _hash_password(password, salt)
            if password_hash == user.get("password_hash"):
                return user
    return None


def issue_token(user_id: str) -> str:
    """Create and persist a new auth token for the user."""
    settings = get_settings()
    with _LOCK:
        users = _read_users(settings.user_store_path)
        for user in users:
            if user.get("id") == user_id:
                token = secrets.token_hex(24)
                user["auth_token"] = token
                _write_users(settings.user_store_path, users)
                return token
    raise ValueError("User not found")


def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Return user dict for the provided token."""
    settings = get_settings()
    with _LOCK:
        users = _read_users(settings.user_store_path)
        for user in users:
            if user.get("auth_token") == token:
                return user
    return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    settings = get_settings()
    with _LOCK:
        users = _read_users(settings.user_store_path)
        for user in users:
            if user.get("id") == user_id:
                return user
    return None


def public_user_dict(user: Dict[str, Any]) -> Dict[str, Any]:
    """Return a safe subset of user fields for API responses."""
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at"),
    }
