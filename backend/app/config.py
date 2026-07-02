from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Angel One Smart Screener"
    cors_origins: list[str] = ["http://localhost:5173"]
    request_timeout_seconds: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="SMART_SCREENER_",
        extra="ignore",
    )


settings = Settings()
