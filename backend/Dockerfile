# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render will override with PORT env var)
EXPOSE 8000

# Run the application
# Use shell form to allow environment variable substitution
CMD sh -c "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"
