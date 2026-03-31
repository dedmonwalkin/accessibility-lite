FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ src/

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/server.js"]
