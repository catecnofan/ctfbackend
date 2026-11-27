import { dbAdmin } from "../lib/firebase.js";
import { leerOrdenUala } from "../lib/uala.js";
import { mismoMonto, pagoAcreditado, pagoDevuelto } from "../lib/pago.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }
    const uuid = req.body?.uuid;
    if (!uuid) {
        return res.status(200).json({ ok: true });
    }
    try {
        const db = dbAdmin();
        const guardada = await db.collection("exclusivo_ordenes").doc(uuid).get();
        if (!guardada.exists) {
            return res.status(500).json({ error: "Orden desconocida" });
        }
        const local = guardada.data();
        const orden = await leerOrdenUala(uuid);
        if (orden.external_reference !== local.uid || !mismoMonto(orden.amount, local.monto)) {
            await guardada.ref.set({ estado: "RECHAZADA", revisado: new Date().toISOString() }, { merge: true });
            return res.status(200).json({ ok: true });
        }
        const acceso = db.collection("exclusivo_acceso").doc(local.uid);
        if (pagoAcreditado(orden.status)) {
            await acceso.set({
                pagado: true,
                uid: local.uid,
                orden: uuid,
                monto: local.monto,
                medio: "uala",
                actualizado: new Date().toISOString()
            });
            await guardada.ref.set({ estado: orden.status, revisado: new Date().toISOString() }, { merge: true });
        } else if (pagoDevuelto(orden.status)) {
            await acceso.set({
                pagado: false,
                uid: local.uid,
                orden: uuid,
                medio: "uala",
                actualizado: new Date().toISOString()
            }, { merge: true });
            await guardada.ref.set({ estado: orden.status, revisado: new Date().toISOString() }, { merge: true });
        } else {
            await guardada.ref.set({ estado: orden.status || "PENDING", revisado: new Date().toISOString() }, { merge: true });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("exclusivo-aviso:", err.message);
        return res.status(500).json({ error: "Reintento" });
    }
}
