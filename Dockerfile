FROM ghcr.io/puppeteer/puppeteer:latest

# Delovna mapa
WORKDIR /app

# Kopiramo SAMO package.json (lockfile odstranimo)
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --omit=dev

# Kopiramo preostale datoteke
COPY . .

# Railway port
ENV PORT=8080

EXPOSE 8080

# Start server.js
CMD ["node", "server.js"]
