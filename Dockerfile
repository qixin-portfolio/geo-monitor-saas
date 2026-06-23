ARG BASE_IMAGE=docker.m.daocloud.io/library/node:20-alpine

FROM ${BASE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/geo_monitor?schema=public"
RUN npm ci

FROM ${BASE_IMAGE} AS builder
WORKDIR /app
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
ARG NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_starter
ARG NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro
ARG NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_agency
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/geo_monitor?schema=public"
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=${NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID}
ENV NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=${NEXT_PUBLIC_STRIPE_PRO_PRICE_ID}
ENV NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=${NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${BASE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=deps /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
