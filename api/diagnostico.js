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
            <h2 style="color:#00e5ff;">🔧 Nuevo Diagnóstico — CaTecnoFan</h2>
            <table style="border-collapse:collapse; width:100%; font-family:sans-serif; font-size:14px;">
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888; width:35%"><b>Problema</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(problema) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Nombre</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(nombre)}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Email</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>CPU</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(cpu) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>GPU</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(gpu) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>RAM</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(ram) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Windows</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(windows) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Emulador</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(emulador) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Driver GPU</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(driver) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Juego</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(juego) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Archivos del tutorial</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(tutorial) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Vulkan SDK</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(vulkan) || '—'}</td></tr>
                <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Antivirus bloqueó algo</b></td><td style="padding:8px; border:1px solid #333;">${escapeHtml(antivirus) || '—'}</td></tr>
            </table>
            <h3 style="color:#ffff00; margin-top:20px;">Descripción del problema</h3>
            <p style="font-family:sans-serif; background:#111; padding:15px; border-left:4px solid #ffff00;">${escapeHtml(descripcion).replace(/\n/g, '<br>')}</p>
            ${logs ? `<h3 style="color:#ff00ff; margin-top:20px;">Logs</h3><pre style="font-family:monospace; background:#111; padding:15px; overflow:auto; font-size:12px; border-left:4px solid #ff00ff;">${escapeHtml(logs)}</pre>` : ''}
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
