#!/bin/bash
# Azure App Service startup script

# Activate virtual environment if exists
if [ -d "antenv" ]; then
    source antenv/bin/activate
fi

# Start Gunicorn with Uvicorn workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --timeout 120 --access-logfile '-' --error-logfile '-'
