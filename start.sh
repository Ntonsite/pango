#!/bin/bash
set -e

echo "Building Pango Docker images..."
docker compose build

echo "Starting Pango Services..."
docker compose up -d

echo ""
echo "Services are running! Access the application at http://localhost:8080"
echo "Tailing logs (Ctrl+C stops watching, services keep running in the background)..."
echo ""

docker compose logs -f
