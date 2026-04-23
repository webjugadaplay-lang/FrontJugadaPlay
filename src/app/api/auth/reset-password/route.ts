// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyResetCode, deleteResetToken } from "@/lib/reset-tokens";

// Simulación de actualización de usuario
async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  // Aquí va tu lógica real de actualización en DB
  console.log(`Actualizando contraseña para ${email}`);
  // Ejemplo: hash de contraseña antes de guardar
  // const hashedPassword = await bcrypt.hash(newPassword, 10);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, code } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email y nueva contraseña requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el código sigue siendo válido
    if (!code) {
      return NextResponse.json(
        { error: "Código de verificación requerido" },
        { status: 400 }
      );
    }

    // ✅ Ahora verifyResetCode espera 2 argumentos (email, code)
    const { valid } = await verifyResetCode(email, code);

    if (!valid) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    // Actualizar contraseña
    const success = await updateUserPassword(email, newPassword);

    if (!success) {
      return NextResponse.json(
        { error: "Error al actualizar la contraseña" },
        { status: 500 }
      );
    }

    // ✅ Eliminar token usado (ahora deleteResetToken existe)
    await deleteResetToken(email);

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}