// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { detectSuspiciousBehavior, logRecoveryAttempt } from "@/lib/ai-risk-detection";
import { generateResetCode, hashCode, storeResetToken } from "@/lib/reset-tokens";
import { sendResetCode } from "@/lib/email-service";

// Simulación de usuarios (reemplaza con tu base de datos)
const mockUsers = [
  { email: "test@example.com", password: "123456" },
  // Agrega más usuarios para pruebas
];

export async function POST(req: NextRequest) {
  try {
    const { email, locale = "pt-BR" } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // ✅ Corregido: Tipamos explícitamente recentAttempts como array vacío
    const recentAttempts: Array<{ ip: string; email: string; timestamp: number; success: boolean }> = [];
    
    // Aquí en producción cargarías desde tu DB:
    // const recentAttempts = await db.recoveryAttempt.findMany({ ... });

    // 2. Evaluar riesgo con IA
    const risk = detectSuspiciousBehavior(ip, email, recentAttempts);

    // 3. Si riesgo muy alto, bloquear
    if (risk.riskScore >= 80) {
      await logRecoveryAttempt(null, ip, email, false);
      return NextResponse.json(
        {
          error: "Demasiados intentos. Espera 15 minutos.",
          cooldown: risk.cooldownMinutes,
        },
        { status: 429 }
      );
    }

    // 4. Verificar si el email existe
    const userExists = mockUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      // Por seguridad, no revelamos si existe
      await logRecoveryAttempt(null, ip, email, false);
      return NextResponse.json({
        message: "Si el email existe, recibirás un código",
      });
    }

    // 5. Generar código y guardar
    const code = generateResetCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    await storeResetToken(email, hashCode(code), expiresAt, risk.riskScore);

    // 6. Enviar email
    await sendResetCode(email, code, locale);

    // 7. Loggear intento exitoso
    await logRecoveryAttempt(null, ip, email, true);

    return NextResponse.json({
      message: "Código enviado",
      riskScore: risk.riskScore,
      requiresChallenge: risk.requiresAdditionalChallenge,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}