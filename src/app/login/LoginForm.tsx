// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Building2, Shield, Phone } from "lucide-react";
import { translations, type Locale } from "@/messages";

type Props = {
  locale: Locale;
};

export default function LoginForm({ locale }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<"player" | "owner" | "admin">("player");
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const t = translations[locale];

  // ✅ CORREGIDO: Verificar redirecciones
  useEffect(() => {
    // ✅ Obtener el token dentro del useEffect
    const token = localStorage.getItem("token");
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    const redirectAfterRegistration = localStorage.getItem("redirectAfterRegistration");

    if (token && redirectAfterRegistration) {
      localStorage.removeItem("redirectAfterRegistration");
      setIsRedirecting(true);
      router.push(redirectAfterRegistration);
      return;
    }

    if (token && redirectUrl) {
      localStorage.removeItem("redirectAfterLogin");
      setIsRedirecting(true);
      router.push(redirectUrl);
      return;
    }

    if (token) {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "admin") {
            router.push("/admin/dashboard");
          } else if (user.role === "owner" || user.role === "bar") {
            router.push("/bar/dashboard");
          } else {
            router.push("/jugador/dashboard");
          }
        } catch (e) {
          router.push("/dashboard");
        }
      }
    }
  }, [router]);

  // Verificar código pendiente del QR
  useEffect(() => {
    const code = searchParams?.get("code");
    if (code) {
      sessionStorage.setItem("pendingRoomCode", code);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Determinar qué enviar según el rol
      let email = identificador;

      if (tipoUsuario === 'player') {
        // ✅ Para PLAYER: limpiar el teléfono (solo números)
        const phoneClean = identificador.replace(/\D/g, '');
        if (phoneClean.length < 8) {
          setError('Por favor, ingresa un número de teléfono válido (mínimo 8 dígitos)');
          setLoading(false);
          return;
        }
        email = phoneClean; // Enviamos solo números
      } else {
        // ✅ Para OWNER y ADMIN: validar email
        if (!identificador.includes('@') || !identificador.includes('.')) {
          setError('Por favor, ingresa un email válido');
          setLoading(false);
          return;
        }
        email = identificador;
      }

      const dbRole = tipoUsuario;

      console.log('=== DATOS ENVIADOS AL LOGIN ===');
      console.log('Email/Identificador:', email);
      console.log('Rol:', dbRole);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: dbRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.login.errors.login);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verificar código pendiente de sala (QR)
      const pendingCode = sessionStorage.getItem("pendingRoomCode");
      if (pendingCode) {
        sessionStorage.removeItem("pendingRoomCode");
        try {
          const token = localStorage.getItem("token");
          const roomResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${pendingCode}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const roomData = await roomResponse.json();

          if (roomData.success && roomData.roomId) {
            router.push(`/jugador/prediccion/${roomData.roomId}`);
            return;
          }
        } catch (err) {
          console.error("Error al buscar sala por código:", err);
        }
        router.push(`/entrar?code=${pendingCode}`);
        return;
      }

      // Verificar URL de retorno
      const redirectUrl = localStorage.getItem("redirectAfterLogin");
      if (redirectUrl) {
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
        return;
      }

      // Redirigir según el rol
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.user.role === "owner" || data.user.role === "bar") {
        router.push("/bar/dashboard");
      } else {
        router.push("/jugador/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-yellow-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md">
      <div className="relative">
        <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
        <form
          onSubmit={handleSubmit}
          className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden"
        >
          <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
            <h1 className="text-2xl font-light tracking-tight text-white">
              {t.login.title1}{" "}
              <span className="text-yellow-500 font-medium">{t.login.title2}</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
          </div>

          <div className="p-6 space-y-6">
            {/* 3 BOTONES DE ROL */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoUsuario("player")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${tipoUsuario === "player"
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                  : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                  } ${isMobile ? "justify-center" : ""}`}
              >
                {!isMobile && <User className="w-4 h-4" />}
                <span className="text-sm text-center">{t.login.roles.player}</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoUsuario("owner")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${tipoUsuario === "owner"
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                  : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                  } ${isMobile ? "justify-center" : ""}`}
              >
                {!isMobile && <Building2 className="w-4 h-4" />}
                <span className="text-sm text-center">{t.login.roles.bar}</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoUsuario("admin")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${tipoUsuario === "admin"
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                  : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                  } ${isMobile ? "justify-center" : ""}`}
              >
                {!isMobile && <Shield className="w-4 h-4" />}
                <span className="text-sm text-center">{t.login.roles.admin}</span>
              </button>
            </div>

            {/* Campo de identificador */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {tipoUsuario === "player" ? "Teléfono" : "Email"}
              </label>
              <div className="relative">
                {tipoUsuario === "player" ? (
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
                <input
                  type={tipoUsuario === "player" ? "tel" : "email"}
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder={
                    tipoUsuario === "player"
                      ? "Ej: 3001234567"
                      : "email@ejemplo.com"
                  }
                  required
                  disabled={loading}
                />
              </div>
              {tipoUsuario === "player" && (
                <p className="text-gray-500 text-xs mt-1">
                  Ingresa tu número de teléfono (solo dígitos)
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">{t.login.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="********"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  {t.login.submitting}
                </span>
              ) : (
                t.login.submit
              )}
            </button>

            <div className="text-center">
              <Link
                href="/jugador/registro"
                className="inline-block w-full py-2.5 px-4 border border-yellow-500/30 text-yellow-500 font-medium rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500 transition-all duration-200"
              >
                {t.login.noAccount}
              </Link>
            </div>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs text-gray-600 hover:text-yellow-500 transition-colors">
                {t.login.forgotPassword || "¿Olvidaste tu contraseña?"}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}