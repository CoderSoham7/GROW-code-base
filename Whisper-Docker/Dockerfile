# Use NVIDIA's development image for CUDA-enabled containers that includes the full toolkit
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# Install Python 3.11
RUN apt-get update && apt-get install -y python3.11 python3.11-distutils python3.11-venv python3.11-dev
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN apt-get install -y python3-pip
RUN apt-get update && apt-get install -y git
RUN curl https://bootstrap.pypa.io/get-pip.py | python

# Set the working directory to /app
WORKDIR /app

# Copy the requirements.txt file into the container
COPY app/requirements.txt .

# Install ffmpeg for Whisper
RUN apt-get update && apt-get install -y ffmpeg

# Set environment variables for CUDA and library paths
ENV CUDA_HOME /usr/local/cuda
ENV PATH ${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH /usr/local/nvidia/lib:/usr/local/nvidia/lib64

# Install python dependencies
RUN pip3 install -r requirements.txt
RUN pip3 install --no-build-isolation flash-attn

# Copy the rest of the application code into the container
COPY . .

# Set metadata about the image
LABEL version="2.0"
LABEL maintainer="Vinayak, Aditi <Vinayak.Mathur@cognizant.com>,<Aditi.chatterjee@cognizant.com>"

# Expose port 8000
EXPOSE 8000

# Start both apps on startup
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]