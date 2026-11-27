const ORIGENES = new Set([
    "https://catecnofan.com",
    "https://www.catecnofan.com"
]);

export function origenPermitido(origen) {
    if (ORIGENES.has(origen)) return origen;
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origen || "")) return origen;
    return "";
}

export function cors(req, res) {
    const permitido = origenPermitido(req.headers.origin || "");
    if (permitido) {
        res.setHeader("Access-Control-Allow-Origin", permitido);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return true;
    }
    return false;
}

export function errorHttp(res, err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Error interno" });
}
