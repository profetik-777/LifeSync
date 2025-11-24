# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend and backend)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including drizzle-kit for migrations)
# Note: We need devDependencies because drizzle-kit is required for db:push
RUN npm ci

# Copy necessary runtime files
COPY shared ./shared
COPY drizzle.config.ts ./
COPY attached_assets ./attached_assets

# Copy built assets from builder stage (MUST be LAST to avoid overwriting)
# This includes both dist/public (frontend) and dist/index.js (backend)
COPY --from=builder /app/dist ./dist

# Expose port 5000 (the port the app runs on)
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
