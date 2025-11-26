FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# 1) Copy ONLY package.json first
COPY package.json ./

# 2) Install deps
RUN npm install --omit=dev --legacy-peer-deps

# 3) Now copy EVERYTHING (including manifest.json)
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
