import os
import subprocess
import logging

logger = logging.getLogger(__name__)


def convert_to_wav(input_path: str) -> str:
    """
    Converte o arquivo para WAV mono 16kHz — formato ideal para o Whisper.
    Retorna o caminho do arquivo convertido.

    Por que isso acelera a transcrição:
    - Mono: elimina canal desnecessário
    - 16kHz: é exatamente a taxa que o Whisper usa internamente
    - PCM 16-bit: sem overhead de decodificação
    """
    output_path = input_path.rsplit(".", 1)[0] + "_converted.wav"

    cmd = [
        "ffmpeg",
        "-y",                    # sobrescreve sem perguntar
        "-i", input_path,        # arquivo de entrada
        "-ar", "16000",          # sample rate 16kHz
        "-ac", "1",              # mono
        "-c:a", "pcm_s16le",     # PCM 16-bit little-endian
        "-vn",                   # ignora trilha de vídeo
        output_path,
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=300,
        )
        if result.returncode != 0:
            error = result.stderr.decode("utf-8", errors="ignore")
            raise RuntimeError(f"ffmpeg falhou: {error}")

        logger.info(f"Áudio convertido: {output_path}")
        return output_path

    except FileNotFoundError:
        raise RuntimeError(
            "ffmpeg não encontrado. Instale com: sudo apt install ffmpeg"
        )


def cleanup(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
