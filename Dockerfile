FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev --legacy-peer-deps

COPY . .

CMD ["node", "server.js"]
