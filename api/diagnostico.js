// api/diagnostico.js
// Recibe el formulario de diagnóstico y lo envía por email usando Resend (fetch directo, mismo patrón que contacto.js)

const ALLOWED_ORIGIN = 'https://catecnofan.com';
const DESTINATION_EMAIL = 'franciscoponzone93@gmail.com';
const FROM_EMAIL = 'CaTecnoFan Diagnóstico <onboarding@resend.dev>';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { nombre, email, problema, cpu, gpu, ram, windows, emulador, driver, juego, tutorial, vulkan, antivirus, descripcion, logs, empresa } = req.body || {};

        // Honeypot anti-spam
        if (empresa) {
            return res.status(200).json({ ok: true });
        }

        if (!nombre || !email || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        const html = `
            <div style="background:#ffffff; color:#111111;">
            <h2 style="color:#00e5ff;">🔧 Nuevo Diagnóstico — CaTecnoFan</h2>
            <table style="border-collapse:collapse; width:100%; font-family:sans-serif; font-size:14px;">
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff; width:35%"><b>Problema</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(problema) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Nombre</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(nombre)}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Email</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>CPU</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(cpu) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>GPU</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(gpu) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>RAM</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(ram) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Windows</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(windows) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Emulador</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(emulador) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Driver GPU</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(driver) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Juego</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(juego) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Archivos del tutorial</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(tutorial) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Vulkan SDK</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(vulkan) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#ffffff;"><b>Antivirus bloqueó algo</b></td><td style="padding:8px; border:1px solid #333; background:#ffffff; color:#111111;">${escapeHtml(antivirus) || '—'}</td></tr>
            </table>
            <h3 style="color:#c9a300; margin-top:20px;">Descripción del problema</h3>
            <p style="font-family:sans-serif; background:#f5f5f5; color:#111111; padding:15px; border-left:4px solid #c9a300;">${escapeHtml(descripcion).replace(/\n/g, '<br>')}</p>
            ${logs ? `<h3 style="color:#c800c8; margin-top:20px;">Logs</h3><pre style="font-family:monospace; background:#f5f5f5; color:#111111; padding:15px; overflow:auto; font-size:12px; border-left:4px solid #c800c8;">${escapeHtml(logs)}</pre>` : ''}
            </div>
        `;

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: DESTINATION_EMAIL,
                reply_to: email,
                subject: `🔧 Diagnóstico: ${problema || 'Nuevo caso'} — ${nombre}`,
                html,
            }),
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error('Error de Resend:', errData);
            return res.status(502).json({ error: 'No se pudo enviar el email' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Error en /api/diagnostico:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function escapeHtml(str) {
    if (!str) return str;
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
