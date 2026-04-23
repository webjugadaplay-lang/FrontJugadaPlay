// src/app/api/auth/verify-reset-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyResetCode } from "@/lib/reset-tokens";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email y código requeridos" },
        { status: 400 }
      );
    }

    // ✅ Ahora verifyResetCode espera 2 argumentos (email, inputCode)
    const { valid, attempts } = await verifyResetCode(email, code);

    if (!valid) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      attempts,
      message: "Código verificado correctamente",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}