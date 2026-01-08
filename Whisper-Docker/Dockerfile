FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# Install Python 3.10
RUN apt-get update && apt-get install -y python3.10 python3.10-distutils python3.10-venv python3.10-dev python3-pip
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1
RUN apt-get update && apt-get install -y git ffmpeg curl

# Set the working directory to /app
WORKDIR /app

# Copy the requirements.txt file into the container
COPY app/requirements.txt .

# Set environment variables for CUDA and library paths
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64
ENV FLASH_ATTENTION_SKIP_CUDA_BUILD=TRUE

# Upgrade pip
RUN python3 -m pip install --upgrade pip wheel setuptools

# Install PyTorch
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install python dependencies
RUN pip3 install -r requirements.txt

# Install flash-attn from GitHub releases (pre-built wheels)
RUN pip3 install https://github.com/Dao-AILab/flash-attention/releases/download/v2.5.8/flash_attn-2.5.8+cu122torch2.3cxx11abiFALSE-cp310-cp310-linux_x86_64.whl


# Copy the rest of the application code into the container
COPY . .

# Set metadata about the image
LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi ,"

# Expose port 8000
EXPOSE 8000

# Start both apps on startup
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
 
