#!/bin/bash

set -e

# Wait for postgres with explicit password
until PGPASSWORD=postgres psql -h "db" -U "postgres" -c '\q' 2>/dev/null; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

# Run migrations
python manage.py migrate

# Execute passed command
exec "$@"
