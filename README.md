# browser-proxy

A browser inside your browser, without running a browser on the server.

[Rammerhead](https://github.com/binary-person/rammerhead) fetches pages server-side,
rewrites every URL and header, and hands the result back. Your own browser renders it —
full CSS, images, video posters, fonts, 60fps scrolling. Nothing is streamed, nothing is
encoded, no second browser runs.

~100 MB RSS, idle CPU near zero, one port, one container, **plain HTTP works** — no
service worker, so no HTTPS requirement.

```
your browser ──▶ rammerhead (rewrites html/css/js/headers) ──▶ target site
              ◀────────────── rewritten response ─────────────
```

Sites see the **server's** IP, not yours.

## Deploy to Railway (HTTP only)

The app builds every URL it hands back from the **request's own Host header**, so it runs
on whatever host and port you reach it on — no IPs baked in anywhere.

Railway's default domain is HTTPS-only and redirects, which is what broke the page.
Use the **TCP proxy** instead, it is raw TCP with no TLS in front:

1. Service → **Settings → Networking → TCP Proxy → Generate**.
2. Railway prints `something.proxy.rlwy.net` and a port, e.g.
   `shortline.proxy.rlwy.net:41234`.
3. Open `http://shortline.proxy.rlwy.net:41234` — plain HTTP, no redirect.

```bash
railway login && railway init && railway up
```

Optional variable: `RH_PASSWORD` — when set, creating a session requires it.

Because `x-forwarded-proto` is absent on the TCP proxy, the app stays in `http:` mode and
every rewritten link stays on `http://<host>:<port>`. Nothing upgrades to https, so
nothing gets mixed-content-blocked.

## Run locally

```bash
docker build -t browser-proxy .
docker run -d --restart unless-stopped -p 8080:8080 browser-proxy
# http://localhost:8080
```

Open the URL, click **Create new session ID**, paste a link, press **Go!**. The session
keeps its own cookies and logins and survives reconnects — treat the id like a private
incognito profile.

## Verified

Measured on this build, not claimed:

| Target | Result |
| --- | --- |
| `https://example.com/` | 200, 577 B, correct title |
| `https://en.wikipedia.org/wiki/Main_Page` | 200, 266 673 B, full CSS + images rendered |
| `https://news.ycombinator.com/` | 200, 34 472 B, correct title |

## Limits

- Google account sign-in and DRM video (Netflix/Prime) do not work.
- Cross-domain isolation is collapsed to one origin (single-port hosting), so a few sites
  that rely on it misbehave.
- Cloudflare can detect proxied traffic; Rammerhead handles the JS challenge but not every
  site.
- Datacenter IPs get challenged more than residential ones.

If you need a real separate browser (logins, downloads, extensions), that is
`cloud-browser/` (Selkies, 2 GB and an H.264 encode per user) or `cloud-browser-lite/`
(Carbonyl, terminal rendering).

## Files

```
Dockerfile     node:22-slim, clones rammerhead, npm ci + npm run build
config.js      single-port bind, public-host rewriting, 50MB RAM cache
railway.json   DOCKERFILE builder + healthcheck
```

The app is upstream and unmodified — `config.js` is the only override, picked up
automatically by `src/config.js`.
