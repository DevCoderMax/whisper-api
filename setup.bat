@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  set "PYTHON_CMD=py -3"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "PYTHON_CMD=python"
  ) else (
    echo Erro: Python nao encontrado. Instale Python 3.10+ e tente novamente.
    exit /b 1
  )
)

where npm >nul 2>nul
if not %errorlevel%==0 (
  echo Erro: npm nao encontrado. Instale Node.js 20+ e tente novamente.
  exit /b 1
)

echo ==^> Criando ambiente virtual Python em .\venv
if not exist "venv\Scripts\python.exe" (
  %PYTHON_CMD% -m venv venv
  if errorlevel 1 exit /b 1
) else (
  echo venv ja existe, reutilizando.
)

echo ==^> Instalando dependencias da API
"%~dp0venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 exit /b 1
"%~dp0venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

if not exist ".env" if exist ".env.example" (
  echo ==^> Criando .env a partir de .env.example
  copy ".env.example" ".env" >nul
) else (
  echo ==^> .env ja existe ou .env.example nao foi encontrado; pulando copia.
)

echo ==^> Instalando dependencias do frontend
cd /d "%~dp0web"
npm install
if errorlevel 1 exit /b 1

if not exist ".env" if exist ".env.example" (
  echo ==^> Criando web\.env a partir de web\.env.example
  copy ".env.example" ".env" >nul
) else (
  echo ==^> web\.env ja existe ou web\.env.example nao foi encontrado; pulando copia.
)

cd /d "%~dp0"

echo.
echo Setup concluido.
echo Para rodar a API: venv\Scripts\activate.bat ^&^& uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo Para rodar o frontend: cd web ^&^& npm run dev

endlocal
