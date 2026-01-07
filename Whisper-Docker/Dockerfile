
# Use NVIDIA's CUDA 12.2 development image (toolkit + compilers)
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Python 3.11, build tools, git, ffmpeg in one layer
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    build-essential ninja-build cmake git ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Upgrade pip & basic packaging tools for Python 3.11
RUN python3.11 -m pip install --upgrade pip setuptools wheel

# CUDA environment
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
# Include CUDA lib64 to ensure nvcc/rt libs resolve at build/runtime
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/nvidia/lib:/usr/local/nvidia/lib64

# Optional: reduce parallel compilation memory footprint
ENV MAX_JOBS=2

# Optional: restrict to your target GPU arch to reduce compile time/memory
# Uncomment ONE of these based on your deployment GPU:
# A100:
# ENV TORCH_CUDA_ARCH_LIST=8.0
# H100:
# ENV TORCH_CUDA_ARCH_LIST=9.0

WORKDIR /app

# Copy only requirements first to leverage Docker build cache
COPY app/requirements.txt /app/requirements.txt

# Install Python dependencies using Python 3.11 explicitly
# NOTE: Ensure your requirements pin torch/torchvision/torchaudio to a combo compatible with CUDA 12.2
# or use a bundled CUDA wheel (e.g., cu121/cu124) to avoid source builds.
RUN python3.11 -m pip install -r /app/requirements.txt

# Install flash-attn. If a prebuilt wheel exists for your combo, this will be fast.
# If not, ninja + MAX_JOBS will help compilation succeed more reliably.
RUN python3.11 -m pip install --upgrade flash-attn

# Copy the rest of the application code
COPY . /app

# Metadata
LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi <Vinayak.Mathur@cognizant.com>,<Aditi.chatterjee@cognizant.com>"

EXPOSE 8000

# Run via Python 3.11 explicitly
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
