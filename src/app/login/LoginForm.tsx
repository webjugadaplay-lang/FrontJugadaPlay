"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Building2, Shield } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<"bar" | "player" | "admin">("player");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si hay código en la URL (desde QR), guardarlo para después
  useEffect(() => {
    const code = searchParams?.get("code");
    if (code) {
      sessionStorage.setItem("pendingRoomCode", code);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: tipoUsuario,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verificar si hay un código de sala pendiente (desde QR)
      const pendingCode = sessionStorage.getItem("pendingRoomCode");
      if (pendingCode) {
        sessionStorage.removeItem("pendingRoomCode");
        router.push(`/entrar?code=${pendingCode}`);
        return;
      }

      // Redirigir según el rol del usuario
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.user.role === "bar") {
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

  return (
    <div className="container mx-auto max-w-md">
      <div className="relative">
        <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
        <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
          <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
            <h1 className="text-2xl font-light tracking-tight text-white">
              INICIAR <span className="text-yellow-500 font-medium">SESIÓN</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Selector de tipo de usuario */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoUsuario("player")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  tipoUsuario === "player"
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">JUGADOR</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoUsuario("bar")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  tipoUsuario === "bar"
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-sm">BAR</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoUsuario("admin")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  tipoUsuario === "admin"
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">ADMIN</span>
              </button>
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <label className="block text-xs text-yellow-500 tracking-wider">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <label className="block text-xs text-yellow-500 tracking-wider">CONTRASEÑA</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all disabled:opacity-50"
            >
              <span className="relative z-10">
                {loading ? "INGRESANDO..." : "INICIAR SESIÓN"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-yellow-500/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-4 text-gray-600">¿NO TIENES CUENTA?</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link href="/bar/registro">
                <button type="button" className="w-full border border-yellow-500/30 text-yellow-500 py-3 rounded-lg text-sm font-medium hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all">
                  REGISTRAR MI BAR
                </button>
              </Link>
              <Link href="/jugador/registro">
                <button type="button" className="w-full border border-gray-700 text-gray-400 py-3 rounded-lg text-sm hover:border-yellow-500/30 hover:text-yellow-500 transition-all">
                  REGISTRARME COMO JUGADOR
                </button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}