// src/components/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";

interface ForgotPasswordFormProps {
  locale: "pt-BR" | "es";
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export default function ForgotPasswordForm({
  locale,
  onBack,
  onCodeSent,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskWarning, setRiskWarning] = useState("");

  const t = {
    "pt-BR": {
      title: "Recuperar senha",
      subtitle: "Enviaremos um código de verificação para seu email",
      email: "Seu email",
      send: "Enviar código",
      back: "Voltar ao login",
      sending: "Enviando...",
      riskWarning: "⚠️ Verificação adicional necessária devido a atividade incomum",
    },
    es: {
      title: "Recuperar contraseña",
      subtitle: "Enviaremos un código de verificación a tu email",
      email: "Tu email",
      send: "Enviar código",
      back: "Volver al login",
      sending: "Enviando...",
      riskWarning: "⚠️ Verificación adicional necesaria debido a actividad inusual",
    },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRiskWarning("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.riskScore >= 60) {
          setRiskWarning(t.riskWarning);
        }
        onCodeSent(email);
      } else {
        setError(data.error || "Error al enviar código");
        if (data.cooldown) {
          setError(`Demasiados intentos. Espera ${data.cooldown} minutos.`);
        }
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
          <label className="block text-yellow-500 mb-2">{t.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-yellow-500/30 text-white rounded-lg"
            required
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        {riskWarning && <div className="text-orange-500 text-sm">{riskWarning}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {loading ? t.sending : t.send}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-400 text-sm hover:text-yellow-500 transition"
        >
          {t.back}
        </button>
      </form>
    </div>
  );
}