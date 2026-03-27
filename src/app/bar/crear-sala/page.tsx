"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap,
  Building2, Users, Globe, MapPin, ChevronDown
} from "lucide-react";

// Interfaces para los tipos
interface Continent {
  id: number;
  name: string;
  code: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
  flag: string;
}

interface Tournament {
  id: number;
  name: string;
  type: string;
  country_id: number | null;
}

export default function CrearSala() {
  const router = useRouter();
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para selección de torneo
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  
  // Campos del partido
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");

  // Cargar continentes al inicio
  useEffect(() => {
    fetchContinents();
  }, []);

  const fetchContinents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/continents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setContinents(data.data);
      }
    } catch (error) {
      console.error("Error cargando continentes:", error);
    }
  };

  // Cargar países cuando se selecciona un continente
  useEffect(() => {
    if (selectedContinent) {
      fetchCountries(parseInt(selectedContinent));
      // Limpiar selecciones de país y torneo
      setSelectedCountry("");
      setSelectedTournament("");
      setTournaments([]);
      // Cargar torneos del continente (torneos internacionales)
      fetchTournamentsByContinent(parseInt(selectedContinent));
    } else {
      setCountries([]);
      setTournaments([]);
    }
  }, [selectedContinent]);

  const fetchCountries = async (continentId: number) => {
    setLoadingCountries(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries?continentId=${continentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error("Error cargando países:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Cargar torneos del continente (internacionales)
  const fetchTournamentsByContinent = async (continentId: number) => {
    setLoadingTournaments(true);
    try {
      const token = localStorage.getItem("token");
      // Obtener torneos del continente (torneos sin país asociado)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournaments/by-continent?continentId=${continentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTournaments(data.data);
      }
    } catch (error) {
      console.error("Error cargando torneos del continente:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  // Cargar torneos cuando se selecciona un país
  useEffect(() => {
    if (selectedCountry) {
      fetchTournamentsByCountry(parseInt(selectedCountry));
      setSelectedTournament("");
    }
  }, [selectedCountry]);

  const fetchTournamentsByCountry = async (countryId: number) => {
    setLoadingTournaments(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournaments?countryId=${countryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        // Combinar torneos existentes con los del país
        setTournaments(prev => {
          // Filtrar los que ya tenemos (del continente)
          const existingIds = prev.map(t => t.id);
          const newTournaments = data.data.filter((t: Tournament) => !existingIds.includes(t.id));
          return [...prev, ...newTournaments];
        });
      }
    } catch (error) {
      console.error("Error cargando torneos del país:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

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
    if (!selectedTournament) {
      setError("Debes seleccionar un torneo");
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
      
      // Obtener el nombre del torneo seleccionado
      const tournament = tournaments.find(t => t.id.toString() === selectedTournament);
      const tournamentName = tournament?.name || "Partido Amistoso";
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${teamHome} vs ${teamAway}`,
          sport: "Fútbol",
          tournament: tournamentName,
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
                  Selecciona el torneo y completa los datos del partido
                </p>
              </div>

              <div className="p-8 space-y-6">
                
                {/* Selector de Continente */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    CONTINENTE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedContinent}
                      onChange={(e) => setSelectedContinent(e.target.value)}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value="">Selecciona un continente</option>
                      {continents.map((continent) => (
                        <option key={continent.id} value={continent.id}>
                          {continent.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                  </div>
                </div>

                {/* Selector de País (solo si hay países disponibles) */}
                {countries.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      PAÍS (OPCIONAL)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                      >
                        <option value="">Todos los países</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.flag && <span className="mr-2">{country.flag}</span>}
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    <p className="text-gray-600 text-xs">Si no seleccionas país, se mostrarán los torneos internacionales del continente</p>
                  </div>
                )}

                {/* Selector de Torneo */}
                {selectedContinent && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      TORNEO / CAMPEONATO *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTournament}
                        onChange={(e) => setSelectedTournament(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                        disabled={loadingTournaments}
                      >
                        <option value="">Selecciona un torneo</option>
                        {tournaments.map((tournament) => (
                          <option key={tournament.id} value={tournament.id}>
                            {tournament.name} {tournament.type === 'International' ? '(Internacional)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingTournaments && (
                      <p className="text-gray-500 text-xs">Cargando torneos...</p>
                    )}
                  </div>
                )}

                {/* Equipos */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
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