// app/jugador/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Crown, Trophy, Users, Calendar, Clock, 
  TrendingUp, Star, Menu, X, LogOut 
} from "lucide-react";

export default function PlayerDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    // Si no es jugador, redirigir al dashboard correspondiente
    if (parsedUser.role !== "player") {
      if (parsedUser.role === "bar") {
        router.push("/bar/dashboard");
      } else if (parsedUser.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/login");
      }
      return;
    }
    
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </div>
    );
  }

  // Datos de ejemplo para el dashboard (luego vendrán del backend)
  const partidosActivos = [
    { id: 1, partido: "Flamengo vs Vasco", fecha: "Hoy 20:30", prediccion: "2 x 1", pozo: 160 },
    { id: 2, partido: "Corinthians vs Palmeiras", fecha: "Mañana 16:00", prediccion: "-", pozo: 225 },
  ];

  const historial = [
    { partido: "Brasil vs Argentina", resultado: "2 x 1", prediccion: "2 x 1", ganado: true, premio: 56 },
    { partido: "São Paulo vs Santos", resultado: "1 x 0", prediccion: "0 x 0", ganado: false, premio: 0 },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
              <span className="text-xl font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">
                Hola, {user?.name || "Jugador"}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                SALIR
              </button>
            </div>

            {/* Botón menú móvil */}
            <button
              className="md:hidden text-yellow-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menú Móvil */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-3">
                <span className="text-yellow-500 text-sm">Hola, {user?.name || "Jugador"}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  SALIR
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header del dashboard */}
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-white">
              MI <span className="text-yellow-500 font-medium">DASHBOARD</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">3</div>
              <div className="text-xs text-gray-500">PARTIDOS JUGADOS</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Star className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">2</div>
              <div className="text-xs text-gray-500">ACIERTOS</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <TrendingUp className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">67%</div>
              <div className="text-xs text-gray-500">TASA DE ACIERTO</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Crown className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">R$ 156</div>
              <div className="text-xs text-gray-500">TOTAL GANADO</div>
            </div>
          </div>

          {/* Partidos Activos */}
          <div className="mb-8">
            <h2 className="text-white text-lg font-light tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              PARTIDOS ACTIVOS
            </h2>
            <div className="space-y-3">
              {partidosActivos.map((partido) => (
                <div key={partido.id} className="bg-black/30 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-white font-medium mb-1">{partido.partido}</h3>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {partido.fecha}
                        </span>
                        <span className="text-yellow-500">Pozo: R$ {partido.pozo}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Link href={`/jugador/prediccion/${partido.id}`} className="flex-1 md:flex-none">
                        <button className="w-full border border-yellow-500/50 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/10 transition-all">
                          {partido.prediccion !== "-" ? "MODIFICAR" : "PREDECIR"}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          <div>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              HISTORIAL DE PREDICCIONES
            </h2>
            <div className="space-y-3">
              {historial.map((item, idx) => (
                <div key={idx} className="bg-black/30 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-white font-medium mb-1">{item.partido}</h3>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">Resultado: {item.resultado}</span>
                        <span className="text-gray-500">Tu predicción: {item.prediccion}</span>
                      </div>
                    </div>
                    <div>
                      {item.ganado ? (
                        <span className="text-green-500 text-sm">+ R$ {item.premio}</span>
                      ) : (
                        <span className="text-red-500 text-sm">No acertaste</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}