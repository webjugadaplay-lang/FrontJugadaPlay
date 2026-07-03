// app/jugador/registro/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function RegistroJugador() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Estado para el país seleccionado (solo Brasil)
  const [selectedCountry] = useState(countries[0]);

  const [formData, setFormData] = useState({
    nombre: "",
    nickname: "",
    telefone: "",
    password: "",
  });

  // Inicializar idioma
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  // Guardar idioma
  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  // Capturar el parámetro de redirección al cargar la página
  useEffect(() => {
    const redirectUrl = searchParams.get('redirect');
    const existingRedirect = localStorage.getItem('redirectAfterRegistration');
    
    if (redirectUrl && redirectUrl !== existingRedirect) {
      console.log('📌 Redirección capturada desde URL:', redirectUrl);
      localStorage.setItem('redirectAfterRegistration', redirectUrl);
    }
  }, [searchParams]);

  // Verificar redirección pendiente y autenticación
  useEffect(() => {
    const token = localStorage.getItem("token");
    const redirectAfterRegistration = localStorage.getItem("redirectAfterRegistration");

    // Si ya está autenticado y hay redirección pendiente
    if (token && redirectAfterRegistration) {
      console.log('🔄 Usuario autenticado, redirigiendo a:', redirectAfterRegistration);
      localStorage.removeItem("redirectAfterRegistration");
      router.push(redirectAfterRegistration);
      return;
    }

    // Si ya está autenticado pero no hay redirección pendiente
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
      // Capitalizar nombre
      const capitalized = value.replace(/\b\w/g, (char) => char.toUpperCase());
      setFormData({ ...formData, [name]: capitalized });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validaciones
    if (!aceptarTerminos) {
      setError(t.register?.termsError || "Debes aceptar los términos y condiciones");
      return;
    }

    if (!formData.nombre.trim()) {
      setError("Por favor, ingresa tu nombre completo");
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
        phone: cleanPhone, // Solo números
        phoneCountry: selectedCountry.dialCode, // +55
        password: formData.password,
        role: "player",
        country: selectedCountry.code, // "BR"
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
        throw new Error(data.message || t.register?.registerError || "Error al registrar");
      }

      // Guardar token y usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verificar redirección pendiente
      const redirectAfterRegistration = localStorage.getItem("redirectAfterRegistration");
      console.log('🔍 Redirección pendiente encontrada:', redirectAfterRegistration);

      if (redirectAfterRegistration) {
        console.log('🔄 Redirigiendo a:', redirectAfterRegistration);
        localStorage.removeItem("redirectAfterRegistration");
        router.push(redirectAfterRegistration);
      } else {
        console.log('🏠 Sin redirección pendiente, yendo al dashboard');
        router.push("/jugador/dashboard");
      }
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError(err.message || "Error al registrar usuario");
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
      {/* Header */}
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

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>

            <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">

              {/* Título */}
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
                
                {/* Mensaje de redirección si existe */}
                {searchParams.get('redirect') && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-500 text-xs text-center">
                      🔗 Serás redirigido automáticamente después del registro
                    </p>
                  </div>
                )}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500"
                      disabled={loading}
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
                    disabled={loading}
                  />
                  <span className="text-gray-500 text-xs">
                    {t.register?.acceptTerms || "Acepto los "}{" "}
                    <span className="text-yellow-500">{t.register?.termsAndConditions || "Términos y Condiciones"}</span>{" "}
                    {t.register?.of || "de"} JugadaPlay
                  </span>
                </label>

                {/* Mensaje de error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Mensaje de éxito */}
                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-500 text-sm text-center">{successMessage}</p>
                  </div>
                )}

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={loading || !aceptarTerminos}
                  className={`group relative w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all overflow-hidden ${
                    !loading && aceptarTerminos
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                      : "bg-gray-900 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {loading 
                      ? (t.register?.registeringPlayer || "Registrando...") 
                      : (t.register?.registerPlayerButton || "Registrarse como Jugador")
                    }
                  </span>
                  {!loading && aceptarTerminos && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>

                {/* Enlace a login */}
                <p className="text-center text-gray-600 text-xs">
                  {t.register?.alreadyHaveAccount || "¿Ya tienes cuenta?"}{" "}
                  <Link href="/login" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                    {t.register?.login || "Inicia sesión"}
                  </Link>
                </p>

                {/* Beneficios */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-500 text-xs font-medium mb-2">
                    🎯 Beneficios de ser jugador
                  </p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>✓ Participa en predicciones de fútbol</p>
                    <p>✓ Gana premios en dinero real</p>
                    <p>✓ Compite con otros jugadores</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}