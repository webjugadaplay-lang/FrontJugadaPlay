"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap,
  Building2, Users, Globe, MapPin, ChevronDown
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
  
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");

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

  useEffect(() => {
    if (selectedContinent) {
      fetchCountries(parseInt(selectedContinent));
      setSelectedCountry("");
      setSelectedTournament("");
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
      if (data.success) setCountries(data.data);
    } catch (error) {
      console.error("Error cargando países:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchTournamentsByContinent = async (continentId: number) => {
    setLoadingTournaments(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournaments/by-continent?continentId=${continentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setTournaments(data.data);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

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
        const existingNames = new Set(tournaments.map(t => t.name));
        const newTournaments = data.data.filter((t: Tournament) => !existingNames.has(t.name));
        setTournaments(prev => [...prev, ...newTournaments]);
      }
    } catch (error) {
      console.error("Error cargando torneos del país:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const handleCreateRoom = async () => {
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
      const matchDateTime = new Date(`${matchDate}T${matchTime}`);
      const closeTime = new Date(matchDateTime);
      if (cierrePredictions === "15min") closeTime.setMinutes(closeTime.getMinutes() - 15);
      
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
                <p className="text-gray-500 text-sm mt-2">Selecciona el torneo y completa los datos del partido</p>
              </div>

              <div className="p-8 space-y-6">
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

                {selectedContinent && countries.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> PAÍS (OPCIONAL)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                      >
                        <option value="">Todos los países</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                  </div>
                )}

                {selectedContinent && (
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
                          <option key={t.id} value={t.id}>{t.name} {t.country_id === null ? '(Internacional)' : ''}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingTournaments && <p className="text-gray-500 text-xs">Cargando torneos...</p>}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">EQUIPO LOCAL *</label>
                    <input type="text" value={teamHome} onChange={(e) => setTeamHome(e.target.value)} placeholder="Ej: Flamengo" className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">EQUIPO VISITANTE *</label>
                    <input type="text" value={teamAway} onChange={(e) => setTeamAway(e.target.value)} placeholder="Ej: Vasco" className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                </div>

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

                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" name="cierre" checked={cierrePredictions === "inicio"} onChange={() => setCierrePredictions("inicio")} className="w-4 h-4" /> Al inicio del partido</label>
                    <label className="flex items-center gap-2"><input type="radio" name="cierre" checked={cierrePredictions === "15min"} onChange={() => setCierrePredictions("15min")} className="w-4 h-4" /> 15 minutos antes</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setTipoSala("practice")} className={`p-4 rounded-lg border ${tipoSala === "practice" ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/20"}`}><div className="text-white font-medium">Modo Práctica</div><div className="text-gray-500 text-xs">Sin dinero real</div></button>
                  <button onClick={() => setTipoSala("paid")} className={`p-4 rounded-lg border ${tipoSala === "paid" ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/20"}`}><div className="text-white font-medium">Modo Pago</div><div className="text-gray-500 text-xs">Premios reales</div></button>
                </div>

                {tipoSala === "paid" && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">VALOR POR PREDICCIÓN (R$)</label>
                    <input type="number" value={valorPrediccion} onChange={(e) => setValorPrediccion(e.target.value)} min="1" max="50" className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white" />
                  </div>
                )}

                {tipoSala === "paid" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-yellow-500" /><h3 className="text-white text-sm">RESUMEN ESTIMADO (50 jugadores)</h3></div>
                    <div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-gray-500">Total recaudado:</span><span className="text-white">R$ {pozo.total}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Premios (70%):</span><span className="text-yellow-500">R$ {pozo.premios}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Tu comisión (20%):</span><span className="text-green-500">R$ {pozo.bar}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Plataforma (10%):</span><span className="text-gray-500">R$ {pozo.plataforma}</span></div></div>
                  </div>
                )}

                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">{error}</div>}

                <div className="flex gap-4 pt-2">
                  <Link href="/bar/dashboard" className="flex-1"><button className="w-full border border-yellow-500/30 text-gray-400 py-3 rounded-lg">CANCELAR</button></Link>
                  <button onClick={handleCreateRoom} disabled={loading} className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg font-medium disabled:opacity-50"><span className="relative z-10">{loading ? "CREANDO..." : "CREAR SALA"}</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}