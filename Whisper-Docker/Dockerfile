
# Use NVIDIA's CUDA 12.2 development image
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    build-essential ninja-build cmake git ffmpeg \
 && rm -rf /var/lib/apt/lists/*

RUN python3.11 -m pip install --upgrade pip setuptools wheel

# CUDA env (already fine)
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/nvidia/lib:/usr/local/nvidia/lib64
ENV MAX_JOBS=2

WORKDIR /app

# 1) Install PyTorch + CUDA runtime BEFORE flash-attn
#    Pick ONE of these lines (cu126 is the current stable; cu124 also widely used)
RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Copy requirements
COPY app/requirements.txt /app/requirements.txt

# 2) Install other deps (they can rely on torch now)
RUN python3.11 -m pip install -r /app/requirements.txt

# 3) Install flash-attn without build isolation so it can import torch
RUN python3.11 -m pip install flash-attn --no-build-isolation

# Copy the rest
COPY . /app

EXPOSE 8000
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
