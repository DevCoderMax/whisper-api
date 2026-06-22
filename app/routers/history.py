"""
Endpoints para consultar/apagar o histórico de transcrições/legendas.
"""
import logging
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services import history_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _summary(entry: dict) -> dict:
    """Versão resumida (sem payload) para a listagem."""
    return {
        "id": entry["id"],
        "original_filename": entry["original_filename"],
        "format": entry["format"],
        "language": entry["language"],
        "model": entry["model"],
        "size_bytes": entry["size_bytes"],
        "duration": entry["duration"],
        "created_at": entry["created_at"],
        "audio_url": f"/api/v1/history/{entry['id']}/audio",
        "has_transcript": entry["format"] == "transcribe",
        "has_srt": entry["format"] in ("srt", "both"),
        "has_vtt": entry["format"] in ("vtt", "both"),
    }


@router.get("/history", summary="Listar histórico de transcrições/legendas")
def list_history():
    entries = history_service.list_entries()
    return [_summary(e) for e in entries]


@router.get("/history/{entry_id}", summary="Detalhes de uma entrada do histórico")
def get_history_detail(entry_id: str):
    entry = history_service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Entrada '{entry_id}' não encontrada")
    summary = _summary(entry)
    summary["payload"] = entry["payload"]
    return summary


@router.get("/history/{entry_id}/audio", summary="Stream do arquivo de áudio/vídeo")
def get_history_audio(entry_id: str):
    entry = history_service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Entrada '{entry_id}' não encontrada")
    audio_path = entry.get("audio_path")
    if not audio_path or not os.path.exists(audio_path):
        raise HTTPException(status_code=410, detail="Arquivo de áudio não está mais disponível")
    # FileResponse já suporta Range requests nativamente, essencial pro <audio> com seek.
    if audio_path.endswith((".mp3",)):
        media_type = "audio/mpeg"
    elif audio_path.endswith((".m4a",)):
        media_type = "audio/mp4"
    elif audio_path.endswith(".mp4"):
        media_type = "video/mp4"
    elif audio_path.endswith(".wav"):
        media_type = "audio/wav"
    elif audio_path.endswith(".ogg"):
        media_type = "audio/ogg"
    elif audio_path.endswith(".flac"):
        media_type = "audio/flac"
    else:
        media_type = "application/octet-stream"
    return FileResponse(
        audio_path,
        media_type=media_type,
        filename=entry["original_filename"],
        headers={"Accept-Ranges": "bytes"},
    )


@router.delete("/history/{entry_id}", summary="Apagar uma entrada do histórico")
def delete_history_entry(entry_id: str):
    ok = history_service.delete_entry(entry_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Entrada '{entry_id}' não encontrada")
    return {"message": f"Entrada '{entry_id}' removida do histórico."}


@router.delete("/history", summary="Apagar todo o histórico")
def clear_history():
    removed = history_service.clear_all()
    return {"message": f"{removed} entrada(s) removida(s) do histórico."}
