#!/bin/bash

# Build the frontend
cd Frontend
npm run build

# Return to parent directory and start development server
cd ..
npm run dev