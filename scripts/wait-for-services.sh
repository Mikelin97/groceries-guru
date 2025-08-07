#!/bin/bash
# Wait for services to be ready before starting the application

set -e

echo "🚀 Starting Groceries Guru application..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
# Extract hostname from POSTGRES_URL: postgresql://user:pass@host:port/db
if [ -n "$POSTGRES_URL" ]; then
  POSTGRES_HOST=$(echo "$POSTGRES_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  POSTGRES_PORT=$(echo "$POSTGRES_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  POSTGRES_PORT="${POSTGRES_PORT:-5432}"
else
  POSTGRES_HOST="groceries-guru-postgres.cxa2qs8gge6t.us-west-2.rds.amazonaws.com"
  POSTGRES_PORT="5432"
fi

echo "Testing connection to PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT"
until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  echo "PostgreSQL ($POSTGRES_HOST:$POSTGRES_PORT) is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready  
echo "⏳ Waiting for Redis..."
# Extract hostname from REDIS_URL: redis://host:port
if [ -n "$REDIS_URL" ]; then
  REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|redis://\([^:]*\):.*|\1|p')
  REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|.*:\([0-9]*\)$|\1|p')
  REDIS_PORT="${REDIS_PORT:-6379}"
else
  REDIS_HOST="groceries-guru-redis.8xvydc.0001.usw2.cache.amazonaws.com"
  REDIS_PORT="6379"
fi

echo "Testing connection to Redis: $REDIS_HOST:$REDIS_PORT"
until nc -z "$REDIS_HOST" "$REDIS_PORT"; do
  echo "Redis ($REDIS_HOST:$REDIS_PORT) is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

echo "🎉 All services are ready! Starting the application..."

# Execute the command passed to this script
exec "$@"