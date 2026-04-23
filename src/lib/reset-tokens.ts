// lib/reset-tokens.ts
import crypto from 'crypto';

export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Almacenamiento temporal en memoria (para demo)
// En producción, usa tu base de datos
const resetTokensStore = new Map<string, {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  riskScore?: number;
}>();

// ✅ Exportado correctamente como storeResetToken
export async function storeResetToken(
  email: string,
  codeHash: string,
  expiresAt: number,
  riskScore?: number
): Promise<void> {
  resetTokensStore.set(email.toLowerCase(), {
    codeHash,
    expiresAt,
    attempts: 0,
    riskScore
  });
  
  // Limpiar después de 15 minutos
  setTimeout(() => {
    resetTokensStore.delete(email.toLowerCase());
  }, 15 * 60 * 1000);
}

// ✅ Verificar código (requiere email y inputCode)
export async function verifyResetCode(
  email: string,
  inputCode: string
): Promise<{ valid: boolean; attempts?: number }> {
  const record = resetTokensStore.get(email.toLowerCase());
  
  if (!record) return { valid: false };
  
  if (Date.now() > record.expiresAt) {
    resetTokensStore.delete(email.toLowerCase());
    return { valid: false };
  }
  
  const isValid = record.codeHash === hashCode(inputCode);
  
  if (isValid) {
    record.attempts += 1;
    resetTokensStore.set(email.toLowerCase(), record);
  }
  
  return { valid: isValid, attempts: record.attempts };
}

// ✅ Exportado correctamente como deleteResetToken
export async function deleteResetToken(email: string): Promise<void> {
  resetTokensStore.delete(email.toLowerCase());
}

// ✅ Función auxiliar para obtener token (opcional)
export async function getResetToken(email: string) {
  return resetTokensStore.get(email.toLowerCase());
}