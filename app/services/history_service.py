"""
Serviço de histórico de transcrições/legendas.

Persiste em `outputs/history.json`. Thread-safe via `threading.Lock`.
Não usa dependências externas — só stdlib.
"""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Literal

# Formatos suportados: "transcribe" (JSON puro), "srt", "vtt", "both"
FormatType = Literal["transcribe", "srt", "vtt", "both"]

# Local do JSON de histórico
HISTORY_FILE = Path(__file__).resolve().parents[2] / "outputs" / "history.json"

_lock = threading.Lock()


def _ensure_file() -> None:
    """Garante que o diretório e o arquivo existam."""
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not HISTORY_FILE.exists():
        HISTORY_FILE.write_text("[]", encoding="utf-8")


def _read_all() -> list[dict[str, Any]]:
    _ensure_file()
    try:
        text = HISTORY_FILE.read_text(encoding="utf-8")
        data = json.loads(text)
        if not isinstance(data, list):
            return []
        return data
    except (json.JSONDecodeError, OSError):
        return []


def _write_all(entries: list[dict[str, Any]]) -> None:
    _ensure_file()
    tmp = HISTORY_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, HISTORY_FILE)


def add_entry(
    *,
    original_filename: str,
    fmt: FormatType,
    language: str,
    model: str,
    size_bytes: int,
    duration: float,
    audio_path: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Adiciona uma entrada ao histórico. Retorna o dict criado (com `id`, `audio_url` etc).
    O `payload` é o conteúdo completo do response (segments, srt, vtt, etc).
    """
    entry_id = uuid.uuid4().hex[:12]
    entry: dict[str, Any] = {
        "id": entry_id,
        "original_filename": original_filename,
        "format": fmt,
        "language": language,
        "model": model,
        "size_bytes": size_bytes,
        "duration": duration,
        "audio_path": audio_path,
        "created_at": time.time(),
        "payload": payload,
    }
    with _lock:
        entries = _read_all()
        entries.insert(0, entry)  # mais recente primeiro
        _write_all(entries)
    return entry


def list_entries() -> list[dict[str, Any]]:
    """Retorna todas as entradas (sem `payload` completo, para a listagem)."""
    with _lock:
        return _read_all()


def get_entry(entry_id: str) -> dict[str, Any] | None:
    """Retorna a entrada completa (com payload) ou None."""
    with _lock:
        for e in _read_all():
            if e.get("id") == entry_id:
                return e
    return None


def delete_entry(entry_id: str) -> bool:
    """Apaga a entrada e o arquivo de áudio do disco. Retorna True se removeu."""
    with _lock:
        entries = _read_all()
        target = next((e for e in entries if e.get("id") == entry_id), None)
        if not target:
            return False
        # Remove do disco (best-effort)
        audio_path = target.get("audio_path")
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except OSError:
                pass
        entries = [e for e in entries if e.get("id") != entry_id]
        _write_all(entries)
        return True


def clear_all() -> int:
    """Apaga todas as entradas e seus arquivos. Retorna quantas foram removidas."""
    with _lock:
        entries = _read_all()
        for e in entries:
            audio_path = e.get("audio_path")
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except OSError:
                    pass
        _write_all([])
        return len(entries)
