"""
django_project/settings.py
--------------------------------------------------
Environment-based settings with django-environ.
"""

import os
from pathlib import Path
import environ
from datetime import timedelta
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)
env_file = os.path.join(BASE_DIR, '.env')
if os.path.isfile(env_file):
    env.read_env(env_file)

# Get port from environment variable or default to 10000
PORT = int(os.getenv('PORT', '10000'))

# ... other settings ...

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://postgres:postgres@localhost:5432/postgres',
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True if not DEBUG else False,
        options={
            'connect_timeout': 5,
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        }
    )
}

# Add this at the end of the file
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(DATABASE_URL, conn_max_age=600)

# ... rest of your settings ... 