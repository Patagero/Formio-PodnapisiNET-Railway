FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
