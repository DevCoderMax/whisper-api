from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transcription, history

app = FastAPI(
    title="Faster-Whisper API",
    description="API de transcrição e geração de legendas com Faster-Whisper",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription.router, prefix="/api/v1", tags=["transcription"])
app.include_router(history.router, prefix="/api/v1", tags=["history"])


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Faster-Whisper API rodando"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
