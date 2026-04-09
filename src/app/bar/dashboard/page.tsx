// app/bar/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Crown, Plus, Users, Trophy, Coins, Calendar,
  ChevronRight, Menu, X, TrendingUp, Clock, Star, LogOut
} from "lucide-react";

export default function BarDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("activas");
  const [loading, setLoading] = useState(true);
  const [barName, setBarName] = useState("");
  const [stats, setStats] = useState({
    bar: { name: "", bar_name: "", balance: 0 },
    stats: {
      activeRooms: 0,
      totalPlayers: 0,
      todayRevenue: 0,
      totalRevenue: 0,
      rating: 0,
    },
    ranking: [],
  });
  const [rooms, setRooms] = useState({
    activas: [],
    proximos: [],
  });

  // Obtener datos del bar al cargar
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (!token || !userData) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userData);
      if (user.role !== "bar") {
        router.push(user.role === "admin" ? "/admin/dashboard" : "/jugador/dashboard");
        return;
      }
      
      // Obtener el nombre del bar del localStorage o del usuario
      const barNombre = user.bar_name || user.name || "";
      setBarName(barNombre);
      
      try {
        // Obtener estadísticas
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            ...statsData.data,
            bar: {
              ...statsData.data.bar,
              bar_name: barNombre
            }
          });
        }
        
        // Obtener salas activas
        const roomsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms?status=active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roomsData = await roomsRes.json();
        if (roomsData.success) {
          setRooms(prev => ({ ...prev, activas: roomsData.data }));
        }
        
        // Obtener próximos partidos (status != active)
        const upcomingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms?status=upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const upcomingData = await upcomingRes.json();
        if (upcomingData.success) {
          setRooms(prev => ({ ...prev, proximos: upcomingData.data }));
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <Crown className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span className="text-xl font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {/* Mostrar nombre del bar en mayúsculas */}
              <span className="text-yellow-500 text-sm tracking-wide uppercase">
                {barName || stats.bar.bar_name || stats.bar.name}
              </span>
              <div className="w-px h-6 bg-yellow-500/20"></div>
              <button className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">
                SALDO: R$ {stats.bar.balance.toFixed(2)}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                SALIR
              </button>
              <button className="relative overflow-hidden border border-yellow-500/50 text-yellow-500 px-4 py-1.5 text-sm rounded-sm hover:border-yellow-500 transition-all">
                RETIRAR
              </button>
            </div>

            <button className="md:hidden text-yellow-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-3">
                {/* Mostrar nombre del bar en mayúsculas en menú móvil */}
                <span className="text-yellow-500 text-sm uppercase">
                  {barName || stats.bar.bar_name || stats.bar.name}
                </span>
                <span className="text-gray-400 text-sm">SALDO: R$ {stats.bar.balance.toFixed(2)}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  SALIR
                </button>
                <button className="border border-yellow-500/50 text-yellow-500 py-2 text-sm rounded-sm">
                  RETIRAR
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-white">
                DASHBOARD
              </h1>
              <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
            </div>
            <Link href="/bar/crear-sala">
              <button className="group relative overflow-hidden bg-yellow-500 text-black px-6 py-2.5 rounded-sm text-sm font-medium tracking-wide flex items-center gap-2 hover:bg-yellow-400 transition-all">
                <Plus className="w-4 h-4" />
                <span>CREAR NUEVA SALA</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
              </button>
            </Link>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-light text-white">{stats.stats.totalPlayers}</div>
              <div className="text-xs text-gray-500 tracking-wide">JUGADORES TOTALES</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">R$ {stats.stats.todayRevenue}</div>
              <div className="text-xs text-gray-500 tracking-wide">RECAUDADO HOY</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">R$ {stats.stats.totalRevenue}</div>
              <div className="text-xs text-gray-500 tracking-wide">TOTAL RECIBIDO</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">{stats.stats.rating}</div>
              <div className="text-xs text-gray-500 tracking-wide">CALIFICACIÓN</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mb-6 border-b border-yellow-500/20">
            <button
              onClick={() => setActiveTab("activas")}
              className={`pb-3 text-sm tracking-wide transition-all ${
                activeTab === "activas"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              SALAS ACTIVAS ({rooms.activas.length})
            </button>
            <button
              onClick={() => setActiveTab("proximos")}
              className={`pb-3 text-sm tracking-wide transition-all ${
                activeTab === "proximos"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              PRÓXIMOS PARTIDOS ({rooms.proximos.length})
            </button>
          </div>

          {/* Lista de salas */}
          <div className="space-y-3">
            {activeTab === "activas" && rooms.activas.map((sala: any) => (
              <div key={sala.id} className="group bg-black/30 border border-yellow-500/20 hover:border-yellow-500/40 rounded-lg p-4 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-white font-medium">{sala.partido}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(sala.fecha).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3 h-3" />
                        {sala.jugadores} jugadores
                      </span>
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Coins className="w-3 h-3" />
                        R$ {sala.pozo}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link href={`/bar/sala/${sala.id}`} className="flex-1 md:flex-none">
                      <button className="w-full border border-yellow-500/50 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/10 transition-all">
                        VER SALA
                      </button>
                    </Link>
                    <button className="flex-1 md:flex-none bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/20 transition-all">
                      QR
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "proximos" && rooms.proximos.map((partido: any) => (
              <div key={partido.id} className="bg-black/30 border border-yellow-500/20 rounded-lg p-4 opacity-60">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">{partido.partido}</h3>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Calendar className="w-3 h-3" />
                      {new Date(partido.fecha).toLocaleString()}
                    </span>
                  </div>
                  <Link href="/bar/crear-sala" className="w-full md:w-auto">
                    <button className="w-full border border-yellow-500/30 text-yellow-500/70 px-4 py-2 text-sm rounded-sm hover:border-yellow-500/50 transition-all">
                      ACTIVAR SALA
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Ranking rápido */}
          <div className="mt-12 bg-black/30 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-light tracking-wide">RANKING DEL DÍA</h3>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
            <div className="space-y-2">
              {stats.ranking.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-yellow-500/10">
                  <span className={idx === 0 ? "text-yellow-500" : "text-gray-500"}>{idx + 1}°</span>
                  <span className="text-white text-sm">{item.name}</span>
                  <span className={idx === 0 ? "text-yellow-500 text-sm" : "text-gray-500 text-sm"}>{item.predictions} aciertos</span>
                </div>
              ))}
              {stats.ranking.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Sin predicciones hoy
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}