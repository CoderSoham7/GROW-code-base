
# NVIDIA CUDA 12.2 development image
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# System deps
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    build-essential ninja-build cmake git ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Modern pip toolchain
RUN python3.11 -m pip install --upgrade pip setuptools wheel

# CUDA env
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/nvidia/lib:/usr/local/nvidia/lib64
ENV MAX_JOBS=2
# Optional: restrict to a single GPU arch to speed NVCC (uncomment one)
# ENV TORCH_CUDA_ARCH_LIST=8.0   # A100
# ENV TORCH_CUDA_ARCH_LIST=9.0   # H100

WORKDIR /app

# 1) Install PyTorch with bundled CUDA runtime BEFORE flash-attn
# Use official PyTorch index URLs; choose ONE:
RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# Alternative if you prefer CUDA 12.4 wheels:
# RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# 2) App requirements (ensure these do NOT overwrite torch with a CPU-only build)
COPY app/requirements.txt /app/requirements.txt
RUN python3.11 -m pip install -r /app/requirements.txt

# 3) Install flash-attn WITHOUT build isolation so it can import torch during build
RUN python3.11 -m pip install flash-attn --no-build-isolation

# Copy the rest of the codebase
COPY . /app

EXPOSE 8000
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
