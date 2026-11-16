FROM python:3.12-slim

WORKDIR /app

# Leverages Docker's layer cache: requirements.txt changes far less often
# than app code, so this layer only re-runs (the slow part - pip resolving
# and downloading every dependency) when a dependency actually changes, not
# on every code edit.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Cloud Run injects PORT at runtime (8080 by default) and expects the
# container to listen on it, not a hardcoded port - shell form (not exec
# form) so $PORT actually gets substituted. Matches the uvicorn invocation
# already documented in README.md, just with the host/port Railway's own
# dashboard start-command field was presumably supplying.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
