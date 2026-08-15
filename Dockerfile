FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ src/
# Fonts and the OG image are served at /static/* — without this the redesign
# silently falls back to system fonts and link previews come back blank.
COPY public/ public/

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/server.js"]
