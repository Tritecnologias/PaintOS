# Multi-stage build for PaintOS React SPA
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full application code
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy built distribution from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and dual port listening
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3006 (requested) and port 80 (standard HTTP)
EXPOSE 3006 80

CMD ["nginx", "-g", "daemon off;"]

