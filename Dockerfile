# Rammerhead: a server-side rewriting proxy. No Chromium, no X11, no encoder,
# no service worker. The visitor's own browser renders the page at full quality;
# this box only fetches, rewrites and relays. ~100MB RSS, idle CPU near zero.
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone --depth 1 https://github.com/binary-person/rammerhead /app \
 && npm ci --ignore-scripts --no-audit --no-fund \
 && npm run build \
 && rm -rf /app/.git

COPY config.js /app/config.js

EXPOSE 8080
CMD ["node", "src/server.js"]
