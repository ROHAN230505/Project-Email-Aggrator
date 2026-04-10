"""
Google OAuth2 authentication router.

Flow:
  1.  GET  /auth/google          → redirect to Google consent screen
  2.  GET  /auth/google/callback → exchange code for tokens, upsert user,
                                   redirect to frontend with JWT
  3.  GET  /auth/me              → return current user profile
  4.  POST /auth/logout          → (stateless JWT — client just deletes token)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import asyncio

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.utils.jwt_utils import create_access_token
from app.utils.crypto import encrypt_tokens
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _build_flow() -> Flow:
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=settings.gmail_scopes,
        redirect_uri=settings.google_redirect_uri,
    )
    return flow


# ── Step 1: start OAuth ─────────────────────────────────────────────────────
@router.get("/google")
async def google_login():
    """Redirect browser to Google consent screen."""
    flow = _build_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",  # always ask so we get a refresh_token
    )
    return RedirectResponse(auth_url)


# ── Step 2: OAuth callback ──────────────────────────────────────────────────
@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error or not code:
        # Redirect to frontend with error
        return RedirectResponse(
            f"{settings.frontend_url}/login?error={error or 'no_code'}"
        )

    # Exchange code for tokens
    flow = _build_flow()
    flow.fetch_token(code=code)
    creds: Credentials = flow.credentials

    # Fetch user profile
    def _get_userinfo(creds: Credentials) -> dict:
        svc = build("oauth2", "v2", credentials=creds, cache_discovery=False)
        return svc.userinfo().get().execute()

    userinfo = await asyncio.to_thread(_get_userinfo, creds)

    google_id = userinfo["id"]
    email = userinfo["email"]
    full_name = userinfo.get("name", "")
    picture_url = userinfo.get("picture", "")

    # Store tokens encrypted
    tokens = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
    }
    enc_tokens = encrypt_tokens(tokens)

    # Upsert user
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            google_id=google_id,
            email=email,
            full_name=full_name,
            picture_url=picture_url,
            oauth_tokens_enc=enc_tokens,
        )
        db.add(user)
    else:
        user.email = email
        user.full_name = full_name
        user.picture_url = picture_url
        user.oauth_tokens_enc = enc_tokens

    await db.commit()
    await db.refresh(user)

    jwt_token = create_access_token(user.id, user.email)

    # Redirect to frontend with token in query param
    # (frontend stores it in memory / localStorage)
    return RedirectResponse(
        f"{settings.frontend_url}/auth/callback?token={jwt_token}"
    )


# ── Current user ────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "picture_url": current_user.picture_url,
    }


@router.post("/logout")
async def logout():
    """JWT is stateless; client just deletes the token."""
    return {"detail": "Logged out"}
