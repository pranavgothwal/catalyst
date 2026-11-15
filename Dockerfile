# Multi-stage hardened production Dockerfile for AlwaysWithYOU
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runner stage - Hardened unprivileged container
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Ensure files belong to node user
RUN chown -R node:node /app

# Switch from root to non-root user
USER node

EXPOSE 8080

CMD ["node", "server/index.js"]
