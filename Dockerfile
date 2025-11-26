# === BASE IMAGE (Puppeteer-ready Chromium) ===
FROM ghcr.io/puppeteer/puppeteer:latest

# WORKDIR znotraj kontejnerja
WORKDIR /app

# Kopiramo manifest prej, da se cache ne lomi
COPY manifest.json ./manifest.json

# Kopiramo package.json in package-lock.json,
# potem npm install kot root (podatki se ne smejo pisati nazaj v container)
COPY package.json package-lock.json ./

RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Kopiramo preostale datoteke
COPY . .

# Railway bo uporabil PORT environment variable
EXPOSE 3000

CMD ["node", "server.js"]
