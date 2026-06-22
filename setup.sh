#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Erro: Python nao encontrado. Instale Python 3.10+ e tente novamente."
    exit 1
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Erro: npm nao encontrado. Instale Node.js 20+ e tente novamente."
  exit 1
fi

echo "==> Criando ambiente virtual Python em ./venv"
if [ ! -d "venv" ]; then
  "$PYTHON_BIN" -m venv venv
else
  echo "venv ja existe, reutilizando."
fi

echo "==> Instalando dependencias da API"
"$ROOT_DIR/venv/bin/python" -m pip install --upgrade pip
"$ROOT_DIR/venv/bin/python" -m pip install -r requirements.txt

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "==> Criando .env a partir de .env.example"
  cp .env.example .env
else
  echo "==> .env ja existe ou .env.example nao foi encontrado; pulando copia."
fi

echo "==> Instalando dependencias do frontend"
cd "$ROOT_DIR/web"
npm install

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "==> Criando web/.env a partir de web/.env.example"
  cp .env.example .env
else
  echo "==> web/.env ja existe ou web/.env.example nao foi encontrado; pulando copia."
fi

echo ""
echo "Setup concluido."
echo "Para rodar a API: source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "Para rodar o frontend: cd web && npm run dev"
