"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { translations, type Locale } from "@/messages";
import { detectInitialLocale } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  const t = translations[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validación básica
    if (!email || !email.includes("@")) {
      setError(t.forgotPassword.invalidEmail || "Ingresa un email válido");
      setIsLoading(false);
      return;
    }

    try {
      // Aquí irá la llamada a tu API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Por seguridad, siempre mostramos el mismo mensaje sin importar si el email existe o no
      setIsSubmitted(true);
    } catch (err) {
      setError(t.forgotPassword.error || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Si ya se envió, mostrar mensaje de éxito
  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-black">
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
          <div className="container mx-auto px-6">
            <div className="flex items-center h-20">
              <Link href="/login" className="flex items-center space-x-3 group">
                <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
                <img
                  src="/logo-jugadaplay.svg"
                  alt="Jugada Play"
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </Link>
            </div>
          </div>
        </header>

        <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-8">
              <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {t.forgotPassword.emailSent || "Revisa tu email"}
              </h1>
              <p className="text-gray-400 mb-6">
                {t.forgotPassword.emailSentMessage ||
                  "Si el email está registrado, recibirás un enlace para recuperar tu contraseña."}
              </p>
              <Link
                href="/login"
                className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                {t.forgotPassword.backToLogin || "Volver al inicio de sesión"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/login" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-8">
            <div className="text-center mb-8">
              <Mail className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {t.forgotPassword.title || "¿Olvidaste tu contraseña?"}
              </h1>
              <p className="text-gray-400 text-sm">
                {t.forgotPassword.description ||
                  "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                  {t.forgotPassword.emailLabel || "Email"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/80 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    {t.forgotPassword.sending || "Enviando..."}
                  </span>
                ) : (
                  t.forgotPassword.sendButton || "Enviar enlace"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-gray-400 hover:text-yellow-500 text-sm transition-colors"
              >
                {t.forgotPassword.backToLogin || "← Volver al inicio de sesión"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}