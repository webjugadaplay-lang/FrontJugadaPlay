// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Mail, Lock, Eye, EyeOff, User, Building2 } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<"bar" | "jugador">("jugador");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <h1 className="text-2xl font-light tracking-tight text-white">
                  INICIAR <span className="text-yellow-500 font-medium">SESIÓN</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Selector de tipo de usuario */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipoUsuario("jugador")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      tipoUsuario === "jugador"
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                        : "border-yellow-500/20 text-gray-400 hover:border-yellow-500/40"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">JUGADOR</span>
                  </button>
                  <button
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

                {/* Link olvidé contraseña */}
                <div className="text-right">
                  <button className="text-xs text-gray-500 hover:text-yellow-500 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón de inicio de sesión */}
                <Link 
                  href={tipoUsuario === "bar" ? "/bar/dashboard" : "/entrar"}
                  className="block"
                >
                  <button className="group relative w-full overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all">
                    <span className="relative z-10">INICIAR SESIÓN</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  </button>
                </Link>

                {/* Separador */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-yellow-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-4 text-gray-600">¿NO TIENES CUENTA?</span>
                  </div>
                </div>

                {/* Botones de registro */}
                <div className="space-y-2">
                  <Link href="/bar/registro">
                    <button className="w-full border border-yellow-500/30 text-yellow-500 py-3 rounded-lg text-sm font-medium hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all">
                      REGISTRAR MI BAR
                    </button>
                  </Link>
                  <Link href="/jugador/registro">
                    <button className="w-full border border-gray-700 text-gray-400 py-3 rounded-lg text-sm hover:border-yellow-500/30 hover:text-yellow-500 transition-all">
                      REGISTRARME COMO JUGADOR
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}