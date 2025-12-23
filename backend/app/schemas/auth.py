"""Authentication request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    password: str = Field(..., min_length=1, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1, max_length=128)


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserProfile
