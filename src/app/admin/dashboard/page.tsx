// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Crown, Users, Building2, Calendar, DollarSign, 
  TrendingUp, CheckCircle, Clock, AlertCircle,
  Menu, X, Search, Filter, Download, LogOut, Settings
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ingresosTotales: 45230,
    baresActivos: 0,
    jugadoresUnicos: 0,
    prediccionesPagadas: 52000,
  });

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      if (parsedUser.role === "bar") {
        router.push("/bar/dashboard");
      } else if (parsedUser.role === "player") {
        router.push("/jugador/dashboard");
      } else {
        router.push("/login");
      }
      return;
    }
    
    setUser(parsedUser);
    
    // Obtener estadísticas reales del backend
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            baresActivos: data.data.baresActivos,
            jugadoresUnicos: data.data.jugadores,
          }));
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
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

  const topBares = [
    { nome: "El Goloso FC", receita: 4520, partidos: 24 },
    { nome: "Bar do Zé", receita: 3890, partidos: 18 },
    { nome: "Arena Pub", receita: 3120, partidos: 15 },
    { nome: "Sports Bar", receita: 2850, partidos: 12 },
    { nome: "Cantina do Juca", receita: 2100, partidos: 10 },
  ];

  const pendientes = [
    { tipo: "pagos", cantidad: 15, valor: 3200 },
    { tipo: "bares_aprovacao", cantidad: 8 },
    { tipo: "reclamos", cantidad: 3 },
  ];

  const proximosPartidos = [
    { partido: "Brasil vs Argentina", salas: 12, fecha: "Mañana 16:00" },
    { partido: "Flamengo vs Fluminense", salas: 8, fecha: "27/03 20:00" },
    { partido: "Final Champions", salas: 23, fecha: "30/03 15:00" },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Header Admin */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Crown className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
              <span className="text-xl font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
              <span className="hidden md:block text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-sm">
                ADMIN
              </span>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">
                {user?.email || "ADMIN@JUGADAPLAY.COM"}
              </span>
              <div className="w-px h-6 bg-yellow-500/20"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                SALIR
              </button>
              <button className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Botón menú móvil */}
            <button className="md:hidden text-yellow-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menú Móvil */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-3">
                <span className="text-gray-400 text-sm">{user?.email || "ADMIN@JUGADAPLAY.COM"}</span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  SALIR
                </button>
                <button className="text-gray-400 text-sm text-left">CONFIGURACIÓN</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-white">
                ADMIN <span className="text-yellow-500 font-medium">DASHBOARD</span>
              </h1>
              <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/usuarios">
                <button className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg hover:border-yellow-500/50 transition-all">
                  <Users className="w-4 h-4" />
                  GESTIONAR USUARIOS
                </button>
              </Link>
              <button className="p-2 border border-yellow-500/30 rounded-lg hover:border-yellow-500/50 transition-all">
                <Download className="w-4 h-4 text-yellow-500" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-black border border-yellow-500/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/60"
                />
              </div>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-light text-white">R$ {stats.ingresosTotales.toLocaleString()}</div>
              <div className="text-xs text-gray-500">INGRESOS TOTALES</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Building2 className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.baresActivos}</div>
              <div className="text-xs text-gray-500">BARES ACTIVOS</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Users className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.jugadoresUnicos.toLocaleString()}</div>
              <div className="text-xs text-gray-500">JUGADORES ÚNICOS</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.prediccionesPagadas.toLocaleString()}</div>
              <div className="text-xs text-gray-500">PREDICCIONES PAGADAS</div>
            </div>
          </div>

          {/* Sección de Pendientes */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {pendientes.map((item, idx) => (
              <div key={idx} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-white text-sm capitalize">
                      {item.tipo === "pagos" && "Pagos por liberar"}
                      {item.tipo === "bares_aprovacao" && "Bares por aprobar"}
                      {item.tipo === "reclamos" && "Reclamos"}
                    </span>
                  </div>
                  <span className="text-yellow-500 font-bold">{item.cantidad}</span>
                </div>
                {item.valor && (
                  <p className="text-gray-500 text-xs mt-2">R$ {item.valor.toLocaleString()}</p>
                )}
                <button className="mt-3 text-yellow-500 text-xs hover:text-yellow-400 transition-colors">
                  VER DETALLES →
                </button>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mb-6 border-b border-yellow-500/20">
            <button
              onClick={() => setActiveTab("general")}
              className={`pb-3 text-sm tracking-wide transition-all ${
                activeTab === "general"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              TOP BARES
            </button>
            <button
              onClick={() => setActiveTab("partidos")}
              className={`pb-3 text-sm tracking-wide transition-all ${
                activeTab === "partidos"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              PRÓXIMOS PARTIDOS
            </button>
          </div>

          {/* Tabla de Top Bares */}
          {activeTab === "general" && (
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-yellow-500/20">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">#</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">BAR</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">RECAUDADO</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">PARTIDOS</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {topBares.map((bar, idx) => (
                    <tr key={idx} className="hover:bg-yellow-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-sm font-mono ${idx === 0 ? "text-yellow-500" : "text-gray-500"}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white text-sm">{bar.nome}</td>
                      <td className="px-6 py-4 text-yellow-500 text-sm">R$ {bar.receita.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{bar.partidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Próximos Partidos */}
          {activeTab === "partidos" && (
            <div className="space-y-3">
              {proximosPartidos.map((partido, idx) => (
                <div key={idx} className="bg-black/30 border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">{partido.partido}</h3>
                    <p className="text-gray-500 text-xs">{partido.fecha}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-yellow-500 text-sm">{partido.salas} salas activas</span>
                    <button className="border border-yellow-500/30 text-yellow-500 px-4 py-1.5 text-xs rounded-sm hover:border-yellow-500/50 transition-all">
                      VER DETALLES
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}