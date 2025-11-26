FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy project files
COPY . .

# Expose port for Railway
EXPOSE 3000

# Start server.js
CMD ["node", "server.js"]
