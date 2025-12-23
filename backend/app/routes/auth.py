"""Authentication endpoints for signup and login."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core import auth as auth_core
from backend.app.data import user_store
from backend.app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(request: SignupRequest) -> AuthResponse:
    if not request.email.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    if not request.password.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required")
    try:
        user = user_store.create_user(request.name, request.email, request.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    token = user_store.issue_token(user["id"])
    return AuthResponse(token=token, user=auth_core.to_user_profile(user))


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest) -> AuthResponse:
    if not request.email.strip() or not request.password.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required")
    user = user_store.authenticate(request.email, request.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = user_store.issue_token(user["id"])
    return AuthResponse(token=token, user=auth_core.to_user_profile(user))


@router.get("/me", response_model=UserProfile)
def read_current_user(current_user=Depends(auth_core.get_current_user)) -> UserProfile:
    return auth_core.to_user_profile(current_user)
