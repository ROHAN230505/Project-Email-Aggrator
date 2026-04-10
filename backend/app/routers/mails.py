"""
Gmail mail routes.
All endpoints require a valid JWT (current user injected via get_current_user).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.deps import get_current_user
from app.services import gmail_service

router = APIRouter(prefix="/mails", tags=["mails"])


def _require_tokens(user: User) -> str:
    if not user.oauth_tokens_enc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Gmail account connected. Please reconnect via /auth/google.",
        )
    return user.oauth_tokens_enc


# ── List / search inbox ──────────────────────────────────────────────────────
@router.get("")
async def list_mails(
    q: str = Query("in:inbox", description="Gmail search query"),
    max_results: int = Query(50, ge=1, le=100),
    page_token: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    enc = _require_tokens(current_user)
    try:
        return await gmail_service.list_messages(enc, query=q, max_results=max_results, page_token=page_token)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {exc}")


# ── Single message ───────────────────────────────────────────────────────────
@router.get("/{message_id}")
async def get_mail(
    message_id: str,
    current_user: User = Depends(get_current_user),
):
    enc = _require_tokens(current_user)
    try:
        return await gmail_service.get_message(enc, message_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {exc}")


# ── Thread ───────────────────────────────────────────────────────────────────
@router.get("/thread/{thread_id}")
async def get_thread(
    thread_id: str,
    current_user: User = Depends(get_current_user),
):
    enc = _require_tokens(current_user)
    try:
        return await gmail_service.get_thread(enc, thread_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {exc}")


# ── Send ─────────────────────────────────────────────────────────────────────
from pydantic import BaseModel, EmailStr


class SendRequest(BaseModel):
    to: str
    subject: str
    body: str
    reply_to_message_id: str | None = None


@router.post("/send")
async def send_mail(
    payload: SendRequest,
    current_user: User = Depends(get_current_user),
):
    enc = _require_tokens(current_user)
    try:
        result = await gmail_service.send_message(
            enc,
            to=payload.to,
            subject=payload.subject,
            body=payload.body,
            reply_to_message_id=payload.reply_to_message_id,
        )
        return {"status": "sent", "message_id": result.get("id")}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gmail send error: {exc}")
