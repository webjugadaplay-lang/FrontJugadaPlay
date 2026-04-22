// src/components/ResetPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResetPasswordFormProps {
  locale: "pt-BR" | "es";
  email: string;
  onComplete: () => void;
}

export default function ResetPasswordForm({
  locale,
  email,
  onComplete,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(""); // ✅ NUEVO: campo para código
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    "pt-BR": {
      title: "Nova senha",
      subtitle: "Digite o código e crie uma nova senha",
      code: "Código de verificação",
      password: "Nova senha",
      confirmPassword: "Confirmar senha",
      reset: "Redefinir senha",
      success: "Senha alterada com sucesso!",
    },
    es: {
      title: "Nueva contraseña",
      subtitle: "Ingresa el código y crea una nueva contraseña",
      code: "Código de verificación",
      password: "Nueva contraseña",
      confirmPassword: "Confirmar contraseña",
      reset: "Restablecer contraseña",
      success: "¡Contraseña cambiada con éxito!",
    },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ Enviamos email, newPassword y code
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password, code }),
      });

      if (res.ok) {
        alert(t.success);
        router.push("/login");
        onComplete();
      } else {
        const data = await res.json();
        setError(data.error || "Error al cambiar contraseña");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-yellow-500 mb-2">{t.title}</h2>
      <p className="text-gray-400 mb-6">{t.subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ✅ NUEVO campo para código */}
        <div>
          <label className="block text-yellow-500 mb-2">{t.code}</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 bg-black/50 border border-yellow-500/30 text-white rounded-lg text-center text-2xl tracking-widest"
            placeholder="000000"
            required
          />
        </div>

        <div>
          <label className="block text-yellow-500 mb-2">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-yellow-500/30 text-white rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-yellow-500 mb-2">{t.confirmPassword}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-yellow-500/30 text-white rounded-lg"
            required
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {loading ? "..." : t.reset}
        </button>
      </form>
    </div>
  );
}