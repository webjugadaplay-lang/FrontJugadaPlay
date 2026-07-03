// app/jugador/registro/page.tsx
// app/jugador/registro/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { translations, type Locale } from "@/messages";
import { detectInitialLocale } from "@/lib/i18n";
import {
  ArrowLeft, Lock, Eye, EyeOff,
  User, Award, Phone, CheckCircle
} from "lucide-react";

// Configuración de países para jugadores (solo Brasil)
const countries = [
  {
    code: "BR",
    name: "Brasil",
    dialCode: "+55",
    phoneMask: "(##) #####-####",
    phonePlaceholder: "(11) 91234-5678",
  }
];

// Función para aplicar formato al número de teléfono
const formatPhoneNumber = (value: string, country: typeof countries[0]): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';

  let formatted = '';
  let numberIndex = 0;

  for (let i = 0; i < country.phoneMask.length && numberIndex < numbers.length; i++) {
    if (country.phoneMask[i] === '#') {
      formatted += numbers[numberIndex];
      numberIndex++;
    } else {
      formatted += country.phoneMask[i];
    }
  }

  return formatted;
};

// Función para limpiar (solo dígitos)
const cleanNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

export default function RegistroJugador() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estado para el país seleccionado (solo Brasil)
  const [selectedCountry] = useState(countries[0]);

  const [formData, setFormData] = useState({
    nombre: "",
    nickname: "",
    telefone: "",
    password: "",
  });

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  // Verificar redirección pendiente
  useEffect(() => {
    const token = localStorage.getItem("token");
    const redirectAfterRegistration = localStorage.getItem("redirectAfterRegistration");

    if (token && redirectAfterRegistration) {
      localStorage.removeItem("redirectAfterRegistration");
      router.push(redirectAfterRegistration);
      return;
    }

    if (token) {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "player") {
            router.push("/jugador/dashboard");
          }
        } catch (e) {
          // Si hay error, continuar con el registro
        }
      }
    }
  }, [router]);

  const t = translations[locale];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'telefone') {
      // Aplicar formato brasileño al teléfono
      const formatted = formatPhoneNumber(value, selectedCountry);
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'nombre') {
      const capitalized = value.replace(/\b\w/g, (char) => char.toUpperCase());
      setFormData({ ...formData, [name]: capitalized });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!aceptarTerminos) {
      setError(t.register.termsError || "Debes aceptar los términos y condiciones");
      return;
    }

    if (!formData.nombre.trim()) {
      setError("Por favor, ingresa tu nombre");
      return;
    }

    // Limpiar el teléfono (solo números) para enviar al backend
    const cleanPhone = formData.telefone.replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Por favor, ingresa un número de teléfono válido (mínimo 10 dígitos)");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        name: formData.nombre.trim(),
        nickname: formData.nickname.trim() || formData.nombre.trim(),
        phone: cleanPhone, // Enviamos solo los números
        phoneCountry: selectedCountry.dialCode, // Enviamos el código de país +55
        password: formData.password,
        role: "player",
        country: selectedCountry.code, // Enviamos "BR"
      };

      console.log("=== DATOS ENVIADOS AL BACKEND ===");
      console.log("Request Body:", requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.register.registerError || "Error al registrar");
      }

      // Guardar token y usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verificar redirección pendiente
      const redirectAfterRegistration = localStorage.getItem("redirectAfterRegistration");

      if (redirectAfterRegistration) {
        localStorage.removeItem("redirectAfterRegistration");
        router.push(redirectAfterRegistration);
      } else {
        router.push("/jugador/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLocaleReady) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">
              <label htmlFor="locale-select" className="text-gray-400 text-xs md:text-sm tracking-wide">
                {t.header?.language || "Idioma"}
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

      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>

            <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">

              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    {t.register?.title || "Crear cuenta"}{" "}
                    <span className="text-yellow-500 font-medium">{t.register?.player || "Jugador"}</span>
                  </h1>
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-3">
                  {t.register?.playerSubtitle || "Regístrate con tu teléfono y empieza a jugar"}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    {t.register?.fullName || "Nombre completo"} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder={t.register?.fullNamePlaceholder || "Tu nombre completo"}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Nickname (opcional) */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    {t.register?.nickName || "Nickname"} <span className="text-gray-500 text-[10px]">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder={t.register?.nickNamePlaceholder || "Ej: ElReY"}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                  <p className="text-gray-600 text-xs">Este nombre aparecerá en el ranking</p>
                </div>

                {/* Teléfono con formato Brasil */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    {t.register?.phone || "Teléfono"} *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      placeholder={selectedCountry.phonePlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all font-mono text-sm"
                    />
                  </div>
                  <p className="text-gray-600 text-xs">
                    Formato: {selectedCountry.phoneMask} (Brasil)
                  </p>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    {t.register?.password || "Contraseña"} *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder={t.register?.passwordPlaceholder || "Mínimo 6 caracteres"}
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
                  <p className="text-gray-600 text-xs">{t.register?.passwordMinLength || "Mínimo 6 caracteres"}</p>
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
                    {t.register?.acceptTerms || "Acepto los "}{" "}
                    <span className="text-yellow-500">{t.register?.termsAndConditions || "Términos y Condiciones"}</span>{" "}
                    {t.register?.of || "de"} JugadaPlay
                  </span>
                </label>

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all overflow-hidden ${!loading && aceptarTerminos
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

              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}