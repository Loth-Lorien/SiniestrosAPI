@echo off
cd /d "%~dp0"
echo Activando entorno virtual...
call .venv\Scripts\activate.bat
echo Iniciando servidor FastAPI...
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
pause
