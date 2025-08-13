FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    ffmpeg \
    libsm6 \
    libxext6 \
    libfontconfig1 \
    libxrender1 \
    libgl1-mesa-glx \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p checkpoints uploads

# Verify model files exist and show their sizes
RUN ls -la checkpoints/ || echo "Checkpoints directory not found"
RUN test -f checkpoints/efficientnet.onnx && echo "efficientnet.onnx found" || echo "efficientnet.onnx missing"
RUN test -f checkpoints/model.pth && echo "model.pth found" || echo "model.pth missing"

# Expose the port Flask runs on
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]