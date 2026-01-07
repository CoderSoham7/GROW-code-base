
# Use NVIDIA's CUDA 12.2 development image (toolkit + compilers)
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# System deps: Python 3.11, build tools, git, ffmpeg
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    build-essential ninja-build cmake git ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Upgrade pip/setuptools/wheel
RUN python3.11 -m pip install --upgrade pip setuptools wheel

# CUDA env
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/nvidia/lib:/usr/local/nvidia/lib64

# Optional: compile tuning
ENV MAX_JOBS=2
# If you target only A100 or H100, uncomment one:
# ENV TORCH_CUDA_ARCH_LIST=8.0   # A100
# ENV TORCH_CUDA_ARCH_LIST=9.0   # H100

WORKDIR /app

# Install PyTorch + CUDA runtime before flash-attn
# Choose one of these, depending on your policy:
# CUDA 12.6 (stable current on pytorch.org at time of writing)
RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# Alternatively, CUDA 12.4:
# RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Copy requirements early to use Docker cache
COPY app/requirements.txt /app/requirements.txt

# Install your app deps (they can rely on torch now)
RUN python3.11 -m pip install -r /app/requirements.txt

# Install flash-attn WITHOUT build isolation so it can import torch
RUN python3.11 -m pip install flash-attn --no-build-isolation

# Copy the rest of the code
COPY . /app

LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi <Vinayak.Mathur@cognizant.com>,<Aditi.chatterjee@cognizant.com>"

EXPOSE 8000

CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
