import { cors, errorHttp } from "../lib/http.js";
import { usuarioDeToken, dbAdmin } from "../lib/firebase.js";
import { cotizarCincoUsd, crearOrdenUala } from "../lib/uala.js";

export default async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }
    try {
        const usuario = await usuarioDeToken(req.headers.authorization);
        const db = dbAdmin();
        const acceso = await db.collection("exclusivo_acceso").doc(usuario.uid).get();
        if (acceso.exists && acceso.data().pagado === true) {
            return res.status(200).json({ pagado: true });
        }
        const monto = await cotizarCincoUsd();
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        const proto = req.headers["x-forwarded-proto"] || "https";
        const avisoUrl = `${proto}://${host}/api/exclusivo-aviso`;
        const orden = await crearOrdenUala({ uid: usuario.uid, monto, avisoUrl });
        await db.collection("exclusivo_ordenes").doc(orden.uuid).set({
            uid: usuario.uid,
            monto: orden.monto,
            estado: "PENDING",
            creado: new Date().toISOString()
        });
        return res.status(200).json({ pagado: false, checkout: orden.link });
    } catch (err) {
        console.error("exclusivo-cobro:", err.message);
        return errorHttp(res, err);
    }
}
