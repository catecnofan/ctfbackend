import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function credencial() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function firebaseListo() {
    return Boolean(credencial());
}

function appAdmin() {
    const existente = getApps()[0];
    if (existente) return existente;
    const serviceAccount = credencial();
    if (!serviceAccount) {
        const error = new Error("Cobro no activo");
        error.status = 503;
        throw error;
    }
    return initializeApp({ credential: cert(serviceAccount) });
}

export function authAdmin() {
    appAdmin();
    return getAuth();
}

export function dbAdmin() {
    appAdmin();
    return getFirestore();
}

export async function usuarioDeToken(header) {
    const valor = String(header || "");
    const match = valor.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        const error = new Error("Tenés que entrar con tu cuenta");
        error.status = 401;
        throw error;
    }
    try {
        return await authAdmin().verifyIdToken(match[1].trim());
    } catch {
        const error = new Error("La sesión no es válida");
        error.status = 401;
        throw error;
    }
}
