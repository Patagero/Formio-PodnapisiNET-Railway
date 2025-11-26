FROM ghcr.io/puppeteer/puppeteer:latest

# Delovni direktorij
WORKDIR /app

# Kopiramo package datoteke
COPY package.json package-lock.json ./

# Namestimo odvisnosti
RUN npm install --omit=dev --legacy-peer-deps

# Kopiramo celoten projekt
COPY . .

# Puppeteer fix – omogoči zagon Chromium v Railway okolju
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expose port (Railway ga ignorira, a dobro za lokalno)
EXPOSE 3000

# Start aplikacije
CMD ["node", "server.js"]
