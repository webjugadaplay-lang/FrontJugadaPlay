// src/components/VerifyCodeForm.tsx
"use client";

import { useState } from "react";

interface VerifyCodeFormProps {
  locale: "pt-BR" | "es";
  email: string;
  onBack: () => void;
  onVerified: (email: string) => void;
}

export default function VerifyCodeForm({
  locale,
  email,
  onBack,
  onVerified,
}: VerifyCodeFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    "pt-BR": {
      title: "Verificar código",
      subtitle: `Enviamos um código para ${email}`,
      code: "Código de 6 dígitos",
      verify: "Verificar",
      back: "Voltar",
      resend: "Reenviar código",
      checking: "Verificando...",
    },
    es: {
      title: "Verificar código",
      subtitle: `Enviamos un código a ${email}`,
      code: "Código de 6 dígitos",
      verify: "Verificar",
      back: "Volver",
      resend: "Reenviar código",
      checking: "Verificando...",
    },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        onVerified(email);
      } else {
        const data = await res.json();
        setError(data.error || "Código inválido o expirado");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, resend: true }),
      });

      if (res.ok) {
        alert(t.resend);
      } else {
        setError("Error al reenviar el código");
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

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {loading ? t.checking : t.verify}
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 text-gray-400 text-sm hover:text-yellow-500 transition"
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={handleResend}
            className="flex-1 text-yellow-500 text-sm hover:text-yellow-400 transition"
          >
            {t.resend}
          </button>
        </div>
      </form>
    </div>
  );
}