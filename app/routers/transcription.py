import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from app.config import get_settings, AVAILABLE_MODELS
from app.services import whisper_service, subtitle_service, ffmpeg_service, history_service

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".flac", ".mkv", ".webm", ".mov"}


def _save_upload(file: UploadFile) -> tuple[str, int, str]:
    """
    Salva o upload em `settings.UPLOAD_DIR/<uuid>.<ext>`.
    Retorna (caminho, size_bytes, original_filename).
    """
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado: {ext}. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, stored_name)
    contents = file.file.read()
    with open(path, "wb") as f:
        f.write(contents)
    return path, len(contents), file.filename or stored_name


def _validate_model(model: str):
    if model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Modelo '{model}' inválido. Disponíveis: {', '.join(AVAILABLE_MODELS)}",
        )


def _prepare_audio(upload_path: str, ffmpeg_convert: bool) -> tuple[str, str | None]:
    """
    Retorna (caminho_para_transcrever, caminho_convertido_ou_none).
    Se ffmpeg_convert=True, converte para WAV 16kHz mono e retorna o novo caminho.
    O arquivo convertido é temporário e será apagado depois.
    """
    if ffmpeg_convert:
        converted = ffmpeg_service.convert_to_wav(upload_path)
        return converted, converted
    return upload_path, None


def _save_history(
    *,
    original_filename: str,
    audio_path: str,
    size_bytes: int,
    fmt: history_service.FormatType,
    language: str,
    model: str,
    duration: float,
    payload: dict,
) -> dict:
    """Salva no histórico e devolve os campos extras (id, audio_url, created_at)."""
    entry = history_service.add_entry(
        original_filename=original_filename,
        fmt=fmt,
        language=language,
        model=model,
        size_bytes=size_bytes,
        duration=duration,
        audio_path=audio_path,
        payload=payload,
    )
    return {
        "id": entry["id"],
        "audio_url": f"/api/v1/history/{entry['id']}/audio",
        "created_at": entry["created_at"],
    }


# ──────────────────────────────────────────────
# GET /models
# ──────────────────────────────────────────────
@router.get("/models", summary="Listar modelos disponíveis")
def list_models():
    return {
        "default": settings.WHISPER_MODEL,
        "available": AVAILABLE_MODELS,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
    }


# ──────────────────────────────────────────────
# Parâmetros comuns (documentação inline)
# ──────────────────────────────────────────────
_Q_LANGUAGE      = Query(default="pt",  description="Código do idioma (pt, en, es, ...)")
_Q_MODEL         = Query(default=None,  description="Modelo (padrão: definido no .env)")
_Q_WORD_TS       = Query(default=None,  description="Timestamps por palavra — true/false (padrão: true)")
_Q_VAD           = Query(default=None,  description="Filtro VAD remove silêncios — true/false (padrão: true)")
_Q_FFMPEG        = Query(default=False, description="Converte áudio para WAV 16kHz mono antes de transcrever (mais rápido)")


# ──────────────────────────────────────────────
# POST /transcribe
# ──────────────────────────────────────────────
@router.post("/transcribe", summary="Transcrever áudio/vídeo")
async def transcribe(
    file: UploadFile = File(..., description="Arquivo de áudio ou vídeo"),
    language: str = _Q_LANGUAGE,
    model: str = _Q_MODEL,
    word_timestamps: bool = _Q_WORD_TS,
    vad_filter: bool = _Q_VAD,
    ffmpeg_convert: bool = _Q_FFMPEG,
):
    if model:
        _validate_model(model)
    upload_path, size_bytes, original_filename = _save_upload(file)
    converted_path = None
    try:
        audio_path, converted_path = _prepare_audio(upload_path, ffmpeg_convert)
        result = whisper_service.transcribe(
            audio_path,
            language=language,
            model_name=model,
            word_timestamps=word_timestamps,
            vad_filter=vad_filter,
        )
        meta = _save_history(
            original_filename=original_filename,
            audio_path=upload_path,
            size_bytes=size_bytes,
            fmt="transcribe",
            language=result.get("language", language),
            model=result.get("model", model or settings.WHISPER_MODEL),
            duration=result.get("duration", 0.0),
            payload=result,
        )
        result.update(meta)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Erro na transcrição: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Apaga só o arquivo temporário do FFmpeg (se houver).
        # O upload_path é preservado pro histórico + player.
        ffmpeg_service.cleanup(converted_path)


# ──────────────────────────────────────────────
# POST /subtitle/srt
# ──────────────────────────────────────────────
@router.post("/subtitle/srt", response_class=PlainTextResponse, summary="Gerar legenda SRT")
async def generate_srt(
    file: UploadFile = File(...),
    language: str = _Q_LANGUAGE,
    model: str = _Q_MODEL,
    word_timestamps: bool = _Q_WORD_TS,
    vad_filter: bool = _Q_VAD,
    ffmpeg_convert: bool = _Q_FFMPEG,
):
    if model:
        _validate_model(model)
    upload_path, size_bytes, original_filename = _save_upload(file)
    converted_path = None
    try:
        audio_path, converted_path = _prepare_audio(upload_path, ffmpeg_convert)
        result = whisper_service.transcribe(
            audio_path, language=language, model_name=model,
            word_timestamps=word_timestamps, vad_filter=vad_filter,
        )
        srt = subtitle_service.generate_srt(result["segments"])
        base = os.path.splitext(original_filename)[0]
        meta = _save_history(
            original_filename=original_filename,
            audio_path=upload_path,
            size_bytes=size_bytes,
            fmt="srt",
            language=result.get("language", language),
            model=result.get("model", model or settings.WHISPER_MODEL),
            duration=result.get("duration", 0.0),
            payload={"srt": srt, "model": result.get("model"), "language": result.get("language")},
        )
        # O response é o SRT puro; os metadados vão em headers (Content-Disposition + custom).
        return PlainTextResponse(
            content=srt,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{base}.srt"',
                "X-History-Id": meta["id"],
                "X-Audio-Url": meta["audio_url"],
            },
        )
    except Exception as e:
        logger.error(f"Erro ao gerar SRT: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ffmpeg_service.cleanup(converted_path)


# ──────────────────────────────────────────────
# POST /subtitle/vtt
# ──────────────────────────────────────────────
@router.post("/subtitle/vtt", response_class=PlainTextResponse, summary="Gerar legenda VTT")
async def generate_vtt(
    file: UploadFile = File(...),
    language: str = _Q_LANGUAGE,
    model: str = _Q_MODEL,
    word_timestamps: bool = _Q_WORD_TS,
    vad_filter: bool = _Q_VAD,
    ffmpeg_convert: bool = _Q_FFMPEG,
):
    if model:
        _validate_model(model)
    upload_path, size_bytes, original_filename = _save_upload(file)
    converted_path = None
    try:
        audio_path, converted_path = _prepare_audio(upload_path, ffmpeg_convert)
        result = whisper_service.transcribe(
            audio_path, language=language, model_name=model,
            word_timestamps=word_timestamps, vad_filter=vad_filter,
        )
        vtt = subtitle_service.generate_vtt(result["segments"])
        base = os.path.splitext(original_filename)[0]
        meta = _save_history(
            original_filename=original_filename,
            audio_path=upload_path,
            size_bytes=size_bytes,
            fmt="vtt",
            language=result.get("language", language),
            model=result.get("model", model or settings.WHISPER_MODEL),
            duration=result.get("duration", 0.0),
            payload={"vtt": vtt, "model": result.get("model"), "language": result.get("language")},
        )
        return PlainTextResponse(
            content=vtt,
            media_type="text/vtt",
            headers={
                "Content-Disposition": f'attachment; filename="{base}.vtt"',
                "X-History-Id": meta["id"],
                "X-Audio-Url": meta["audio_url"],
            },
        )
    except Exception as e:
        logger.error(f"Erro ao gerar VTT: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ffmpeg_service.cleanup(converted_path)


# ──────────────────────────────────────────────
# POST /subtitle/both
# ──────────────────────────────────────────────
@router.post("/subtitle/both", summary="Gerar SRT e VTT juntos")
async def generate_both(
    file: UploadFile = File(...),
    language: str = _Q_LANGUAGE,
    model: str = _Q_MODEL,
    word_timestamps: bool = _Q_WORD_TS,
    vad_filter: bool = _Q_VAD,
    ffmpeg_convert: bool = _Q_FFMPEG,
):
    if model:
        _validate_model(model)
    upload_path, size_bytes, original_filename = _save_upload(file)
    converted_path = None
    try:
        audio_path, converted_path = _prepare_audio(upload_path, ffmpeg_convert)
        result = whisper_service.transcribe(
            audio_path, language=language, model_name=model,
            word_timestamps=word_timestamps, vad_filter=vad_filter,
        )
        srt = subtitle_service.generate_srt(result["segments"])
        vtt = subtitle_service.generate_vtt(result["segments"])
        meta = _save_history(
            original_filename=original_filename,
            audio_path=upload_path,
            size_bytes=size_bytes,
            fmt="both",
            language=result.get("language", language),
            model=result.get("model", model or settings.WHISPER_MODEL),
            duration=result.get("duration", 0.0),
            payload={"srt": srt, "vtt": vtt, "model": result.get("model"), "language": result.get("language")},
        )
        return {
            "model": result["model"],
            "language": result["language"],
            "language_probability": result["language_probability"],
            "duration": result["duration"],
            "word_timestamps": result["word_timestamps"],
            "vad_filter": result["vad_filter"],
            "srt": srt,
            "vtt": vtt,
            **meta,
        }
    except Exception as e:
        logger.error(f"Erro ao gerar legendas: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ffmpeg_service.cleanup(converted_path)


# ──────────────────────────────────────────────
# GET /models/status
# ──────────────────────────────────────────────
@router.get("/models/status", summary="Status dos modelos na VRAM")
def models_status():
    return whisper_service.get_status()


# ──────────────────────────────────────────────
# POST /models/{model_name}/unload
# ──────────────────────────────────────────────
@router.post("/models/{model_name}/unload", summary="Descarregar modelo da VRAM")
def unload_model(model_name: str):
    _validate_model(model_name)
    unloaded = whisper_service.unload_model(model_name)
    if unloaded:
        return {"message": f"Modelo '{model_name}' descarregado da VRAM."}
    return {"message": f"Modelo '{model_name}' não estava carregado."}
