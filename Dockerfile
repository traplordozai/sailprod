FROM python:3.12.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpq-dev \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

ENV PYTHONPATH=/app

# Expose port 8000
EXPOSE 8000

# Run gunicorn with a healthcheck
# Adjust healthcheck path if needed for Django
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application - for Django, we will override this in docker-compose.yaml later for development
# This is a placeholder, Django start command is different
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]