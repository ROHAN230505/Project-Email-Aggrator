from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    frontend_url: str = "http://localhost:5173"

    secret_key: str = "changeme"
    database_url: str = "sqlite+aiosqlite:///./email_aggregator.db"

    access_token_expire_seconds: int = 3600
    refresh_token_expire_seconds: int = 2592000

    # Gmail API scopes
    gmail_scopes: list[str] = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
