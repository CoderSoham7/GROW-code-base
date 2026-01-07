
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

# Optional: reduce parallel compilation memory footprint
ENV MAX_JOBS=2

# Optional: restrict to target GPU arch to reduce compile time/memory
# Uncomment ONE if applicable:
# ENV TORCH_CUDA_ARCH_LIST=8.0   # A100
# ENV TORCH_CUDA_ARCH_LIST=9.0   # H100

WORKDIR /app

# -------------------------------------------------------------------
# IMPORTANT: Install PyTorch (CUDA wheel) BEFORE flash-attn.
# Use ONE official index from pytorch.org Get Started:
# cu126 (CUDA 12.6) is current stable; cu124 also widely available.
# -------------------------------------------------------------------
RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# Alternative:
# RUN python3.11 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Copy and install your application dependencies
COPY app/requirements.txt /app/requirements.txt
# Ensure requirements.txt does NOT override torch with a CPU-only wheel!
RUN python3.11 -m pip install -r /app/requirements.txt

# Install flash-attn WITHOUT build isolation so it can import torch during build
RUN python3.11 -m pip install flash-attn --no-build-isolation

# Copy the rest of the code
COPY . /app

# Metadata (optional)
LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi <Vinayak.Mathur@cognizant.com>, <Aditi.chatterjee@cognizant.com>"

# Expose service port
EXPOSE 8000

# Run via Python 3.11 explicitly
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
