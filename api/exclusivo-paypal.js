import { cors, errorHttp } from "../lib/http.js";
import { usuarioDeToken, dbAdmin } from "../lib/firebase.js";
import { capturarOrdenPaypal, crearOrdenPaypal } from "../lib/paypal.js";

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
        const orderId = req.body?.orderId;
        if (orderId) {
            await capturarOrdenPaypal(orderId, usuario.uid);
            await db.collection("exclusivo_acceso").doc(usuario.uid).set({
                pagado: true,
                uid: usuario.uid,
                orden: orderId,
                monto: "5.00",
                medio: "paypal",
                actualizado: new Date().toISOString()
            });
            await db.collection("exclusivo_ordenes").doc(orderId).set({
                uid: usuario.uid,
                monto: "5.00",
                medio: "paypal",
                estado: "COMPLETED",
                revisado: new Date().toISOString()
            }, { merge: true });
            return res.status(200).json({ pagado: true });
        }
        const orden = await crearOrdenPaypal({ uid: usuario.uid });
        await db.collection("exclusivo_ordenes").doc(orden.id).set({
            uid: usuario.uid,
            monto: "5.00",
            medio: "paypal",
            estado: "PENDING",
            creado: new Date().toISOString()
        });
        return res.status(200).json({ pagado: false, checkout: orden.link });
    } catch (err) {
        console.error("exclusivo-paypal:", err.message);
        return errorHttp(res, err);
    }
}
