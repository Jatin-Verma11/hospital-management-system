# Production Multi-Stage Dockerfile for MedCore HMS Full-Stack
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native SQLite3 if needed
RUN apk add --no-cache python3 make g++

# Copy server package definitions
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --omit=dev

# Copy application source code and public frontend assets
WORKDIR /app
COPY server ./server

# Expose dynamic application port
ENV PORT=5001
EXPOSE 5001

# Working directory for execution
WORKDIR /app/server

# Startup script: automatically seed if database is new, then launch server
CMD ["sh", "-c", "node db/seed.js && node index.js"]
