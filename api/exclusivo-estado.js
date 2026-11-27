import { cors, errorHttp } from "../lib/http.js";
import { usuarioDeToken, dbAdmin } from "../lib/firebase.js";

function archivoPublicable(data) {
    const url = String(data.url || "");
    if (!url.startsWith("https://")) return null;
    return {
        titulo: String(data.titulo || "Archivo"),
        detalle: String(data.detalle || ""),
        url
    };
}

export default async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }
    try {
        const usuario = await usuarioDeToken(req.headers.authorization);
        const db = dbAdmin();
        const acceso = await db.collection("exclusivo_acceso").doc(usuario.uid).get();
        const pagado = acceso.exists && acceso.data().pagado === true;
        if (!pagado) {
            return res.status(200).json({ pagado: false, archivos: [] });
        }
        const snap = await db.collection("exclusivo_archivos").get();
        const archivos = snap.docs
            .map((doc) => archivoPublicable(doc.data() || {}))
            .filter(Boolean);
        return res.status(200).json({ pagado: true, archivos });
    } catch (err) {
        console.error("exclusivo-estado:", err.message);
        return errorHttp(res, err);
    }
}
