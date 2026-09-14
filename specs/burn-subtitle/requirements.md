# Burn Subtitle — Requirements

## Objetivo

Permitir ao usuário incorporar legendas diretamente em um arquivo de vídeo, usando FFmpeg para gerar o vídeo com legenda embutida (hardcoded).

## User Stories

1. Como usuário, quero selecionar um arquivo de vídeo e um arquivo SRT existente para gerar um vídeo com legenda embutida.
2. Como usuário, quero selecionar um arquivo de vídeo e transcrever o áudio automaticamente para gerar a legenda e incorporá-la ao vídeo.
3. Como usuário, quero baixar o vídeo resultante com a legenda embutida.

## Critérios de Aceitação

- [ ] Endpoint `POST /api/v1/subtitle/burn` aceita upload de vídeo + SRT
- [ ] Endpoint `POST /api/v1/subtitle/burn` aceita upload de vídeo com parâmetros de transcrição (transcreve + incrusta)
- [ ] FFmpeg é usado para incorporar a legenda no vídeo (sem recodificação de vídeo, apenas adição de stream de legenda ou hardcode via filter)
- [ ] O vídeo resultante é retornado como download (ou URL temporária)
- [ ] Validação de formato: apenas extensões suportadas (.mp4, .mkv, .webm, .mov)
- [ ] Validação de tamanho máximo de upload (configurável via MAX_UPLOAD_SIZE_MB)
- [ ] Tratamento de erros: FFmpeg não instalado, formato inválido, arquivo corrompido
