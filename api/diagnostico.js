import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    // Honeypot
    if (req.body?.empresa) return res.status(200).json({ ok: true });

    const { nombre, email, problema, cpu, gpu, ram, windows, emulador, driver, juego, tutorial, vulkan, antivirus, descripcion, logs } = req.body;
    if (!nombre || !email || !descripcion) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const html = `
        <h2 style="color:#00e5ff;">🔧 Nuevo Diagnóstico — CaTecnoFan</h2>
        <table style="border-collapse:collapse; width:100%; font-family:sans-serif; font-size:14px;">
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888; width:35%"><b>Problema</b></td><td style="padding:8px; border:1px solid #333;">${problema || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Nombre</b></td><td style="padding:8px; border:1px solid #333;">${nombre}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Email</b></td><td style="padding:8px; border:1px solid #333;">${email}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>CPU</b></td><td style="padding:8px; border:1px solid #333;">${cpu || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>GPU</b></td><td style="padding:8px; border:1px solid #333;">${gpu || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>RAM</b></td><td style="padding:8px; border:1px solid #333;">${ram || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Windows</b></td><td style="padding:8px; border:1px solid #333;">${windows || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Emulador</b></td><td style="padding:8px; border:1px solid #333;">${emulador || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Driver GPU</b></td><td style="padding:8px; border:1px solid #333;">${driver || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Juego</b></td><td style="padding:8px; border:1px solid #333;">${juego || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Archivos del tutorial</b></td><td style="padding:8px; border:1px solid #333;">${tutorial || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Vulkan SDK</b></td><td style="padding:8px; border:1px solid #333;">${vulkan || '—'}</td></tr>
            <tr><td style="padding:8px; border:1px solid #333; background:#111; color:#888;"><b>Antivirus bloqueó algo</b></td><td style="padding:8px; border:1px solid #333;">${antivirus || '—'}</td></tr>
        </table>
        <h3 style="color:#ffff00; margin-top:20px;">Descripción del problema</h3>
        <p style="font-family:sans-serif; background:#111; padding:15px; border-left:4px solid #ffff00;">${descripcion}</p>
        ${logs ? `<h3 style="color:#ff00ff; margin-top:20px;">Logs</h3><pre style="font-family:monospace; background:#111; padding:15px; overflow:auto; font-size:12px; border-left:4px solid #ff00ff;">${logs}</pre>` : ''}
    `;

    try {
        await resend.emails.send({
            from: 'CaTecnoFan Diagnóstico <diagnostico@catecnofan.com>',
            to: 'franciscoponzone93@gmail.com',
            replyTo: email,
            subject: `🔧 Diagnóstico: ${problema || 'Nuevo caso'} — ${nombre}`,
            html
        });
        return res.status(200).json({ ok: true });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al enviar el email' });
    }
}
