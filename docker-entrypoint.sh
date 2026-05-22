#!/bin/sh
set -e

mkdir -p /app/data

if [ ! -f /app/data/popcorn.db ]; then
  echo "Database not found — running initial seed..."
  node scripts/docker-seed.js
  echo "Seed complete."
fi

exec node server.js
