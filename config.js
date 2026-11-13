const RammerheadJSMemCache = require('./src/classes/RammerheadJSMemCache.js');

const port = Number(process.env.PORT || 8080);

module.exports = {
    bindingAddress: '0.0.0.0',
    port,

    // A PaaS routes one port. Rammerhead insists on binding a second listener,
    // so it gets port+1 locally, but clients are told below that both live on
    // the public port — cross-domain requests then land on the same origin.
    crossDomainPort: port + 1,

    // Session creation is open. Set RH_PASSWORD to require one.
    password: process.env.RH_PASSWORD || null,

    // Single process, no cluster workers: predictable memory in a container.
    enableWorkers: false,
    workers: 1,

    // 50MB in RAM instead of the default 5GB disk cache, which would grow
    // unbounded on an ephemeral container filesystem.
    jsCache: new RammerheadJSMemCache(50 * 1024 * 1024),

    // Plain HTTP only. The host and port come from the request itself, so this
    // works behind Railway's TCP proxy (`http://host:12345`), behind a local
    // `http://127.0.0.1:8090`, or behind any http reverse proxy. https is used
    // only when something in front explicitly says so.
    getServerInfo: (req) => {
        const proto = String(req.headers['x-forwarded-proto'] || '')
            .split(',')[0]
            .trim()
            .toLowerCase();
        const https = proto === 'https';
        const raw = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost')
            .split(',')[0]
            .trim();

        let hostname = raw;
        let hostPort = 0;
        const colon = raw.lastIndexOf(':');
        if (colon > -1 && /^\d+$/.test(raw.slice(colon + 1))) {
            hostname = raw.slice(0, colon);
            hostPort = Number(raw.slice(colon + 1));
        }

        const publicPort = hostPort || (https ? 443 : 80);
        return {
            hostname,
            port: publicPort,
            crossDomainPort: publicPort,
            protocol: https ? 'https:' : 'http:'
        };
    }
};
