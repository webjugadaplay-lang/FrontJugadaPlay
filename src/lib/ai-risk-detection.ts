// lib/ai-risk-detection.ts

export interface AttemptLog {
  ip: string;
  email: string;
  timestamp: number;
  success: boolean;
}

export interface RiskDecision {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  requiresAdditionalChallenge: boolean;
  reason: string;
  cooldownMinutes?: number;
}

/**
 * Detección de comportamiento sospechoso sin APIs externas
 * Usa heurísticas + scoring
 */
export function detectSuspiciousBehavior(
  currentIP: string,
  email: string,
  recentAttempts: AttemptLog[]
): RiskDecision {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;
  
  // Filtrar intentos recientes (última hora)
  const lastHourAttempts = recentAttempts.filter(
    a => now - a.timestamp < ONE_HOUR
  );
  
  // Intentos específicos para este email
  const attemptsForThisEmail = lastHourAttempts.filter(
    a => a.email.toLowerCase() === email.toLowerCase()
  );
  
  // Intentos desde esta IP (cualquier email)
  const attemptsFromThisIP = lastHourAttempts.filter(
    a => a.ip === currentIP
  );
  
  let riskScore = 0;
  const reasons: string[] = [];
  
  // Regla 1: Demasiados intentos para el mismo email (fuerza bruta)
  if (attemptsForThisEmail.length >= 5) {
    riskScore += 40;
    reasons.push(`Demasiados intentos para ${email} (${attemptsForThisEmail.length} en 1h)`);
  } else if (attemptsForThisEmail.length >= 3) {
    riskScore += 20;
    reasons.push(`Múltiples intentos para ${email}`);
  }
  
  // Regla 2: Muchos intentos desde misma IP (posible ataque DDoS)
  if (attemptsFromThisIP.length >= 10) {
    riskScore += 35;
    reasons.push(`Alta frecuencia desde IP ${currentIP} (${attemptsFromThisIP.length} intentos)`);
  } else if (attemptsFromThisIP.length >= 5) {
    riskScore += 15;
    reasons.push(`Actividad inusual desde tu IP`);
  }
  
  // Regla 3: Patrón de fallos consecutivos sin éxito
  const consecutiveFails = recentAttempts
    .slice(0, 10)
    .every(a => !a.success && a.email.toLowerCase() === email.toLowerCase());
  
  if (consecutiveFails && attemptsForThisEmail.length >= 3) {
    riskScore += 25;
    reasons.push(`Múltiples fallos consecutivos sin éxito`);
  }
  
  // Regla 4: Velocidad de peticiones (timestamp diferencia)
  if (attemptsForThisEmail.length >= 2) {
    const times = attemptsForThisEmail.map(a => a.timestamp).sort();
    const avgGap = (times[times.length - 1] - times[0]) / (times.length - 1);
    if (avgGap < 5000) { // menos de 5 segundos entre intentos
      riskScore += 20;
      reasons.push(`Velocidad de peticiones anormalmente alta`);
    }
  }
  
  // Decisión final
  const isSuspicious = riskScore >= 40;
  const requiresAdditionalChallenge = riskScore >= 60;
  
  return {
    isSuspicious,
    riskScore: Math.min(riskScore, 100),
    requiresAdditionalChallenge,
    reason: reasons.join(", ") || "Comportamiento normal",
    cooldownMinutes: isSuspicious ? 15 : undefined
  };
}

/**
 * Guarda un intento en tu base de datos (llamar desde API)
 */
export async function logRecoveryAttempt(
  db: any, // tu instancia de base de datos
  ip: string,
  email: string,
  success: boolean
): Promise<void> {
  // Ejemplo con Prisma, ajusta a tu ORM
  // await db.recoveryAttempt.create({
  //   data: {
  //     ip,
  //     email,
  //     success,
  //     timestamp: new Date()
  //   }
  // });
  
  console.log(`[SECURITY LOG] IP:${ip} Email:${email} Success:${success}`);
}