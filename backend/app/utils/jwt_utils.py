import json
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()

ALGORITHM = "HS256"


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        seconds=settings.access_token_expire_seconds
    )
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
