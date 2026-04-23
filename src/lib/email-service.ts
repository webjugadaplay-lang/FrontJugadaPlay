// lib/email-service.ts
import nodemailer from 'nodemailer';

// Configuración (usa variables de entorno)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendResetCode(
  toEmail: string,
  code: string,
  locale: 'pt-BR' | 'es'
): Promise<void> {
  const subjects = {
    'pt-BR': '🔐 Código de recuperação - Jugada Play',
    'es': '🔐 Código de recuperación - Jugada Play',
  };
  
  const bodies = {
    'pt-BR': `
      <h1>Recuperação de senha</h1>
      <p>Seu código de verificação é:</p>
      <h2 style="font-size: 32px; letter-spacing: 5px;">${code}</h2>
      <p>Este código expira em 15 minutos.</p>
      <p>Se não solicitou, ignore este email.</p>
    `,
    'es': `
      <h1>Recuperación de contraseña</h1>
      <p>Tu código de verificación es:</p>
      <h2 style="font-size: 32px; letter-spacing: 5px;">${code}</h2>
      <p>Este código expira en 15 minutos.</p>
      <p>Si no lo solicitaste, ignora este email.</p>
    `,
  };
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: subjects[locale],
    html: bodies[locale],
  });
}