# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (only production dependencies first to cache them if needed, but for build we need dev deps)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Staging 
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=development

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/templates ./templates

# Expose the application port
EXPOSE 3030

# Start the application
CMD ["node", "dist/main"]
