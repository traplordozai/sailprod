#!/bin/bash
set -e

echo "Waiting for database to be ready..."

# Basic wait loop. Adjust host/port to match your DB service.
# Alternatively, install netcat or use a more robust wait-for script.
until pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" > /dev/null 2>&1; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Database is up. Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn django_project.wsgi:application --bind 0.0.0.0:8000