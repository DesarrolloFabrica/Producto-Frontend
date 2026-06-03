# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ARG VITE_USE_MOCKS=false
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_AUTH_ENABLED=false
ARG VITE_DEV_EMAIL_LOGIN_ENABLED=false
ARG VITE_INSTITUTIONAL_FLOW_MODE=reduced
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_AUTH_ENABLED=$VITE_GOOGLE_AUTH_ENABLED
ENV VITE_DEV_EMAIL_LOGIN_ENABLED=$VITE_DEV_EMAIL_LOGIN_ENABLED
ENV VITE_INSTITUTIONAL_FLOW_MODE=$VITE_INSTITUTIONAL_FLOW_MODE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server.cjs ./server.cjs

EXPOSE 8080
CMD ["node", "server.cjs"]
