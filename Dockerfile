FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# Kopiramo SAMO package.json
COPY package.json ./

# Namestimo odvisnosti kot pptruser
RUN npm install --omit=dev --legacy-peer-deps

# Skopiramo preostanek projekta
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
