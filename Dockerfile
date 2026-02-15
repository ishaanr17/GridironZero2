# Stage 1: build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: backend + serve frontend
FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ ./
RUN npm run build
COPY --from=frontend /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
