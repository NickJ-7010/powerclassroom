FROM ghcr.io/puppeteer/puppeteer:20.1.2

ENV PUPPETEER_SKIP_CHOMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "index.js" ]