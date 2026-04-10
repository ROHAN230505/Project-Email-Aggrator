"""Simple symmetric encryption for OAuth tokens stored in DB."""
import base64
import json
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import get_settings


def _make_fernet() -> Fernet:
    settings = get_settings()
    key_material = settings.secret_key.encode()
    # Derive a 32-byte key from the secret
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"email_aggregator_salt_v1",
        iterations=100_000,
    )
    derived = base64.urlsafe_b64encode(kdf.derive(key_material))
    return Fernet(derived)


def encrypt_tokens(tokens: dict) -> str:
    f = _make_fernet()
    return f.encrypt(json.dumps(tokens).encode()).decode()


def decrypt_tokens(encrypted: str) -> dict:
    f = _make_fernet()
    return json.loads(f.decrypt(encrypted.encode()).decode())
