# Multi-stage Dockerfile for algo-trader
# Build stage: compile TypeScript
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

# Run stage: minimal runtime
FROM node:20-slim

WORKDIR /app

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Default command runs the backtest CLI
CMD ["node", "dist/cli/runBacktest.js", "tests/fixtures/sample_bars.csv"]