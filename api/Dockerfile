FROM python:3.11-slim

# Set timezone to AEDT (Australia/Sydney)
ENV TZ=Australia/Sydney
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY db /app/db

COPY api /app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
