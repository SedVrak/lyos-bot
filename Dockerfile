FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || true

# Install all deps for build
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
