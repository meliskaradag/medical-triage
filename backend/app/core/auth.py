"""Minimal token-based authentication utilities."""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.data import user_store
from backend.app.schemas.auth import UserProfile

auth_scheme = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)) -> dict:
    """Resolve the current user from the Authorization header."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token required")
    token = credentials.credentials
    user = user_store.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user


def to_user_profile(user: dict) -> UserProfile:
    """Map an internal user dict to the public schema."""
    return UserProfile(**user_store.public_user_dict(user))
