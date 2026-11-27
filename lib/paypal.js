import { paypalCobrado } from "./pago.js";

const BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";
let tokenCache = { valor: "", vence: 0 };

function credenciales() {
    const id = process.env.PAYPAL_CLIENT_ID || "";
    const secret = process.env.PAYPAL_CLIENT_SECRET || "";
    if (!id || !secret) return null;
    return { id, secret };
}

async function tokenPaypal(fetchImpl) {
    const cred = credenciales();
    if (!cred) {
        const error = new Error("PayPal no activo");
        error.status = 503;
        throw error;
    }
    if (tokenCache.valor && tokenCache.vence > Date.now() + 60000) return tokenCache.valor;
    const res = await fetchImpl(`${BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${cred.id}:${cred.secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        const error = new Error("PayPal no entregó token");
        error.status = 502;
        throw error;
    }
    tokenCache = { valor: data.access_token, vence: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
    return data.access_token;
}

export async function crearOrdenPaypal({ uid, fetchImpl = fetch }) {
    const token = await tokenPaypal(fetchImpl);
    const res = await fetchImpl(`${BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
                custom_id: uid,
                description: "Acceso a archivos exclusivos CaTecnoFan",
                amount: { currency_code: "USD", value: "5.00" }
            }],
            application_context: {
                brand_name: "CaTecnoFan",
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
                return_url: "https://catecnofan.com/exclusivo.html?pago=paypal",
                cancel_url: "https://catecnofan.com/exclusivo.html?pago=cancelado"
            }
        })
    });
    const data = await res.json().catch(() => ({}));
    const link = (data.links || []).find((item) => item.rel === "approve")?.href;
    if (!res.ok || !data.id || !link) {
        const error = new Error("PayPal no creó la orden");
        error.status = 502;
        throw error;
    }
    return { id: data.id, link };
}

export async function capturarOrdenPaypal(orderId, uid, fetchImpl = fetch) {
    const token = await tokenPaypal(fetchImpl);
    const res = await fetchImpl(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    let data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const consulta = await fetchImpl(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await consulta.json().catch(() => ({}));
    }
    if (!paypalCobrado(data, uid)) {
        const error = new Error("PayPal no confirmó el pago");
        error.status = 402;
        throw error;
    }
    return data;
}
