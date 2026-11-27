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

export function textoMonto(pesos) {
    const n = Math.round(Number(pesos) * 100) / 100;
    if (!montoValido(n)) {
        throw new Error("Monto fuera de rango");
    }
    return n.toFixed(2);
}
