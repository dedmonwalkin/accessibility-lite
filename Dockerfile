# node:20-alpine — pin by digest before shipping a release tag. Example:
#   FROM node:20-alpine@sha256:<digest>
# Floating tags are accepted here during development only.
FROM node:20-alpine

RUN apk add --no-cache ffmpeg tini

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ src/
COPY README.md LIMITATIONS.md COOKIES.md PRIVACY.md SECURITY.md ./

# Run as a non-root user. If an attacker ever achieves RCE via ffmpeg or
# Node, they do not have container root and cannot escalate to write
# outside the uploads volume.
RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p uploads \
 && chown -R app:app /app uploads

USER app

EXPOSE 3000

# tini is PID 1 so SIGTERM / SIGINT reach Node for graceful shutdown.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
