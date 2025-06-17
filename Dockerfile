FROM python:3.11.6

WORKDIR /app

ARG PORT
ENV PORT=${PORT:-3001}

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy your application code
COPY alembic.ini /app/alembic.ini
COPY migrations /app/migrations
COPY src /app/src
COPY entrypoint.sh /app/entrypoint.sh

EXPOSE ${PORT}

CMD ["/bin/bash", "/app/entrypoint.sh"]
