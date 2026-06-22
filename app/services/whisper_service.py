import gc
import time
import threading
import logging
from faster_whisper import WhisperModel
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Cache: { "large-v3": WhisperModel, ... }
_models: dict[str, WhisperModel] = {}

# Último uso de cada modelo: { "large-v3": timestamp, ... }
_last_used: dict[str, float] = {}

# Lock para evitar race condition no descarregamento
_lock = threading.Lock()

# Timer de monitoramento
_monitor_thread: threading.Thread | None = None


def _unload_model(model_name: str):
    """Descarrega um modelo da VRAM e limpa o cache."""
    with _lock:
        if model_name not in _models:
            return
        logger.info(f"Descarregando modelo '{model_name}' da VRAM por inatividade...")
        del _models[model_name]
        del _last_used[model_name]

    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass

    logger.info(f"Modelo '{model_name}' descarregado. VRAM liberada.")


def _monitor_loop():
    """Thread que verifica inatividade e descarrega modelos ociosos."""
    while True:
        time.sleep(30)  # verifica a cada 30 segundos
        timeout = settings.MODEL_UNLOAD_TIMEOUT
        if timeout <= 0:
            continue

        now = time.time()
        # copia as chaves para evitar mutar o dict durante iteração
        for model_name in list(_last_used.keys()):
            idle_seconds = now - _last_used.get(model_name, now)
            if idle_seconds >= timeout:
                _unload_model(model_name)


def _ensure_monitor():
    """Garante que a thread de monitoramento está rodando."""
    global _monitor_thread
    if settings.MODEL_UNLOAD_TIMEOUT <= 0:
        return
    if _monitor_thread is None or not _monitor_thread.is_alive():
        _monitor_thread = threading.Thread(target=_monitor_loop, daemon=True)
        _monitor_thread.start()
        logger.info(
            f"Monitor de inatividade iniciado "
            f"(timeout: {settings.MODEL_UNLOAD_TIMEOUT}s)"
        )


def get_model(model_name: str) -> WhisperModel:
    """Retorna o modelo solicitado — carrega na primeira vez, reutiliza nas seguintes."""
    _ensure_monitor()
    with _lock:
        if model_name not in _models:
            logger.info(f"Carregando modelo '{model_name}' em {settings.WHISPER_DEVICE}...")
            _models[model_name] = WhisperModel(
                model_name,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
                cpu_threads=settings.WHISPER_CPU_THREADS,
            )
            logger.info(f"Modelo '{model_name}' carregado.")
        _last_used[model_name] = time.time()
        return _models[model_name]


def unload_model(model_name: str) -> bool:
    """Descarrega manualmente um modelo da VRAM. Retorna True se estava carregado."""
    if model_name not in _models:
        return False
    _unload_model(model_name)
    return True


def get_status() -> dict:
    """Retorna status dos modelos carregados na VRAM."""
    now = time.time()
    timeout = settings.MODEL_UNLOAD_TIMEOUT
    loaded = {}
    for name in list(_models.keys()):
        idle = int(now - _last_used.get(name, now))
        loaded[name] = {
            "idle_seconds": idle,
            "unloads_in": max(0, timeout - idle) if timeout > 0 else None,
        }
    return {
        "timeout_seconds": timeout,
        "auto_unload": timeout > 0,
        "loaded_models": loaded,
    }


def transcribe(
    audio_path: str,
    language: str | None = None,
    model_name: str | None = None,
    word_timestamps: bool | None = None,
    vad_filter: bool | None = None,
) -> dict:
    selected_model = model_name or settings.WHISPER_MODEL
    model = get_model(selected_model)

    use_word_timestamps = word_timestamps if word_timestamps is not None else settings.WORD_TIMESTAMPS
    use_vad_filter = vad_filter if vad_filter is not None else settings.VAD_FILTER

    transcribe_kwargs = dict(
        language=language or settings.DEFAULT_LANGUAGE,
        word_timestamps=use_word_timestamps,
        vad_filter=use_vad_filter,
    )
    if use_vad_filter:
        transcribe_kwargs["vad_parameters"] = {"min_silence_duration_ms": 500}

    segments_gen, info = model.transcribe(audio_path, **transcribe_kwargs)

    segments = []
    for seg in segments_gen:
        words = []
        if use_word_timestamps and seg.words:
            words = [
                {
                    "word": w.word,
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "probability": round(w.probability, 3),
                }
                for w in seg.words
            ]
        segments.append(
            {
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "text": seg.text.strip(),
                "words": words,
            }
        )

    # atualiza o timestamp de último uso após a transcrição
    with _lock:
        _last_used[selected_model] = time.time()

    return {
        "model": selected_model,
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
        "duration": round(info.duration, 2),
        "word_timestamps": use_word_timestamps,
        "vad_filter": use_vad_filter,
        "segments": segments,
    }
