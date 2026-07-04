// api/contacto.js
// Reemplazo de Formspree: recibe el formulario de contacto y lo envía por email usando Resend.

const ALLOWED_ORIGIN = 'https://catecnofan.com';
const DESTINATION_EMAIL = 'franciscoponzone93@gmail.com'; // <-- cambiá esto por tu email real
const FROM_EMAIL = 'CaTecnoFan <onboarding@resend.dev>'; // <-- ver nota en README sobre dominio propio

export default async function handler(req, res) {
  // CORS: solo permitimos que catecnofan.com llame a esta función
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
    const { nombre, email, mensaje, empresa } = req.body || {};

    // Honeypot anti-spam: si el campo oculto "empresa" viene lleno, es un bot
    if (empresa) {
      return res.status(200).json({ ok: true });
    }

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

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
        subject: `Nuevo mensaje de contacto - ${nombre}`,
        html: `
          <h2>Nuevo mensaje desde catecnofan.com</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(mensaje).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Error de Resend:', errData);
      return res.status(502).json({ error: 'No se pudo enviar el email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en /api/contacto:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
