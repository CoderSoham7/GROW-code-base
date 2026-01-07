
# Use NVIDIA's CUDA 12.2 development image (toolkit + compilers)
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# Non-interactive apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Base OS packages: Python 3.11, build tools, git, ffmpeg
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    build-essential ninja-build cmake git ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Upgrade pip stack
RUN python3.11 -m pip install --upgrade pip setuptools wheel

# CUDA environment
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/nvidia/lib:/usr/local/nvidia/lib64

# Optional: tame parallel compilation if memory is tight
ENV MAX_JOBS=2

# Optional: restrict to your target GPU arch to reduce compile time/memory
# Uncomment ONE of these if you know your deployment GPU:
# A100:
# ENV TORCH_CUDA_ARCH_LIST=8.0
# H100:
# ENV TORCH_CUDA_ARCH_LIST=9.0

WORKDIR /app

# -------------------------------------------------------------------
# IMPORTANT: Install PyTorch (CUDA wheel) BEFORE flash-attn.
# Choose ONE of the official CUDA indices from pytorch.org:
# cu126 (CUDA 12.6) is the current stable at time of writing.
# If your stack prefers CUDA 12.4, use cu124 line instead.
# -------------------------------------------------------------------
RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# Alternative:
# RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Copy your application requirements
COPY app/requirements.txt /app/requirements.txt

# Install app dependencies (ensure requirements.txt DOES NOT override torch with a CPU-only wheel)
RUN python3.11 -m pip install -r /app/requirements.txt

# Install flash-attn WITHOUT build isolation so it can import torch during build
RUN python3.11 -m pip install flash-attn --no-build-isolation

# Copy the rest of the application code
COPY . /app

# Metadata (optional)
LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi <Vinayak.Mathur@cognizant.com>, <Aditi.chatterjee@cognizant.com>"

# Expose service port
EXPOSE 8000

# Run via Python 3.11 explicitly
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
