"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap,
  Building2, MapPin, Users
} from "lucide-react";

export default function CrearSala() {
  const router = useRouter();
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Campos del partido
  const [tournament, setTournament] = useState("");
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");

  // Crear sala
  const handleCreateRoom = async () => {
    // Validaciones
    if (!teamHome || !teamAway) {
      setError("Los nombres de los equipos son obligatorios");
      return;
    }
    if (!matchDate || !matchTime) {
      setError("Fecha y hora del partido son obligatorias");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      // Combinar fecha y hora
      const matchDateTime = new Date(`${matchDate}T${matchTime}`);
      const closeTime = new Date(matchDateTime);
      if (cierrePredictions === "15min") {
        closeTime.setMinutes(closeTime.getMinutes() - 15);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${teamHome} vs ${teamAway}`,
          sport: "Fútbol",
          tournament: tournament || "Partido Amistoso",
          team_home: teamHome,
          team_away: teamAway,
          match_date: matchDateTime.toISOString(),
          prediction_close_time: closeTime.toISOString(),
          entry_fee: tipoSala === "paid" ? parseFloat(valorPrediccion) : 0,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push("/bar/dashboard");
      } else {
        throw new Error(data.message || "Error al crear sala");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularPozo = () => {
    const valor = parseFloat(valorPrediccion) || 0;
    const estimadoJugadores = 50;
    const total = valor * estimadoJugadores;
    return {
      total: total.toFixed(2),
      premios: (total * 0.7).toFixed(2),
      bar: (total * 0.2).toFixed(2),
      plataforma: (total * 0.1).toFixed(2),
    };
  };

  const pozo = calcularPozo();

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
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
        <div className="container mx-auto max-w-3xl">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              <div className="border-b border-yellow-500/20 px-8 pt-8 pb-4">
                <h1 className="text-2xl font-light tracking-tight text-white">
                  CREAR <span className="text-yellow-500 font-medium">SALA</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-2">
                  Completa los datos del partido para crear una nueva sala
                </p>
              </div>

              <div className="p-8 space-y-6">
                
                {/* Torneo/Campeonato */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    <Trophy className="inline w-3 h-3 mr-1" />
                    TORNEO / CAMPEONATO
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tournament}
                      onChange={(e) => setTournament(e.target.value)}
                      placeholder="Ej: Brasileirão Série A, Libertadores, Copa do Brasil..."
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                </div>

                {/* Equipos */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      <Building2 className="inline w-3 h-3 mr-1" />
                      EQUIPO LOCAL *
                    </label>
                    <input
                      type="text"
                      value={teamHome}
                      onChange={(e) => setTeamHome(e.target.value)}
                      placeholder="Ej: Flamengo"
                      required
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      <Users className="inline w-3 h-3 mr-1" />
                      EQUIPO VISITANTE *
                    </label>
                    <input
                      type="text"
                      value={teamAway}
                      onChange={(e) => setTeamAway(e.target.value)}
                      placeholder="Ej: Vasco"
                      required
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      FECHA *
                    </label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      required
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      <Clock className="inline w-3 h-3 mr-1" />
                      HORA *
                    </label>
                    <input
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      required
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                </div>

                {/* Cierre de predicciones */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cierre"
                        value="inicio"
                        checked={cierrePredictions === "inicio"}
                        onChange={() => setCierrePredictions("inicio")}
                        className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                      />
                      <span className="text-gray-400 text-sm">Al inicio del partido</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cierre"
                        value="15min"
                        checked={cierrePredictions === "15min"}
                        onChange={() => setCierrePredictions("15min")}
                        className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                      />
                      <span className="text-gray-400 text-sm">15 minutos antes</span>
                    </label>
                  </div>
                </div>

                {/* Tipo de sala */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">TIPO DE SALA</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setTipoSala("practice")}
                      className={`p-4 rounded-lg border transition-all ${
                        tipoSala === "practice"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-white font-medium mb-1">Modo Práctica</div>
                        <div className="text-gray-500 text-xs">Sin dinero real</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoSala("paid")}
                      className={`p-4 rounded-lg border transition-all ${
                        tipoSala === "paid"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-white font-medium mb-1">Modo Pago</div>
                        <div className="text-gray-500 text-xs">Premios reales</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Valor de predicción */}
                {tipoSala === "paid" && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      VALOR POR PREDICCIÓN (R$)
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="number"
                        value={valorPrediccion}
                        onChange={(e) => setValorPrediccion(e.target.value)}
                        min="1"
                        max="50"
                        step="1"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                    <p className="text-gray-600 text-xs">Recomendado: R$ 2 a R$ 10</p>
                  </div>
                )}

                {/* Resumen del pozo */}
                {tipoSala === "paid" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-white text-sm font-medium tracking-wide">RESUMEN ESTIMADO (50 jugadores)</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total recaudado:</span>
                        <span className="text-white">R$ {pozo.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Premios (70%):</span>
                        <span className="text-yellow-500">R$ {pozo.premios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tu comisión (20%):</span>
                        <span className="text-green-500">R$ {pozo.bar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plataforma (10%):</span>
                        <span className="text-gray-500">R$ {pozo.plataforma}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-4 pt-2">
                  <Link href="/bar/dashboard" className="flex-1">
                    <button className="w-full border border-yellow-500/30 text-gray-400 py-3 rounded-lg text-sm tracking-wide hover:border-yellow-500/50 transition-all">
                      CANCELAR
                    </button>
                  </Link>
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {loading ? "CREANDO..." : "CREAR SALA"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}