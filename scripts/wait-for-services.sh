#!/bin/bash
# Wait for services to be ready before starting the application

set -e

echo "🚀 Starting Groceries Guru application..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

echo "🎉 All services are ready! Starting the application..."

# Execute the command passed to this script
exec "$@"