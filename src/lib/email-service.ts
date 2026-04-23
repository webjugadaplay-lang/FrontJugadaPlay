// lib/email-service.ts
import { Resend } from 'resend';

// Inicializar Resend solo si hay API key
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendResetCode(
  toEmail: string,
  code: string,
  locale: 'pt-BR' | 'es'
): Promise<void> {
  // En desarrollo, mostrar en consola (fallback)
  if (process.env.NODE_ENV === 'development' && !resend) {
    console.log(`
  ════════════════════════════════════════════════════
  📧 CÓDIGO DE RECUPERACIÓN (SIMULADO - Sin Resend)
  Para: ${toEmail}
  Código: ${code}
  Idioma: ${locale}
  ════════════════════════════════════════════════════
    `);
    return;
  }

  // Si no hay Resend configurado, error controlado
  if (!resend) {
    console.error('❌ Resend no configurado. Agrega RESEND_API_KEY en .env.local');
    console.log(`📧 [FALLBACK] Código para ${toEmail}: ${code}`);
    return;
  }

  // Enviar email real con Resend
  try {
    const { data, error } = await resend.emails.send({
      from: 'Jugada Play <onboarding@resend.dev>', // Cambia después por tu dominio
      to: [toEmail],
      subject: locale === 'pt-BR' ? '🔐 Código de recuperação - Jugada Play' : '🔐 Código de recuperación - Jugada Play',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de senha</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 28px; font-weight: bold; color: #eab308; }
            .code { 
              font-size: 36px; 
              letter-spacing: 8px; 
              text-align: center;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
              font-weight: bold;
              color: #eab308;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎮 Jugada Play</div>
            </div>
            <h2>${locale === 'pt-BR' ? 'Recuperação de senha' : 'Recuperación de contraseña'}</h2>
            <p>${locale === 'pt-BR' ? 'Você solicitou a recuperação da sua senha. Use o código abaixo:' : 'Solicitaste la recuperación de tu contraseña. Usa el código a continuación:'}</p>
            <div class="code">${code}</div>
            <p>${locale === 'pt-BR' ? 'Este código expira em 15 minutos.' : 'Este código expira en 15 minutos.'}</p>
            <p>${locale === 'pt-BR' ? 'Se você não solicitou este código, ignore este email.' : 'Si no solicitaste este código, ignora este email.'}</p>
            <div class="footer">
              <p>Jugada Play - © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error(error.message);
    }

    console.log(`✅ Email enviado para ${toEmail} - ID: ${data?.id}`);
  } catch (error) {
    console.error('❌ Error en sendResetCode:', error);
    // No lanzamos error para no romper el flujo, pero logueamos
  }
}