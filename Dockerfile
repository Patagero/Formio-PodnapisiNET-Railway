FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# COPY manifest first
COPY manifest.json ./manifest.json

# ONLY package.json (NO package-lock)
COPY package.json ./

RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy project files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
