FROM oven/bun:1.3.4-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.4-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/uploads/memories

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/scripts/start-prod.ts ./scripts/start-prod.ts
COPY --from=build /app/uploads ./uploads

RUN mkdir -p /app/data /app/uploads/memories

EXPOSE 3000

CMD ["bun", "run", "start:prod"]
