FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# Copy manifest separately (cache optimization)
COPY manifest.json ./manifest.json

# Copy package files
COPY package.json package-lock.json ./

# Install production deps
RUN npm install --omit=dev --legacy-peer-deps

# Copy full project
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
