def _format_time_srt(seconds: float) -> str:
    """00:01:23,456"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _format_time_vtt(seconds: float) -> str:
    """00:01:23.456"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def generate_srt(segments: list[dict]) -> str:
    """Gera conteúdo SRT a partir dos segmentos transcritos."""
    lines = []
    for i, seg in enumerate(segments, start=1):
        start = _format_time_srt(seg["start"])
        end = _format_time_srt(seg["end"])
        lines.append(str(i))
        lines.append(f"{start} --> {end}")
        lines.append(seg["text"])
        lines.append("")
    return "\n".join(lines)


def generate_vtt(segments: list[dict]) -> str:
    """Gera conteúdo VTT a partir dos segmentos transcritos."""
    lines = ["WEBVTT", ""]
    for seg in segments:
        start = _format_time_vtt(seg["start"])
        end = _format_time_vtt(seg["end"])
        lines.append(f"{start} --> {end}")
        lines.append(seg["text"])
        lines.append("")
    return "\n".join(lines)
