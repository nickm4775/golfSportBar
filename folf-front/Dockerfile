FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.ts ./
COPY --from=builder /app/dist ./dist

ENV VITE_PORT=5173
ENV VITE_API_PROXY_TARGET=http://backend:3000
ENV VITE_CENTRIFUGO_PROXY_TARGET=http://centrifugo:8000

EXPOSE 5173

CMD ["npm", "run", "preview"]
