import { montoValido, textoMonto } from "./pago.js";

const AUTH_URL = "https://auth.developers.ar.ua.la/v2/api/auth/token";
const CHECKOUT_URL = "https://checkout.developers.ar.ua.la/v2/api/checkout";
const ORDERS_URL = "https://checkout.developers.ar.ua.la/v2/api/orders";
const DOLAR_URL = "https://dolarapi.com/v1/dolares/oficial";
const USD = 5;

let tokenCache = { valor: "", vence: 0 };

export function credencialesUala() {
    const username = process.env.UALA_USERNAME || "";
    const clientId = process.env.UALA_CLIENT_ID || "";
    const clientSecret = process.env.UALA_CLIENT_SECRET || "";
    if (!username || !clientId || !clientSecret) return null;
    return { username, clientId, clientSecret };
}

export async function cotizarCincoUsd(fetchImpl = fetch) {
    let venta = 1625;
    try {
        const res = await fetchImpl(DOLAR_URL);
        if (res.ok) {
            const data = await res.json();
            const n = Number(data.venta);
            if (Number.isFinite(n) && n > 0) venta = n;
        }
    } catch {
        // Se usa la cotización de respaldo.
    }
    return textoMonto(venta * USD);
}

export async function tokenUala(fetchImpl = fetch) {
    const cred = credencialesUala();
    if (!cred) {
        const error = new Error("Cobro no activo");
        error.status = 503;
        throw error;
    }
    if (tokenCache.valor && tokenCache.vence > Date.now() + 60000) {
        return tokenCache.valor;
    }
    const res = await fetchImpl(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: cred.username,
            client_id: cred.clientId,
            client_secret_id: cred.clientSecret,
            grant_type: "client_credentials"
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        const error = new Error("Ualá no entregó token");
        error.status = 502;
        throw error;
    }
    const vida = Number(data.expires_in) || 3600;
    tokenCache = { valor: data.access_token, vence: Date.now() + vida * 1000 };
    return data.access_token;
}

export async function crearOrdenUala({ uid, monto, avisoUrl, fetchImpl = fetch }) {
    if (!montoValido(monto)) {
        const error = new Error("Monto inválido");
        error.status = 500;
        throw error;
    }
    const token = await tokenUala(fetchImpl);
    const res = await fetchImpl(CHECKOUT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            amount: textoMonto(monto),
            description: "Acceso a archivos exclusivos CaTecnoFan",
            callback_success: "https://catecnofan.com/exclusivo.html?pago=ok",
            callback_fail: "https://catecnofan.com/exclusivo.html?pago=error",
            notification_url: avisoUrl,
            external_reference: uid
        })
    });
    const data = await res.json().catch(() => ({}));
    const link = data?.links?.checkout_link;
    if (!res.ok || !data.uuid || !link) {
        const error = new Error("Ualá no creó la orden");
        error.status = 502;
        throw error;
    }
    return { uuid: data.uuid, link, monto: textoMonto(monto) };
}

export async function leerOrdenUala(uuid, fetchImpl = fetch) {
    const token = await tokenUala(fetchImpl);
    const res = await fetchImpl(`${ORDERS_URL}/${encodeURIComponent(uuid)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.uuid) {
        const error = new Error("Ualá no devolvió la orden");
        error.status = 502;
        throw error;
    }
    return data;
}
