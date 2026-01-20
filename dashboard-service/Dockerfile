FROM node:18-alpine

# Install Docker CLI for controlling containers
RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy server.js (not cached - will always get latest)
COPY server.js ./
COPY public ./public

EXPOSE 3000

CMD ["node", "server.js"]