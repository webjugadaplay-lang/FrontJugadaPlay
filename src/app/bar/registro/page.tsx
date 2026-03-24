// app/bar/registro/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Mail, Lock, Eye, EyeOff, 
  Building2, Phone, MapPin, User, CheckCircle 
} from "lucide-react";

export default function RegistroBar() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    nombreBar: "",
    email: "",
    telefone: "",
    endereco: "",
    cnpj: "",
    responsavel: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!aceptarTerminos) {
      setError("Debes aceptar los términos y condiciones");
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
          role: "bar",
          name: formData.responsavel,
          phone: formData.telefone,
          barName: formData.nombreBar,
          cnpj: formData.cnpj,
          address: formData.endereco,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar bar");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al dashboard del bar
      router.push("/bar/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    REGISTRAR <span className="text-yellow-500 font-medium">BAR</span>
                  </h1>
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-3">
                  Únete a JugadaPlay y aumenta tus ventas hasta un 30%
                </p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Información del bar */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    INFORMACIÓN DEL BAR
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider">NOMBRE DEL BAR *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                        <input
                          type="text"
                          name="nombreBar"
                          value={formData.nombreBar}
                          onChange={handleChange}
                          required
                          placeholder="Ej: El Goloso FC"
                          className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider">CNPJ *</label>
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        required
                        placeholder="00.000.000/0001-00"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    UBICACIÓN
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        required
                        placeholder="Dirección completa"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        required
                        placeholder="(11) 99999-9999"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Responsable */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    DATOS DEL RESPONSABLE
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="text"
                        name="responsavel"
                        value={formData.responsavel}
                        onChange={handleChange}
                        required
                        placeholder="Nombre completo"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email para contacto"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    SEGURIDAD
                  </h3>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Contraseña"
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">Mínimo 6 caracteres</p>
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
                    Acepto los <span className="text-yellow-500">términos y condiciones</span> de JugadaPlay
                    y autorizo el uso de mis datos según la política de privacidad.
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
                  <p className="text-yellow-500 text-xs font-medium mb-2">🎯 BENEFICIOS EXCLUSIVOS</p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>✓ 20% de comisión por cada predicción</p>
                    <p>✓ Panel de control en tiempo real</p>
                    <p>✓ Soporte prioritario 24/7</p>
                    <p>✓ Material promocional gratuito</p>
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
                    {loading ? "REGISTRANDO..." : "REGISTRAR MI BAR"}
                  </span>
                  {!loading && aceptarTerminos && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="text-yellow-500 hover:text-yellow-400">
                    Iniciar sesión
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