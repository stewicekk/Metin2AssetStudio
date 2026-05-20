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

COPY server/package*.json server/
RUN cd server && npm install --omit=dev

COPY --from=builder /build/dist /app/frontend/dist
COPY --from=builder /build/fixtures /app/frontend/fixtures

COPY server/ server/

RUN mkdir -p /app/server/projects

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "src/index.js"]
