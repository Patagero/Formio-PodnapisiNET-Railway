FROM ghcr.io/puppeteer/puppeteer:latest

# Railway dela kot user pptruser, ta user nima write perm na /app

WORKDIR /app

# SAMO package.json, BREZ package-lock.json!!!!
COPY package.json ./

# Namestimo odvisnosti brez zapisovanja lockfile
RUN npm install --omit=dev --no-package-lock --legacy-peer-deps

# Kopiramo ostalo
COPY . .

CMD ["node", "server.js"]
