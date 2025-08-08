# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat netcat-openbsd curl
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using npm (more reliable for Docker builds)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_BUILD_STATIC_GENERATION=true
ENV POSTGRES_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder
ENV STRIPE_SECRET_KEY=sk_test_placeholder_for_build_only
ENV STRIPE_WEBHOOK_SECRET=whsec_placeholder_for_build_only
ENV AUTH_SECRET=placeholder_auth_secret_minimum_32_chars
ENV OPENAI_API_KEY=sk-placeholder
ENV ANTHROPIC_API_KEY=sk-ant-placeholder
ENV ALIBABA_CLOUD_ACCESS_KEY_ID=placeholder
ENV ALIBABA_CLOUD_ACCESS_KEY_SECRET=placeholder
ENV BAILIAN_WORKSPACE_ID=placeholder
ENV BAILIAN_INDEX_ID=placeholder

# Build the application (with static generation disabled for problematic routes)
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache netcat-openbsd curl bash

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy wait script
COPY --chown=nextjs:nodejs scripts/wait-for-services.sh ./scripts/wait-for-services.sh
RUN chmod +x ./scripts/wait-for-services.sh

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database migration files (not traced by Next.js standalone)
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the application with service wait
CMD ["./scripts/wait-for-services.sh", "node", "server.js"]