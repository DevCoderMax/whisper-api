from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AVAILABLE_MODELS = ["tiny", "small", "medium", "large-v2", "large-v3"]

class Settings(BaseSettings):
    # Modelo
    WHISPER_MODEL: str = "large-v3"

    # Dispositivo
    WHISPER_DEVICE: str = "cuda"
    WHISPER_COMPUTE_TYPE: str = "float16"

    # Threads de CPU (só importa se WHISPER_DEVICE=cpu)
    WHISPER_CPU_THREADS: int = 4

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 600
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"

    # Transcrição
    DEFAULT_LANGUAGE: str = "pt"
    VAD_FILTER: bool = True
    WORD_TIMESTAMPS: bool = True

    # Auto-descarregamento da VRAM após inatividade (segundos, 0 = desativado)
    MODEL_UNLOAD_TIMEOUT: int = 300  # 5 minutos por padrão

    # pydantic-settings v2: usa `model_config = SettingsConfigDict(...)`
    # em vez do `class Config` interno (deprecado).
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("WHISPER_MODEL")
    @classmethod
    def _validate_model(cls, v: str) -> str:
        if v not in AVAILABLE_MODELS:
            raise ValueError(
                f"Modelo '{v}' inválido. Opções: {', '.join(AVAILABLE_MODELS)}"
            )
        return v


def get_settings() -> Settings:
    return Settings()
