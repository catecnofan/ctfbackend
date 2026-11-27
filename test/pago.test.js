import test from "node:test";
import assert from "node:assert/strict";
import { mismoMonto, montoValido, pagoAcreditado, pagoDevuelto, textoMonto } from "../lib/pago.js";

test("acredita aprobado y procesado", () => {
    assert.equal(pagoAcreditado("APPROVED"), true);
    assert.equal(pagoAcreditado("PROCESSED"), true);
    assert.equal(pagoAcreditado("PROCCESED"), true);
    assert.equal(pagoAcreditado("PENDING"), false);
    assert.equal(pagoAcreditado("REJECTED"), false);
});

test("una devolución no queda paga", () => {
    assert.equal(pagoDevuelto("REFUNDED"), true);
    assert.equal(pagoAcreditado("REFUNDED"), false);
});

test("el monto de cinco dólares entra en el rango de Ualá", () => {
    assert.equal(textoMonto(1625 * 5), "8125.00");
    assert.equal(montoValido("8125.00"), true);
    assert.equal(montoValido(50), false);
    assert.equal(mismoMonto("8125.00", 8125), true);
    assert.equal(mismoMonto("8125.00", 100), false);
});
