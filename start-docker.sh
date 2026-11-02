#!/usr/bin/env bash
# Starts ProjectPilot in Docker Desktop (macOS / Linux): ./start-docker.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo 'Docker Desktop is not running.'
  echo 'Start Docker Desktop, wait until it says "Engine running", then run this script again.'
  exit 1
fi

echo 'Building and starting ProjectPilot (the first time takes a few minutes)...'
docker compose up -d --build

echo 'Waiting for the app to be ready...'
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:8080/api/health; then
    echo
    echo 'ProjectPilot is running: http://localhost:8080'
    echo 'Sign in with aarav.patel@example.com / Password@123'
    (open http://localhost:8080 || xdg-open http://localhost:8080) >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 5
done

echo 'The app is taking longer than expected. Check the logs with: docker compose logs api'
exit 1
