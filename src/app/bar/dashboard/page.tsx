// app/bar/dashboard/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Crown, 
  Plus, 
  Users, 
  Trophy, 
  Coins, 
  Calendar,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";

export default function BarDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("activas");

  // Datos de ejemplo
  const salasActivas = [
    { id: 1, partido: "Flamengo vs Vasco", fecha: "Hoy 20:30", jugadores: 32, pozo: 160, estado: "activa" },
    { id: 2, partido: "Corinthians vs Palmeiras", fecha: "Hoy 21:00", jugadores: 45, pozo: 225, estado: "activa" },
  ];

  const proximosPartidos = [
    { id: 3, partido: "Brasil vs Argentina", fecha: "Mañana 16:00", jugadores: 0, pozo: 0 },
    { id: 4, partido: "São Paulo vs Santos", fecha: "27/03 19:00", jugadores: 0, pozo: 0 },
  ];

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

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">El Goloso FC</span>
              <div className="w-px h-6 bg-yellow-500/20"></div>
              <button className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">
                SALDO: R$ 450,00
              </button>
              <button className="relative overflow-hidden border border-yellow-500/50 text-yellow-500 px-4 py-1.5 text-sm rounded-sm hover:border-yellow-500 transition-all">
                RETIRAR
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
                <span className="text-yellow-500 text-sm">El Goloso FC</span>
                <span className="text-gray-400 text-sm">SALDO: R$ 450,00</span>
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
          
          {/* Header del dashboard */}
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
              <div className="text-2xl font-light text-white">77</div>
              <div className="text-xs text-gray-500 tracking-wide">JUGADORES HOY</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">R$ 385</div>
              <div className="text-xs text-gray-500 tracking-wide">RECAUDADO HOY</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">R$ 4.520</div>
              <div className="text-xs text-gray-500 tracking-wide">TOTAL RECIBIDO</div>
            </div>
            
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">4.8</div>
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
              SALAS ACTIVAS
            </button>
            <button
              onClick={() => setActiveTab("proximos")}
              className={`pb-3 text-sm tracking-wide transition-all ${
                activeTab === "proximos"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              PRÓXIMOS PARTIDOS
            </button>
          </div>

          {/* Lista de salas */}
          <div className="space-y-3">
            {activeTab === "activas" && salasActivas.map((sala) => (
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
                        {sala.fecha}
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

            {activeTab === "proximos" && proximosPartidos.map((partido) => (
              <div key={partido.id} className="bg-black/30 border border-yellow-500/20 rounded-lg p-4 opacity-60">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">{partido.partido}</h3>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Calendar className="w-3 h-3" />
                      {partido.fecha}
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
              <div className="flex justify-between items-center py-2 border-b border-yellow-500/10">
                <span className="text-yellow-500">1°</span>
                <span className="text-white text-sm">João Pedro</span>
                <span className="text-yellow-500 text-sm">3 aciertos</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-yellow-500/10">
                <span className="text-gray-500">2°</span>
                <span className="text-white text-sm">Maria C.</span>
                <span className="text-gray-500 text-sm">2 aciertos</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">3°</span>
                <span className="text-white text-sm">Carlos A.</span>
                <span className="text-gray-500 text-sm">2 aciertos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}