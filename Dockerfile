FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies needed for compiling psycopg2 if building from source
# (using psycopg2-binary helps avoid compiling, but we keep the package list clean)
RUN apk add --no-cache gcc musl-dev postgresql-dev libffi-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
