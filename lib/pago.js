export function pagoAcreditado(status) {
    const s = String(status || "").toUpperCase();
    return s === "APPROVED" || s === "PROCESSED" || s === "PROCCESED";
}

export function pagoDevuelto(status) {
    return String(status || "").toUpperCase() === "REFUNDED";
}

export function montoValido(valor) {
    const n = Number(valor);
    return Number.isFinite(n) && n >= 100 && n <= 9999999;
}

export function mismoMonto(a, b) {
    const x = Number(a);
    const y = Number(b);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 0.011;
}

export function paypalCobrado(order, uidEsperado) {
    const unidad = order?.purchase_units?.[0] || {};
    const captura = unidad.payments?.captures?.[0];
    const valor = Number(captura?.amount?.value ?? unidad.amount?.value);
    const moneda = captura?.amount?.currency_code || unidad.amount?.currency_code;
    const estado = captura?.status || order?.status;
    return unidad.custom_id === uidEsperado && moneda === "USD" && valor === 5 && estado === "COMPLETED";
}

export function textoMonto(pesos) {
    const n = Math.round(Number(pesos) * 100) / 100;
    if (!montoValido(n)) {
        throw new Error("Monto fuera de rango");
    }
    return n.toFixed(2);
}
