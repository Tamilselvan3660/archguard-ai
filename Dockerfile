# ==============================================================================
# ARCHGUARD AI — PRODUCTION MULTI-STAGE DOCKERFILE
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile client build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev

# Copy application and built client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/sample-ecommerce ./sample-ecommerce

EXPOSE 3001

CMD ["node", "server/index.js"]
