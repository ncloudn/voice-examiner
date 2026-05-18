from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./voice_examiner.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    gigachat_auth_key: str = ""
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_oauth_url: str = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    gigachat_api_url: str = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    gigachat_model: str = "GigaChat"
    verify_ssl_certs: bool = True
    salutespeech_auth_key: str = ""
    salutespeech_oauth_url: str = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    salutespeech_tts_url: str = "https://smartspeech.sber.ru/rest/v1/text:synthesize"
    salutespeech_scope: str = "SALUTE_SPEECH_PERS"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
