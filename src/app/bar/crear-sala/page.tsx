"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap,
  Globe, MapPin, ChevronDown, Users
} from "lucide-react";

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

interface Team {
  id: number;
  name: string;
}

export default function CrearSala() {
  const router = useRouter();
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // Estados para equipos
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamHomeId, setSelectedTeamHomeId] = useState<string>("");
  const [selectedTeamAwayId, setSelectedTeamAwayId] = useState<string>("");
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");

  const isMundial = selectedContinent === "7";

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
      if (data.success) setContinents(data.data);
    } catch (error) {
      console.error("Error cargando continentes:", error);
    }
  };

  // Cuando se selecciona un continente
  useEffect(() => {
    if (!selectedContinent) {
      setCountries([]);
      setTournaments([]);
      setTeams([]);
      return;
    }

    // Resetear todos los estados
    setSelectedCountry("");
    setSelectedTournament("");
    setSelectedTeamHomeId("");
    setSelectedTeamAwayId("");
    setTeams([]);
    setTournaments([]);
    setCountries([]);

    const continentId = parseInt(selectedContinent);

    if (continentId === 7) {
      // MUNDIAL - Cargar torneos internacionales y selecciones
      fetchInternationalTournaments();
      fetchInternationalTeams();
    } else {
      // OTROS CONTINENTES - Cargar países
      fetchCountries(continentId);
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

  const fetchInternationalTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournaments/international`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTournaments(data.data);
      }
    } catch (error) {
      console.error("Error cargando torneos internacionales:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const fetchInternationalTeams = async () => {
    setLoadingTeams(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/international`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error("Error cargando equipos internacionales:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Cuando se selecciona un país (solo si NO es Mundial)
  useEffect(() => {
    if (selectedCountry && !isMundial) {
      setSelectedTournament("");
      setSelectedTeamHomeId("");
      setSelectedTeamAwayId("");
      setTeams([]);
      fetchTournamentsByCountry(parseInt(selectedCountry));
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
        setTournaments(data.data);
      }
    } catch (error) {
      console.error("Error cargando torneos del país:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  // Cuando se selecciona un torneo (solo si NO es Mundial)
  useEffect(() => {
    if (selectedTournament && !isMundial) {
      setSelectedTeamHomeId("");
      setSelectedTeamAwayId("");
      fetchTeamsByTournament(parseInt(selectedTournament));
    }
  }, [selectedTournament]);

  const fetchTeamsByTournament = async (tournamentId: number) => {
    setLoadingTeams(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams-by-tournament?tournamentId=${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error("Error cargando equipos:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const availableAwayTeams = teams.filter(team => team.id.toString() !== selectedTeamHomeId);
  const selectedTeamHome = teams.find(t => t.id.toString() === selectedTeamHomeId)?.name || "";
  const selectedTeamAway = teams.find(t => t.id.toString() === selectedTeamAwayId)?.name || "";

  const handleCreateRoom = async () => {
    if (!selectedTeamHomeId || !selectedTeamAwayId) {
      setError("Debes seleccionar los dos equipos");
      return;
    }
    if (selectedTeamHomeId === selectedTeamAwayId) {
      setError("Los equipos local y visitante deben ser diferentes");
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
      const matchDateTime = new Date(`${matchDate}T${matchTime}`);
      const closeTime = new Date(matchDateTime);
      if (cierrePredictions === "15min") closeTime.setMinutes(closeTime.getMinutes() - 15);

      let tournamentName = "";
      if (isMundial && selectedTournament) {
        const tournament = tournaments.find(t => t.id.toString() === selectedTournament);
        tournamentName = tournament?.name || "Partido Internacional";
      } else if (selectedTournament) {
        const tournament = tournaments.find(t => t.id.toString() === selectedTournament);
        tournamentName = tournament?.name || "Partido Amistoso";
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${selectedTeamHome} vs ${selectedTeamAway}`,
          sport: "Fútbol",
          tournament: tournamentName,
          team_home: selectedTeamHome,
          team_away: selectedTeamAway,
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
    const total = valor * 50;
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
                <p className="text-gray-500 text-sm mt-2">Selecciona el torneo, los equipos y completa los datos del partido</p>
              </div>

              <div className="p-8 space-y-6">
                {/* SELECTOR DE CONTINENTE */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> CONTINENTE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedContinent}
                      onChange={(e) => setSelectedContinent(e.target.value)}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value="">Selecciona un continente</option>
                      {continents.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                  </div>
                </div>

                {/* SELECTOR DE PAÍS - SOLO SI NO ES MUNDIAL */}
                {selectedContinent && !isMundial && countries.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> PAÍS
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                        disabled={loadingCountries}
                      >
                        <option value="">Selecciona un país</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingCountries && <p className="text-gray-500 text-xs">Cargando países...</p>}
                  </div>
                )}

                {/* SELECTOR DE TORNEO */}
                {selectedContinent && tournaments.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> TORNEO / CAMPEONATO *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTournament}
                        onChange={(e) => setSelectedTournament(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                        disabled={loadingTournaments}
                      >
                        <option value="">Selecciona un torneo</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingTournaments && <p className="text-gray-500 text-xs">Cargando torneos...</p>}
                  </div>
                )}

                {/* SELECTORES DE EQUIPOS */}
                {selectedContinent && teams.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> EQUIPO LOCAL *
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTeamHomeId}
                          onChange={(e) => setSelectedTeamHomeId(e.target.value)}
                          className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                          disabled={loadingTeams}
                        >
                          <option value="">Selecciona equipo local</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> EQUIPO VISITANTE *
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTeamAwayId}
                          onChange={(e) => setSelectedTeamAwayId(e.target.value)}
                          className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                          disabled={loadingTeams || !selectedTeamHomeId}
                        >
                          <option value="">Selecciona equipo visitante</option>
                          {availableAwayTeams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                      </div>
                    </div>

                    {loadingTeams && <p className="text-gray-500 text-xs text-center">Cargando equipos...</p>}
                  </>
                )}

                {/* FECHA Y HORA */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">FECHA *</label>
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">HORA *</label>
                    <input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                </div>

                {/* CIERRE DE PREDICCIONES */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="cierre" checked={cierrePredictions === "inicio"} onChange={() => setCierrePredictions("inicio")} className="w-4 h-4" />
                      <span className="text-gray-400 text-sm">Al inicio del partido</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="cierre" checked={cierrePredictions === "15min"} onChange={() => setCierrePredictions("15min")} className="w-4 h-4" />
                      <span className="text-gray-400 text-sm">15 minutos antes</span>
                    </label>
                  </div>
                </div>

                {/* TIPO DE SALA */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setTipoSala("practice")} className={`p-4 rounded-lg border ${tipoSala === "practice" ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/20"}`}>
                    <div className="text-white font-medium">Modo Práctica</div>
                    <div className="text-gray-500 text-xs">Sin dinero real</div>
                  </button>
                  <button onClick={() => setTipoSala("paid")} className={`p-4 rounded-lg border ${tipoSala === "paid" ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/20"}`}>
                    <div className="text-white font-medium">Modo Pago</div>
                    <div className="text-gray-500 text-xs">Premios reales</div>
                  </button>
                </div>

                {/* VALOR DE PREDICCIÓN */}
                {tipoSala === "paid" && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">VALOR POR PREDICCIÓN (R$)</label>
                    <input type="number" value={valorPrediccion} onChange={(e) => setValorPrediccion(e.target.value)} min="1" max="50" className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                )}

                {/* RESUMEN DEL POZO */}
                {tipoSala === "paid" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-yellow-500" /><h3 className="text-white text-sm">RESUMEN ESTIMADO (50 jugadores)</h3></div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Total recaudado:</span><span className="text-white">R$ {pozo.total}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Premios (70%):</span><span className="text-yellow-500">R$ {pozo.premios}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Tu comisión (20%):</span><span className="text-green-500">R$ {pozo.bar}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Plataforma (10%):</span><span className="text-gray-500">R$ {pozo.plataforma}</span></div>
                    </div>
                  </div>
                )}

                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">{error}</div>}

                <div className="flex gap-4 pt-2">
                  <Link href="/bar/dashboard" className="flex-1">
                    <button className="w-full border border-yellow-500/30 text-gray-400 py-3 rounded-lg">CANCELAR</button>
                  </Link>
                  <button onClick={handleCreateRoom} disabled={loading} className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg font-medium disabled:opacity-50">
                    <span className="relative z-10">{loading ? "CREANDO..." : "CREAR SALA"}</span>
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