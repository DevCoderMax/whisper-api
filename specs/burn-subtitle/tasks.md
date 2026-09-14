# Burn Subtitle — Tasks

## Dependências

- [x] FFmpeg instalado no sistema (`ffmpeg -version`)
- [x] Endpoint existente para upload de vídeo (`_save_upload`)
- [x] Serviço de transcrição existente (`whisper_service.transcribe`)
- [x] Serviço de FFmpeg existente (`ffmpeg_service`)

## Tasks

### Backend

- [x] **T1**: Adicionar função `burn_subtitle()` em `app/services/ffmpeg_service.py`
  - Recebe `video_path` e `srt_path`
  - Executa FFmpeg com filtro `subtitles`
  - Retorna caminho do vídeo de saída
  - Trata erros (FFmpeg não encontrado, falha na execução)

- [x] **T2**: Adicionar endpoint `POST /api/v1/subtitle/burn` em `app/routers/transcription.py`
  - Aceita upload de vídeo + SRT (modo SRT)
  - Aceita upload de vídeo + parâmetros de transcrição (modo transcribe)
  - Retorna vídeo como `StreamingResponse`
  - Limpa arquivos temporários após envio

- [x] **T3**: Adicionar tipo `burn` ao `HistoryFormat` em `app/services/history_service.py`
  - Permitir salvar histórico de operações de burn

### Frontend

- [x] **T4**: Adicionar função `subtitleBurn()` em `web/src/lib/api.ts`
  - Envia FormData com vídeo + SRT ou vídeo + parâmetros
  - Retorna Blob (vídeo)

- [x] **T5**: Atualizar `BurnSubtitleFlow` em `web/src/components/subtitle/burn-subtitle-flow.tsx`
  - Chamar `api.subtitleBurn()` no submit
  - Criar download do vídeo resultante

- [ ] **T6**: Testar fluxo completo
  - Modo SRT: upload vídeo + SRT → download vídeo com legenda
  - Modo Transcrever: upload vídeo → transcrever → download vídeo com legenda
