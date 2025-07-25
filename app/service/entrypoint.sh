#!/bin/bash

echo "Waiting for 10 seconds..."
sleep 10

echo "Running Alembic upgrade..."
alembic upgrade head

echo "Starting Uvicorn..."
uvicorn src.main:app --host 0.0.0.0 --port ${PORT}
