// src/app/login/LoginForm.tsx (MODIFICADO)
"use client";

import { useState } from "react";

interface LoginFormProps {
  locale: "pt-BR" | "es";
  onForgotPassword: () => void; // NUEVO: callback
}

export default function LoginForm({ locale, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = {
    "pt-BR": {
      email: "Email",
      password: "Senha",
      login: "Entrar",
      forgot: "Esqueceu sua senha?",
      loading: "Entrando...",
    },
    es: {
      email: "Correo electrónico",
      password: "Contraseña",
      login: "Iniciar sesión",
      forgot: "¿Olvidaste tu contraseña?",
      loading: "Iniciando sesión...",
    },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Aquí va tu lógica de login existente
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
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

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
      >
        {loading ? t.loading : t.login}
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-yellow-500/80 text-sm hover:text-yellow-500 transition"
      >
        {t.forgot}
      </button>
    </form>
  );
}