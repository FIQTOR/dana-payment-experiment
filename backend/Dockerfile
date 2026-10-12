# ---- Backend (Express) ----
FROM node:26-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
