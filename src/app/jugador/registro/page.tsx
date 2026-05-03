// app/jugador/registro/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { translations, type Locale } from "@/messages";
import { detectInitialLocale } from "@/lib/i18n";
import { 
  ArrowLeft, Crown, Mail, Lock, Eye, EyeOff, 
  User, Phone, CheckCircle, Award 
} from "lucide-react";

export default function RegistroJugador() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefone: "",
    password: "",
  });

  // Detectar idioma inicial
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  // Guardar idioma en localStorage
  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  const t = translations[locale];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!aceptarTerminos) {
      setError(t.register.termsError);
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: "player",
          name: formData.nombre,
          phone: formData.telefone,
          playerNickname: formData.nombre,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.register.registerError);
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir a la página de entrada a sala
      router.push("/entrar");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Si el idioma aún no está listo, mostrar loading
  if (!isLocaleReady) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header con selector de idioma */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">
              <label
                htmlFor="locale-select"
                className="text-gray-400 text-xs md:text-sm tracking-wide"
              >
                {t.header.language}
              </label>
              <select
                id="locale-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    {t.register.title}{" "}
                    <span className="text-yellow-500 font-medium">{t.register.player}</span>
                  </h1>
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-3">
                  {t.register.playerSubtitle}
                </p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.fullName}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder={t.register.fullNamePlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t.register.emailPlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      placeholder={t.register.phonePlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder={t.register.passwordPlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs">{t.register.passwordMinLength}</p>
                </div>

                {/* Términos */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptarTerminos}
                    onChange={(e) => setAceptarTerminos(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30 rounded"
                  />
                  <span className="text-gray-500 text-xs">
                    {t.register.acceptTerms}{" "}
                    <span className="text-yellow-500">{t.register.termsAndConditions}</span>{" "}
                    {t.register.of} JugadaPlay
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Beneficios */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500 text-xs font-medium">{t.register.benefitsPlayer}</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>✓ {t.register.benefitPlayer1}</p>
                    <p>✓ {t.register.benefitPlayer2}</p>
                    <p>✓ {t.register.benefitPlayer3}</p>
                    <p>✓ {t.register.benefitPlayer4}</p>
                  </div>
                </div>

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all overflow-hidden ${
                    !loading && aceptarTerminos
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                      : "bg-gray-900 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {loading ? t.register.registeringPlayer : t.register.registerPlayerButton}
                  </span>
                  {!loading && aceptarTerminos && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  {t.register.alreadyHaveAccountPlayer}{" "}
                  <Link href="/login" className="text-yellow-500 hover:text-yellow-400">
                    {t.register.loginPlayer}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}