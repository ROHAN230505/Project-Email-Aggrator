"""
Gmail API service.

Wraps google-api-python-client calls and exposes clean async-friendly
interfaces for the rest of the app.  All Google SDK calls are blocking
(the SDK doesn't have async support) so we run them in a thread pool
via asyncio.to_thread().
"""
import asyncio
import base64
import email as email_lib
import json
import re
from datetime import datetime, timezone
from typing import Any

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.config import get_settings
from app.utils.crypto import decrypt_tokens, encrypt_tokens

settings = get_settings()


def _build_credentials(tokens: dict) -> Credentials:
    creds = Credentials(
        token=tokens.get("access_token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=settings.gmail_scopes,
    )
    return creds


def _refresh_if_needed(creds: Credentials) -> Credentials:
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def _decode_body(payload: dict) -> tuple[str, str]:
    """Return (html_body, text_body) from a Gmail message payload."""
    html_body = ""
    text_body = ""

    mime_type = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data", "")

    def _b64(data: str) -> str:
        try:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        except Exception:
            return ""

    if mime_type == "text/html" and body_data:
        html_body = _b64(body_data)
    elif mime_type == "text/plain" and body_data:
        text_body = _b64(body_data)
    elif mime_type.startswith("multipart/"):
        for part in payload.get("parts", []):
            h, t = _decode_body(part)
            if h:
                html_body = html_body or h
            if t:
                text_body = text_body or t

    return html_body, text_body


def _parse_message(msg: dict) -> dict:
    """Convert raw Gmail API message dict into a clean dict."""
    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}

    html_body, text_body = _decode_body(msg.get("payload", {}))

    # Build plain-text preview (first 200 chars)
    plain = text_body or re.sub(r"<[^>]+>", " ", html_body)
    plain = re.sub(r"\s+", " ", plain).strip()
    preview = plain[:200]

    # Parse date
    date_str = headers.get("date", "")
    try:
        import email.utils
        parsed_date = email.utils.parsedate_to_datetime(date_str)
        received_at = parsed_date.isoformat()
    except Exception:
        received_at = datetime.now(timezone.utc).isoformat()

    label_ids = msg.get("labelIds", [])
    is_unread = "UNREAD" in label_ids
    is_starred = "STARRED" in label_ids

    # Detect attachments
    attachments = []
    for part in msg.get("payload", {}).get("parts", []):
        filename = part.get("filename", "")
        if filename:
            attachments.append({
                "filename": filename,
                "mime_type": part.get("mimeType", ""),
                "size": part.get("body", {}).get("size", 0),
                "attachment_id": part.get("body", {}).get("attachmentId", ""),
            })

    return {
        "id": msg["id"],
        "thread_id": msg.get("threadId", ""),
        "subject": headers.get("subject", "(no subject)"),
        "from": headers.get("from", ""),
        "to": headers.get("to", ""),
        "cc": headers.get("cc", ""),
        "date": received_at,
        "snippet": msg.get("snippet", ""),
        "preview": preview,
        "body_html": html_body,
        "body_text": text_body,
        "is_unread": is_unread,
        "is_starred": is_starred,
        "label_ids": label_ids,
        "has_attachments": len(attachments) > 0,
        "attachments": attachments,
        "provider": "gmail",
    }


# ── Sync helpers (run in thread pool) ──────────────────────────────────────

def _sync_list_messages(creds: Credentials, query: str, max_results: int, page_token: str | None) -> dict:
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    kwargs: dict[str, Any] = {
        "userId": "me",
        "maxResults": max_results,
        "q": query,
    }
    if page_token:
        kwargs["pageToken"] = page_token
    return service.users().messages().list(**kwargs).execute()


def _sync_get_message(creds: Credentials, message_id: str) -> dict:
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    return service.users().messages().get(
        userId="me", id=message_id, format="full"
    ).execute()


def _sync_get_thread(creds: Credentials, thread_id: str) -> dict:
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    return service.users().threads().get(
        userId="me", id=thread_id, format="full"
    ).execute()


def _sync_send_message(creds: Credentials, raw_message: str) -> dict:
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    return service.users().messages().send(
        userId="me", body={"raw": raw_message}
    ).execute()


# ── Async public API ────────────────────────────────────────────────────────

async def list_messages(
    encrypted_tokens: str,
    query: str = "in:inbox",
    max_results: int = 50,
    page_token: str | None = None,
) -> dict:
    """Return paginated list of message summaries."""
    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)

    result = await asyncio.to_thread(
        _sync_list_messages, creds, query, max_results, page_token
    )

    message_ids = [m["id"] for m in result.get("messages", [])]

    # Fetch each message in parallel (up to 20 concurrent)
    sem = asyncio.Semaphore(20)

    async def fetch_one(mid: str) -> dict:
        async with sem:
            raw = await asyncio.to_thread(_sync_get_message, creds, mid)
            return _parse_message(raw)

    messages = await asyncio.gather(*[fetch_one(mid) for mid in message_ids])

    return {
        "messages": list(messages),
        "next_page_token": result.get("nextPageToken"),
        "result_size_estimate": result.get("resultSizeEstimate", 0),
    }


async def get_message(encrypted_tokens: str, message_id: str) -> dict:
    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)
    raw = await asyncio.to_thread(_sync_get_message, creds, message_id)
    return _parse_message(raw)


async def get_thread(encrypted_tokens: str, thread_id: str) -> list[dict]:
    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)
    raw = await asyncio.to_thread(_sync_get_thread, creds, thread_id)
    return [_parse_message(m) for m in raw.get("messages", [])]


async def send_message(
    encrypted_tokens: str,
    to: str,
    subject: str,
    body: str,
    reply_to_message_id: str | None = None,
) -> dict:
    """Compose and send a plain-text email."""
    import email.mime.text
    import email.mime.multipart

    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)

    msg = email_lib.mime.text.MIMEText(body, "plain")
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to_message_id:
        msg["In-Reply-To"] = reply_to_message_id
        msg["References"] = reply_to_message_id

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    result = await asyncio.to_thread(_sync_send_message, creds, raw)
    return result


async def refresh_and_return_tokens(encrypted_tokens: str) -> str:
    """Refresh OAuth tokens if expired and return newly encrypted tokens."""
    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)
    new_tokens = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
    }
    return encrypt_tokens(new_tokens)


# ── Stats ───────────────────────────────────────────────────────────────────

# Labels whose counts we always surface
_SYSTEM_LABELS = {"INBOX", "UNREAD", "STARRED", "SENT", "DRAFT", "SPAM", "TRASH"}


def _sync_get_stats(creds: Credentials) -> dict:
    """Return per-label message/thread counts from the Gmail labels API."""
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    labels_resp = service.users().labels().list(userId="me").execute()
    all_labels = labels_resp.get("labels", [])

    # Fetch detail only for system labels to keep it fast
    result: dict[str, Any] = {}
    for lbl in all_labels:
        if lbl["id"] not in _SYSTEM_LABELS:
            continue
        detail = service.users().labels().get(userId="me", id=lbl["id"]).execute()
        result[lbl["id"]] = {
            "id": lbl["id"],
            "name": detail.get("name", lbl["id"]),
            "messages_total": detail.get("messagesTotal", 0),
            "messages_unread": detail.get("messagesUnread", 0),
            "threads_total": detail.get("threadsTotal", 0),
            "threads_unread": detail.get("threadsUnread", 0),
        }
    return result


async def get_stats(encrypted_tokens: str) -> dict:
    """Return real-time Gmail stats (label counts)."""
    tokens = decrypt_tokens(encrypted_tokens)
    creds = _build_credentials(tokens)
    creds = await asyncio.to_thread(_refresh_if_needed, creds)
    return await asyncio.to_thread(_sync_get_stats, creds)
