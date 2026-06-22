# Faster-Whisper API

API de transcrição e geração de legendas (SRT/VTT) usando Faster-Whisper + FastAPI.

## Requisitos

- Python 3.10+
- CUDA 11.x ou 12.x (para GPU)
- ffmpeg instalado no sistema

```bash
sudo apt install ffmpeg
```

## Instalação

```bash
# 1. Clonar / entrar na pasta do projeto
cd whisper-api

# 2. Criar ambiente virtual
python -m venv venv
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env se necessário
```

## Rodar

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Acesse a documentação interativa em: http://localhost:8000/docs

## Endpoints

### `POST /api/v1/transcribe`
Transcrição completa em JSON com timestamps por palavra.

```bash
curl -X POST http://localhost:8000/api/v1/transcribe \
  -F "file=@audio.mp3" \
  -F "language=pt"
```

Resposta:
```json
{
  "language": "pt",
  "language_probability": 0.99,
  "duration": 120.5,
  "segments": [
    {
      "start": 0.0,
      "end": 3.2,
      "text": "Olá, tudo bem?",
      "words": [
        { "word": "Olá,", "start": 0.0, "end": 0.4, "probability": 0.99 }
      ]
    }
  ]
}
```

---

### `POST /api/v1/subtitle/srt`
Retorna arquivo `.srt` para download.

```bash
curl -X POST http://localhost:8000/api/v1/subtitle/srt \
  -F "file=@video.mp4" \
  -o legenda.srt
```

---

### `POST /api/v1/subtitle/vtt`
Retorna arquivo `.vtt` para download.

```bash
curl -X POST http://localhost:8000/api/v1/subtitle/vtt \
  -F "file=@video.mp4" \
  -o legenda.vtt
```

---

### `POST /api/v1/subtitle/both`
Retorna SRT e VTT juntos em um único JSON.

```bash
curl -X POST http://localhost:8000/api/v1/subtitle/both \
  -F "file=@video.mp4"
```

Resposta:
```json
{
  "language": "pt",
  "language_probability": 0.99,
  "duration": 120.5,
  "srt": "1\n00:00:00,000 --> 00:00:03,200\nOlá, tudo bem?\n\n...",
  "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:03.200\nOlá, tudo bem?\n\n..."
}
```

## Estrutura do projeto

```
whisper-api/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── config.py            # Configurações via .env
│   ├── routers/
│   │   └── transcription.py # Endpoints
│   └── services/
│       ├── whisper_service.py  # Carregamento do modelo e transcrição
│       └── subtitle_service.py # Geração de SRT e VTT
├── uploads/                 # Arquivos temporários (apagados após transcrição)
├── .env.example
├── requirements.txt
└── README.md
```

## Idiomas suportados

Passe o código ISO no parâmetro `language`:
`pt` (português), `en` (inglês), `es` (espanhol), `fr` (francês), `de` (alemão), `ja` (japonês), etc.

Se não passar, o modelo detecta automaticamente.
