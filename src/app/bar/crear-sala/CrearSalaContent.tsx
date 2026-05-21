"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Crown, Trophy, Zap,
  Globe, MapPin, ChevronDown, Users
} from "lucide-react";
import { translations, type Locale } from "@/messages";

// Función para detectar idioma inicial (exactamente igual a la landing)
function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";

  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") {
    return savedLocale;
  }

  const browserLanguage =
    navigator.language || (navigator.languages && navigator.languages[0]) || "";

  const normalizedLanguage = browserLanguage.toLowerCase();

  if (normalizedLanguage.startsWith("es")) return "es";
  if (normalizedLanguage.startsWith("pt")) return "pt-BR";

  return "pt-BR";
}

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

export default function CrearSalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barIdParam = searchParams.get("barId");

  // Estado del idioma (exactamente igual a la landing)
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const t = translations[locale];

  const [barId, setBarId] = useState<string>("");
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

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamHomeId, setSelectedTeamHomeId] = useState<string>("");
  const [selectedTeamAwayId, setSelectedTeamAwayId] = useState<string>("");
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");

  const isMundial = selectedContinent === "7";

  // Detectar idioma al inicio (exactamente igual a la landing)
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  // Guardar idioma en localStorage (exactamente igual a la landing)
  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userData);

    if (barIdParam) {
      setBarId(barIdParam);
    } else if (user.role === "bar") {
      setBarId(user.barId || "");
    } else if (user.role === "owner") {
      console.error("No se especificó barId para crear sala");
      router.push("/bar/dashboard");
    }
  }, [router, barIdParam]);

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
    if (!selectedContinent) {
      setCountries([]);
      setTournaments([]);
      setTeams([]);
      return;
    }

    setSelectedCountry("");
    setSelectedTournament("");
    setSelectedTeamHomeId("");
    setSelectedTeamAwayId("");
    setTeams([]);
    setTournaments([]);
    setCountries([]);

    const continentId = parseInt(selectedContinent);

    if (continentId === 7) {
      fetchInternationalTournaments();
      fetchInternationalTeams();
    } else {
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
    if (!barId) {
      setError(t.createRoom.errors.noBar);
      return;
    }

    if (!selectedTeamHomeId || !selectedTeamAwayId) {
      setError(t.createRoom.errors.selectTeams);
      return;
    }
    if (selectedTeamHomeId === selectedTeamAwayId) {
      setError(t.createRoom.errors.sameTeams);
      return;
    }
    if (!matchDate || !matchTime) {
      setError(t.createRoom.errors.requiredDateTime);
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
          barId: barId,
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

  if (!isLocaleReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
                <img
                  src="/logo-jugadaplay.svg"
                  alt="Jugada Play"
                  className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                />
            </Link>

            {/* Selector de idioma - EXACTAMENTE IGUAL a la landing page */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs tracking-wide">
                {t.header.language}
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none focus:border-yellow-500/60"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
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
                  {t.createRoom.title}{" "}
                  <span className="text-yellow-500 font-medium">{t.createRoom.titleHighlight}</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-2">{t.createRoom.subtitle}</p>
              </div>

              <div className="p-8 space-y-6">
                {/* SELECTOR DE CONTINENTE */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {t.createRoom.continent}
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

                {/* SELECTOR DE PAÍS */}
                {selectedContinent && !isMundial && countries.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {t.createRoom.country}
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
                    {loadingCountries && <p className="text-gray-500 text-xs">{t.common.loading}</p>}
                  </div>
                )}

                {/* SELECTOR DE TORNEO */}
                {selectedContinent && tournaments.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> {t.createRoom.tournament}
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
                    {loadingTournaments && <p className="text-gray-500 text-xs">{t.common.loading}</p>}
                  </div>
                )}

                {/* SELECTORES DE EQUIPOS */}
                {selectedContinent && teams.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> {t.createRoom.homeTeam}
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
                        <Users className="w-4 h-4" /> {t.createRoom.awayTeam}
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

                    {loadingTeams && <p className="text-gray-500 text-xs text-center">{t.common.loading}</p>}
                  </>
                )}

                {/* FECHA Y HORA */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">{t.createRoom.date}</label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">{t.createRoom.time}</label>
                    <input
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                </div>

                {/* CIERRE DE PREDICCIONES */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.createRoom.predictionClose}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cierre"
                        checked={cierrePredictions === "inicio"}
                        onChange={() => setCierrePredictions("inicio")}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <span className="text-gray-400 text-sm">{t.createRoom.closeAtStart}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cierre"
                        checked={cierrePredictions === "15min"}
                        onChange={() => setCierrePredictions("15min")}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <span className="text-gray-400 text-sm">{t.createRoom.close15min}</span>
                    </label>
                  </div>
                </div>

                {/* TIPO DE SALA */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.createRoom.roomType}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTipoSala("practice")}
                      className={`p-4 rounded-lg border transition-all ${tipoSala === "practice"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-yellow-500/20 hover:border-yellow-500/40"
                        }`}
                    >
                      <div className="text-white font-medium">{t.createRoom.practiceMode}</div>
                      <div className="text-gray-500 text-xs">{t.createRoom.noRealMoney}</div>
                    </button>
                    <button
                      onClick={() => setTipoSala("paid")}
                      className={`p-4 rounded-lg border transition-all ${tipoSala === "paid"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-yellow-500/20 hover:border-yellow-500/40"
                        }`}
                    >
                      <div className="text-white font-medium">{t.createRoom.paidMode}</div>
                      <div className="text-gray-500 text-xs">{t.createRoom.realPrizes}</div>
                    </button>
                  </div>
                </div>

                {/* VALOR DE PREDICCIÓN */}
                {tipoSala === "paid" && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">{t.createRoom.predictionValue}</label>
                    <input
                      type="number"
                      value={valorPrediccion}
                      onChange={(e) => setValorPrediccion(e.target.value)}
                      min="1"
                      max="50"
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                )}

                {/* RESUMEN DEL POZO */}
                {tipoSala === "paid" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-white text-sm font-medium">{t.createRoom.prizeSummary}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.createRoom.totalCollected}</span>
                        <span className="text-white font-medium">R$ {pozo.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.createRoom.prizes70}</span>
                        <span className="text-yellow-500 font-medium">R$ {pozo.premios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.createRoom.yourCommission20}</span>
                        <span className="text-green-500 font-medium">R$ {pozo.bar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.createRoom.platform10}</span>
                        <span className="text-gray-500">R$ {pozo.plataforma}</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Link href="/bar/dashboard" className="flex-1">
                    <button className="w-full border border-yellow-500/30 text-gray-400 py-3 rounded-lg hover:bg-yellow-500/5 transition-all">
                      {t.createRoom.cancelButton}
                    </button>
                  </Link>
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition-all"
                  >
                    <span className="relative z-10">{loading ? t.common.loading : t.createRoom.createButton}</span>
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