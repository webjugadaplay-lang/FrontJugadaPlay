// app/bar/crear-sala/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap,
  Search, Loader2, X, ChevronRight
} from "lucide-react";

interface Team {
  api_team_id: number;
  name: string;
  code: string;
  logo_url: string;
  country: string;
}

interface Fixture {
  api_fixture_id: number;
  api_league_id: number;
  league_name: string;
  team_home_id: number;
  team_home_name: string;
  team_away_id: number;
  team_away_name: string;
  match_date: string;
  status: string;
}

export default function CrearSala() {
  const router = useRouter();
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  
  // Estados para búsqueda de partidos
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [step, setStep] = useState<"search" | "fixtures">("search");

  // Buscar equipos
  const searchTeams = async () => {
    if (searchTerm.length < 2) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search-teams?q=${encodeURIComponent(searchTerm)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Error buscando equipos:", error);
    } finally {
      setSearching(false);
    }
  };

  // Buscar partidos de un equipo
  const fetchTeamFixtures = async (teamId: number) => {
    setLoadingFixtures(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/team-fixtures?teamId=${teamId}&next=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setFixtures(data.data);
        setStep("fixtures");
      }
    } catch (error) {
      console.error("Error buscando partidos:", error);
    } finally {
      setLoadingFixtures(false);
    }
  };

  // Seleccionar equipo
  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamFixtures(team.api_team_id);
  };

  // Seleccionar partido
  const handleSelectFixture = (fixture: Fixture) => {
    setSelectedFixture(fixture);
  };

  // Crear sala
  const handleCreateRoom = async () => {
    if (!selectedFixture) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const matchDate = new Date(selectedFixture.match_date);
      const closeTime = new Date(matchDate);
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
          name: `${selectedFixture.team_home_name} vs ${selectedFixture.team_away_name}`,
          sport: "Fútbol",
          team_home: selectedFixture.team_home_name,
          team_away: selectedFixture.team_away_name,
          match_date: matchDate.toISOString(),
          prediction_close_time: closeTime.toISOString(),
          entry_fee: parseFloat(valorPrediccion),
          api_fixture_id: selectedFixture.api_fixture_id,
          api_league_id: selectedFixture.api_league_id,
          api_league_name: selectedFixture.league_name,
          api_team_home_id: selectedFixture.team_home_id,
          api_team_away_id: selectedFixture.team_away_id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push("/bar/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error("Error creando sala:", error);
      alert(error.message || "Error al crear sala");
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
              </div>

              <div className="p-8 space-y-8">
                
                {/* PASO 1: BUSCAR EQUIPO */}
                {step === "search" && (
                  <div className="space-y-4">
                    <label className="block text-xs text-yellow-500 tracking-wider">BUSCAR EQUIPO</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchTeams()}
                          placeholder="Ej: Flamengo, Real Madrid, Manchester..."
                          className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                        />
                      </div>
                      <button
                        onClick={searchTeams}
                        disabled={searchTerm.length < 2 || searching}
                        className="bg-yellow-500 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-all disabled:opacity-50"
                      >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                      </button>
                    </div>

                    {/* Resultados de búsqueda */}
                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-gray-500 text-xs">Selecciona un equipo:</p>
                        {searchResults.map((team) => (
                          <button
                            key={team.api_team_id}
                            onClick={() => handleSelectTeam(team)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all text-left"
                          >
                            {team.logo_url && (
                              <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain" />
                            )}
                            <div>
                              <span className="text-white font-medium">{team.name}</span>
                              <span className="text-gray-500 text-xs ml-2">{team.country}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-yellow-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.length === 0 && searchTerm.length >= 2 && !searching && (
                      <p className="text-gray-500 text-sm text-center py-4">No se encontraron equipos</p>
                    )}
                  </div>
                )}

                {/* PASO 2: SELECCIONAR PARTIDO */}
                {step === "fixtures" && selectedTeam && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          setStep("search");
                          setSelectedTeam(null);
                          setFixtures([]);
                          setSelectedFixture(null);
                        }}
                        className="text-yellow-500 text-sm hover:text-yellow-400 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a buscar
                      </button>
                      <div className="flex items-center gap-2">
                        {selectedTeam.logo_url && (
                          <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="w-6 h-6" />
                        )}
                        <span className="text-white text-sm">{selectedTeam.name}</span>
                      </div>
                    </div>

                    <label className="block text-xs text-yellow-500 tracking-wider mb-3">PRÓXIMOS PARTIDOS</label>
                    
                    {loadingFixtures ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                      </div>
                    ) : fixtures.length > 0 ? (
                      <div className="space-y-3">
                        {fixtures.map((fixture) => (
                          <button
                            key={fixture.api_fixture_id}
                            onClick={() => handleSelectFixture(fixture)}
                            className={`w-full p-4 rounded-lg border transition-all text-left ${
                              selectedFixture?.api_fixture_id === fixture.api_fixture_id
                                ? "border-yellow-500 bg-yellow-500/10"
                                : "border-yellow-500/20 hover:border-yellow-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-500">{fixture.league_name}</span>
                                  <span className="text-xs text-yellow-500">
                                    {new Date(fixture.match_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                  <span className="text-white font-medium">{fixture.team_home_name}</span>
                                  <span className="text-yellow-500 text-sm">vs</span>
                                  <span className="text-white font-medium">{fixture.team_away_name}</span>
                                </div>
                                <div className="text-center mt-2">
                                  <span className="text-gray-500 text-xs">
                                    {new Date(fixture.match_date).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              {selectedFixture?.api_fixture_id === fixture.api_fixture_id && (
                                <div className="ml-4">
                                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-black"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">No hay próximos partidos programados</p>
                    )}
                  </div>
                )}

                {/* CONFIGURACIÓN DE LA SALA (solo si hay partido seleccionado) */}
                {selectedFixture && (
                  <>
                    {/* Fecha y hora (automática desde API) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block text-xs text-yellow-500 tracking-wider">FECHA</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                          <input
                            type="text"
                            value={new Date(selectedFixture.match_date).toLocaleDateString()}
                            disabled
                            className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-gray-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs text-yellow-500 tracking-wider">HORA</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                          <input
                            type="text"
                            value={new Date(selectedFixture.match_date).toLocaleTimeString()}
                            disabled
                            className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cierre de predicciones */}
                    <div className="space-y-3">
                      <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
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
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="cierre"
                            value="15min"
                            checked={cierrePredictions === "15min"}
                            onChange={() => setCierrePredictions("15min")}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                          />
                          <span className="text-gray-400 text-sm">15 minutos antes (recomendado)</span>
                        </label>
                      </div>
                    </div>

                    {/* Tipo de sala */}
                    <div className="space-y-3">
                      <label className="block text-xs text-yellow-500 tracking-wider">TIPO DE SALA</label>
                      <div className="grid md:grid-cols-2 gap-4">
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
                      <div className="space-y-3">
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
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <h3 className="text-white text-sm font-medium tracking-wide">RESUMEN ESTIMADO (50 jugadores)</h3>
                        </div>
                        <div className="space-y-2 text-sm">
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

                    {/* Botones de acción */}
                    <div className="flex gap-4 pt-4">
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}