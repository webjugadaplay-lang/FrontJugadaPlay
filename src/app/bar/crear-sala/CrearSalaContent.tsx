//src/app/bar/crear-sala/CrearSalaContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Trophy, Zap,
  ChevronDown, Users, Calendar,
  Clock, AlertCircle
} from "lucide-react";
import { translations, type Locale } from "@/messages";

// Función para detectar idioma inicial
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

// Interfaces para los datos
interface League {
  id: number;
  league_id: number;
  league_name: string;
  league_country: string | null;
  league_logo: string | null;
  season_2025: boolean;
  season_2026: boolean;
}

interface Season {
  value: number;
  label: string;
}

interface Fixture {
  id: number;
  league_id: number;
  league_name: string;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_logo: string | null;
  match_date: string;
  venue: string | null;
  status: string;
}

export default function CrearSalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barIdParam = searchParams.get("barId");

  // Estado del idioma
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const t = translations[locale];

  // Estado del formulario
  const [barId, setBarId] = useState<string>("");
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("10");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para los datos
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>("");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

  // Estados de carga
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  // ============ NUEVA FUNCIÓN DE UTILIDAD PARA FILTRAR PARTIDOS FUTUROS ============
  /**
   * Filtra los partidos para mostrar solo aquellos que son futuros
   * y los ordena por fecha (del más cercano al más lejano)
   */
  const filterFutureFixtures = (fixturesList: Fixture[]): Fixture[] => {
    const now = new Date();
    
    // Paso 1: Filtrar solo partidos futuros
    const futureFixtures = fixturesList.filter((fixture) => {
      const matchDate = new Date(fixture.match_date);
      return matchDate > now;
    });
    
    // Paso 2: Ordenar por fecha (más cercano primero)
    const sortedFixtures = futureFixtures.sort((a, b) => {
      const dateA = new Date(a.match_date).getTime();
      const dateB = new Date(b.match_date).getTime();
      return dateA - dateB; // Orden ascendente (más cercano primero)
    });
    
    // Paso 3: (OPCIONAL) Limitar a máximo 50 partidos para no sobrecargar el select
    // Si quieres limitar, descomenta la siguiente línea:
    // return sortedFixtures.slice(0, 50);
    
    return sortedFixtures;
  };
  // ============ FIN NUEVA FUNCIÓN ============

  // Detectar idioma al inicio
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  // Guardar idioma en localStorage
  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  // Obtener barId
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

  // Función helper para manejar respuestas del servidor
  const handleApiResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    // Si no es JSON, algo salió mal
    const text = await response.text();
    console.error("Respuesta no JSON:", text.substring(0, 200));
    throw new Error("El servidor devolvió una respuesta inválida");
  };

  // Cargar ligas al iniciar
  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    setLoadingLeagues(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching leagues from:", `${process.env.NEXT_PUBLIC_API_URL}/api/league`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/league`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await handleApiResponse(response);

      if (data.success) {
        setLeagues(data.data);
      } else {
        setError(data.message || "Error al cargar las ligas");
      }
    } catch (error: any) {
      console.error("Error cargando ligas:", error);
      setError(`Error al cargar las ligas: ${error.message}`);
    } finally {
      setLoadingLeagues(false);
    }
  };

  // Cuando se selecciona una liga, cargar sus temporadas
  useEffect(() => {
    if (!selectedLeagueId) {
      setSeasons([]);
      setSelectedSeason("");
      setFixtures([]);
      setSelectedFixtureId("");
      setSelectedFixture(null);
      return;
    }

    fetchSeasons(selectedLeagueId);
  }, [selectedLeagueId]);

  const fetchSeasons = async (leagueId: string) => {
    setLoadingSeasons(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/league/${leagueId}/seasons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await handleApiResponse(response);

      if (data.success) {
        setSeasons(data.data);
        if (data.data.length > 0) {
          const latestSeason = data.data[data.data.length - 1].value.toString();
          setSelectedSeason(latestSeason);
        }
      } else {
        setError(data.message || "Error al cargar las temporadas");
      }
    } catch (error: any) {
      console.error("Error cargando temporadas:", error);
      setError(`Error al cargar temporadas: ${error.message}`);
    } finally {
      setLoadingSeasons(false);
    }
  };

  // Cuando se selecciona una liga y temporada, cargar los fixtures
  useEffect(() => {
    if (!selectedLeagueId || !selectedSeason) {
      setFixtures([]);
      setSelectedFixtureId("");
      setSelectedFixture(null);
      return;
    }

    fetchFixtures(selectedLeagueId, selectedSeason);
  }, [selectedLeagueId, selectedSeason]);

  // ============ FUNCIÓN MODIFICADA CON FILTRO DE PARTIDOS FUTUROS ============
  const fetchFixtures = async (leagueId: string, season: string) => {
    setLoadingFixtures(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/league/fixtures?leagueId=${leagueId}&season=${season}`;
      console.log("Fetching fixtures from:", url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await handleApiResponse(response);

      if (data.success) {
        // ============ APLICAR FILTRO DE PARTIDOS FUTUROS ============
        const futureFixtures = filterFutureFixtures(data.data);
        
        // Log para debug (puedes eliminar esto en producción)
        console.log(`Total partidos recibidos: ${data.data.length}`);
        console.log(`Partidos futuros disponibles: ${futureFixtures.length}`);
        // ============ FIN DEL FILTRO ============
        
        setFixtures(futureFixtures);
        
        // Si no hay partidos futuros, mostrar un mensaje amigable
        if (futureFixtures.length === 0) {
          setError("No hay partidos futuros disponibles para esta liga y temporada");
        }
      } else {
        setError(data.message || "Error al cargar los partidos");
      }
    } catch (error: any) {
      console.error("Error cargando partidos:", error);
      setError(`Error al cargar partidos: ${error.message}`);
    } finally {
      setLoadingFixtures(false);
    }
  };
  // ============ FIN FUNCIÓN MODIFICADA ============

  // Cuando se selecciona un fixture, guardarlo
  useEffect(() => {
    if (selectedFixtureId) {
      const fixture = fixtures.find(f => f.id.toString() === selectedFixtureId);
      setSelectedFixture(fixture || null);
    } else {
      setSelectedFixture(null);
    }
  }, [selectedFixtureId, fixtures]);

  const handleCreateRoom = async () => {
    if (!barId) {
      setError(t.createRoom.errors.noBar);
      return;
    }

    if (!selectedFixture) {
      setError(t.createRoom.errors.selectMatch || "Debes seleccionar un partido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId: barId,
          fixture_id: selectedFixture.id,
          entry_fee: tipoSala === "paid" ? parseFloat(valorPrediccion) : 0,
          prediction_close_minutes: cierrePredictions === "15min" ? 15 : 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear sala");
      }

      const data = await response.json();

      if (data.success) {
        router.push("/bar/dashboard");
      } else {
        throw new Error(data.message || "Error al crear sala");
      }
    } catch (err: any) {
      console.error("Error creating room:", err);
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

  // Formatear fecha para mostrar
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'pt-BR'),
      time: date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

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
              <Image
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                width={140}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Selector de idioma */}
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
                {/* SELECTOR DE LIGA */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> {t.createRoom.league}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLeagueId}
                      onChange={(e) => setSelectedLeagueId(e.target.value)}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                      disabled={loadingLeagues}
                    >
                      <option value="">{t.createRoom.selectLeague}</option>
                      {leagues.map((league) => (
                        <option key={league.id} value={league.league_id}>
                          {league.league_country ? `${league.league_country} - ` : ''}{league.league_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                  </div>
                  {loadingLeagues && <p className="text-gray-500 text-xs">{t.common.loading}</p>}
                </div>

                {/* SELECTOR DE TEMPORADA */}
                {selectedLeagueId && seasons.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {t.createRoom.season}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                        disabled={loadingSeasons}
                      >
                        <option value="">{t.createRoom.selectSeason}</option>
                        {seasons.map((season) => (
                          <option key={season.value} value={season.value}>
                            {season.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingSeasons && <p className="text-gray-500 text-xs">{t.common.loading}</p>}
                  </div>
                )}

                {/* SELECTOR DE PARTIDO - MODIFICADO PARA MOSTRAR SOLO PARTIDOS FUTUROS */}
                {selectedLeagueId && selectedSeason && (
                  <div className="space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" /> {t.createRoom.match}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFixtureId}
                        onChange={(e) => setSelectedFixtureId(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-yellow-500/60"
                        disabled={loadingFixtures}
                      >
                        <option value="">{t.createRoom.selectMatch}</option>
                        {fixtures.map((fixture) => {
                          const { date, time } = formatMatchDate(fixture.match_date);
                          return (
                            <option key={fixture.id} value={fixture.id}>
                              {fixture.home_team_name} vs {fixture.away_team_name} - {date} {time}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" />
                    </div>
                    {loadingFixtures && <p className="text-gray-500 text-xs">{t.common.loading}</p>}
                    
                    {/* ============ MENSAJES MEJORADOS PARA CUANDO NO HAY PARTIDOS ============ */}
                    {!loadingFixtures && fixtures.length === 0 && selectedLeagueId && selectedSeason && (
                      <div className="flex items-center gap-2 text-yellow-500/70 text-xs bg-yellow-500/5 p-2 rounded">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>
                          {error && error.includes("No hay partidos futuros") 
                            ? "No hay partidos futuros disponibles para esta liga y temporada" 
                            : t.createRoom.noMatches || "No hay partidos disponibles"}
                        </span>
                      </div>
                    )}
                    {/* ============ FIN MENSAJES MEJORADOS ============ */}
                  </div>
                )}

                {/* INFO DEL PARTIDO SELECCIONADO */}
                {selectedFixture && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm font-medium">Partido seleccionado</h3>
                      <span className="text-xs text-green-500">✓</span>
                    </div>
                    <div className="text-center mb-3">
                      <div className="text-white font-medium">
                        {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {selectedFixture.league_name}
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatMatchDate(selectedFixture.match_date).date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMatchDate(selectedFixture.match_date).time}
                      </span>
                    </div>
                    {selectedFixture.venue && (
                      <div className="text-center text-gray-600 text-xs mt-2">
                        {selectedFixture.venue}
                      </div>
                    )}
                  </div>
                )}

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

                {error && !error.includes("No hay partidos futuros") && (
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
                    disabled={loading || !selectedFixture || fixtures.length === 0}
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