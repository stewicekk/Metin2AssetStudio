# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder

WORKDIR /build
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

COPY frontend/ .
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy server
COPY server/package*.json server/
RUN cd server && npm install --omit=dev

# Copy built frontend
COPY --from=builder /build/dist /app/frontend/dist
COPY --from=builder /build/public/analyze-mse /app/frontend/public/analyze-mse

# Copy server source
COPY server/ server/

# Create projects directory
RUN mkdir -p /app/server/projects

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "src/index.js"]
