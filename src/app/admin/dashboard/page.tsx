//src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, Calendar, DollarSign,
  TrendingUp, AlertCircle, Menu, X, Search,
  Download, LogOut, Settings, PlayCircle,
  Filter, Trash2, RefreshCw, Plus, Check
} from "lucide-react";
import { translations, type Locale } from "@/messages";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") return savedLocale;
  const browserLanguage = navigator.language || "";
  if (browserLanguage.toLowerCase().startsWith("es")) return "es";
  return "pt-BR";
}

interface DisplayMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  leagueName: string;
  country: string;
  season: number;
  date: string;
  status: string;
}

interface MatchFilters {
  leagueId: string;
  season: string;
  dateFrom: string;
  dateTo: string;
  teamName: string;
}

interface League {
  league_id: number;
  league_name: string;
  league_country: string;
}

interface LiveFixture {
  id: number;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  league_name: string;
  league_country: string;
  status: string;
  goals_home: number;
  goals_away: number;
  elapsed: number;
  venue: string;
}

interface AvailableLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  season: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  const [stats] = useState({
    ingresosTotales: 45230,
    baresActivos: 12,
    jugadoresUnicos: 2840,
    prediccionesPagadas: 52000,
  });

  // Estados para partidos reales desde la BD
  const [filteredMatches, setFilteredMatches] = useState<DisplayMatch[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filters, setFilters] = useState<MatchFilters>({
    leagueId: "",
    season: "",
    dateFrom: "",
    dateTo: "",
    teamName: "",
  });

  // Estados para partidos en curso
  const [liveFixtures, setLiveFixtures] = useState<LiveFixture[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  // Estados para gestión de ligas
  const [availableLeagues, setAvailableLeagues] = useState<AvailableLeague[]>([]);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [leagueFilters, setLeagueFilters] = useState({
    country: "",
    season: "",
    search: ""
  });
  const [showOnlySynced, setShowOnlySynced] = useState(false);
  const [syncedLeagues, setSyncedLeagues] = useState<any[]>([]);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);

  // Idioma
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  // Autenticación y carga inicial
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      if (parsedUser.role === "bar") router.push("/bar/dashboard");
      else if (parsedUser.role === "player") router.push("/jugador/dashboard");
      else router.push("/login");
      return;
    }

    setUser(parsedUser);
    setLoading(false);

    // Cargar datos iniciales
    loadFixtures();
    loadLeagues();
    console.log("🟢 Cambiando a pestaña ACTIVOS"); // ← LOG
    setActiveTab("activos");
    loadLiveFixtures();

  }, [router]);

  // Cargar partidos con filtros
  const loadFixtures = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.leagueId) params.append("leagueId", filters.leagueId);
      if (filters.season) params.append("season", filters.season);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.teamName) params.append("teamName", filters.teamName);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/fixtures?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const formattedMatches: DisplayMatch[] = data.data.map((fixture: any) => ({
          id: fixture.id,
          homeTeam: fixture.home_team_name,
          awayTeam: fixture.away_team_name,
          homeLogo: fixture.home_team_logo,
          awayLogo: fixture.away_team_logo,
          leagueName: fixture.league_name,
          country: fixture.league_country,
          season: fixture.season,
          date: fixture.match_date,
          status: fixture.status
        }));
        setFilteredMatches(formattedMatches);
      }
    } catch (error) {
      console.error("Error cargando partidos:", error);
    }
  };

  // Cargar ligas disponibles para el filtro de partidos
  const loadLeagues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/leagues`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeagues(data.data);
      }
    } catch (error) {
      console.error("Error cargando ligas:", error);
    }
  };

  // Cargar partidos en curso
  const loadLiveFixtures = async () => {
    setLoadingLive(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/live-fixtures`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      console.log("🔍 Respuesta completa de live-fixtures:", data); // ← LOG 1

      if (data.success) {
        console.log("📋 Partidos en curso recibidos:", data.data.length); // ← LOG 2
        console.log("📋 Primer partido:", data.data[0]); // ← LOG 3
        setLiveFixtures(data.data);
      } else {
        console.error("❌ Error en respuesta:", data.message);
      }
    } catch (error) {
      console.error("Error cargando partidos en curso:", error);
    } finally {
      setLoadingLive(false);
    }
  };

  // Cargar ligas disponibles desde API-Football
  const loadAvailableLeagues = async () => {
    setLoadingLeagues(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/available-leagues`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableLeagues(data.data);
      }
    } catch (error) {
      console.error("Error cargando ligas:", error);
    } finally {
      setLoadingLeagues(false);
    }
  };

  // Cargar ligas ya sincronizadas por el admin
  const loadUserLeagues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user-leagues`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSyncedLeagues(data.data);
      }
    } catch (error) {
      console.error("Error cargando ligas sincronizadas:", error);
    }
  };

  // Agregar ligas seleccionadas
  const addSelectedLeagues = async () => {
    if (selectedLeagueIds.length === 0) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const token = localStorage.getItem("token");
      const leaguesToAdd = availableLeagues.filter(league => selectedLeagueIds.includes(league.id));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add-leagues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ leagues: leaguesToAdd })
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message,
          stats: data.stats
        });
        setSelectedLeagueIds([]);
        // Recargar las listas
        await loadUserLeagues();
        await loadAvailableLeagues();
      } else {
        setSyncResult({
          success: false,
          message: data.message || "Error al agregar ligas"
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: "Error de conexión con el servidor"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Filtrar ligas según los filtros y el checkbox
  const getFilteredLeagues = () => {
    let filtered = availableLeagues;

    // 1. Filtrar por país
    if (leagueFilters.country !== "") {
      filtered = filtered.filter(league => league.country === leagueFilters.country);
    }

    // 2. Filtrar por temporada
    if (leagueFilters.season !== "") {
      filtered = filtered.filter(league => league.season.toString() === leagueFilters.season);
    }

    // 3. Filtrar por búsqueda de nombre
    if (leagueFilters.search !== "") {
      const searchLower = leagueFilters.search.toLowerCase();
      filtered = filtered.filter(league =>
        league.name.toLowerCase().includes(searchLower) ||
        league.country.toLowerCase().includes(searchLower)
      );
    }

    // 4. Mostrar solo ligas sincronizadas si el checkbox está marcado
    if (showOnlySynced) {
      const syncedIds = syncedLeagues.map(sl => sl.league_id);
      filtered = filtered.filter(league => syncedIds.includes(league.id));
    }

    return filtered;
  };

  // Obtener países únicos para el filtro
  const getUniqueCountries = () => {
    const countries = [...new Set(availableLeagues.map(league => league.country))];
    return countries.sort();
  };

  // Ejecutar loadFixtures cuando cambian los filtros de partidos
  useEffect(() => {
    if (!loading) {
      loadFixtures();
    }
  }, [filters, loading]);

  const clearFilters = () => {
    setFilters({
      leagueId: "",
      season: "",
      dateFrom: "",
      dateTo: "",
      teamName: "",
    });
  };

  const syncApi = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message,
          stats: data.stats
        });
        await loadFixtures();
        await loadLeagues();
      } else {
        setSyncResult({
          success: false,
          message: data.message || "Error al sincronizar"
        });
      }
    } catch (error) {
      console.error("Error sincronizando:", error);
      setSyncResult({
        success: false,
        message: "Error de conexión con el servidor"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Formatear fecha de manera amigable según el idioma
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.floor((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let dayText = '';
    if (diffDays === 0) {
      dayText = locale === 'pt-BR' ? 'Hoje' : 'Hoy';
    } else if (diffDays === 1) {
      dayText = locale === 'pt-BR' ? 'Amanhã' : 'Mañana';
    } else if (diffDays === -1) {
      dayText = locale === 'pt-BR' ? 'Ontem' : 'Ayer';
    } else {
      if (locale === 'pt-BR') {
        dayText = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
      } else {
        dayText = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
      }
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeText = `${hours}:${minutes}`;

    if (locale === 'es' && !dayText.includes('Hoy') && !dayText.includes('Mañana') && !dayText.includes('Ayer')) {
      dayText = dayText.charAt(0).toUpperCase() + dayText.slice(1);
    }

    return `${dayText} ${timeText}`;
  };

  // Obtener texto del estado del partido
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      '1H': 'Primer tiempo',
      'HT': 'Medio tiempo',
      '2H': 'Segundo tiempo',
      'ET': 'Tiempo extra',
      'BT': 'Pausa',
      'P': 'Penales',
      'INT': 'Interrumpido',
      'LIVE': 'En vivo'
    };
    return statusMap[status] || 'En curso';
  };

  if (loading || !isLocaleReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </div>
    );
  }

  const t = translations[locale];

  const topBares = [
    { nome: "El Goloso FC", receita: 4520, partidos: 24 },
    { nome: "Bar do Zé", receita: 3890, partidos: 18 },
    { nome: "Arena Pub", receita: 3120, partidos: 15 },
  ];

  const pendientes = [
    { tipo: "pagos", cantidad: 15, valor: 3200 },
    { tipo: "bares_aprovacao", cantidad: 8 },
    { tipo: "reclamos", cantidad: 3 },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img src="/logo-jugadaplay.svg" alt="Jugada Play" className="h-10 md:h-12 lg:h-14 w-auto object-contain" />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label htmlFor="locale-select" className="text-gray-400 text-xs">{t.common.language}</label>
                <select
                  id="locale-select"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none"
                >
                  <option value="pt-BR">PT</option>
                  <option value="es">ES</option>
                </select>
              </div>
              <div className="w-px h-6 bg-yellow-500/20"></div>
              <span className="text-yellow-500 text-sm">{user?.email || "ADMIN@JUGADAPLAY.COM"}</span>
              <div className="w-px h-6 bg-yellow-500/20"></div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm">
                <LogOut className="w-4 h-4" />
                {t.admin.logout}
              </button>
              <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <button className="md:hidden text-yellow-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="mobile-locale-select" className="text-gray-400 text-xs">{t.common.language}</label>
                  <select
                    id="mobile-locale-select"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none"
                  >
                    <option value="pt-BR">PT</option>
                    <option value="es">ES</option>
                  </select>
                </div>
                <span className="text-gray-400 text-sm">{user?.email || "ADMIN@JUGADAPLAY.COM"}</span>
                <button onClick={handleLogout} className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left">
                  {t.admin.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex gap-2">
              <Link href="/admin/usuarios">
                <button className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg hover:border-yellow-500/50">
                  <Users className="w-4 h-4" />
                  {t.admin.manageUsers}
                </button>
              </Link>
              <button className="p-2 border border-yellow-500/30 rounded-lg hover:border-yellow-500/50">
                <Download className="w-4 h-4 text-yellow-500" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder={t.admin.search} className="bg-black border border-yellow-500/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/60" />
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-light text-white">R$ {stats.ingresosTotales.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{t.admin.stats.totalRevenue}</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Building2 className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.baresActivos}</div>
              <div className="text-xs text-gray-500">{t.admin.stats.activeBars}</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Users className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.jugadoresUnicos.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{t.admin.stats.uniquePlayers}</div>
            </div>
            <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">{stats.prediccionesPagadas.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{t.admin.stats.paidPredictions}</div>
            </div>
          </div>

          {/* PENDING ALERTS */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {pendientes.map((item, idx) => (
              <div key={idx} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-white text-sm capitalize">
                      {item.tipo === "pagos" && t.admin.pending.pendingPayments}
                      {item.tipo === "bares_aprovacao" && t.admin.pending.pendingBars}
                      {item.tipo === "reclamos" && t.admin.pending.claims}
                    </span>
                  </div>
                  <span className="text-yellow-500 font-bold">{item.cantidad}</span>
                </div>
                {item.valor && <p className="text-gray-500 text-xs mt-2">R$ {item.valor.toLocaleString()}</p>}
                <button className="mt-3 text-yellow-500 text-xs hover:text-yellow-400">{t.admin.pending.viewDetails} →</button>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="flex space-x-6 mb-6 border-b border-yellow-500/20 overflow-x-auto">
            <button
              onClick={() => setActiveTab("general")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "general" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-400"}`}
            >
              {t.admin.tabs.topBars}
            </button>
            <button
              onClick={() => setActiveTab("partidos")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "partidos" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-400"}`}
            >
              {t.admin.tabs.upcomingMatches}
            </button>
            <button
              onClick={() => setActiveTab("activos")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "activos" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-400"}`}
            >
              {t.admin.tabs.activeMatches}
            </button>
            <button
              onClick={() => {
                setActiveTab("ligas");
                loadAvailableLeagues();
                loadUserLeagues();
              }}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "ligas" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-400"}`}
            >
              Gestión de Ligas
            </button>
          </div>

          {/* TAB CONTENT - GENERAL */}
          {activeTab === "general" && (
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-yellow-500/20">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-xs text-gray-500">#</th>
                    <th className="px-6 py-4 text-xs text-gray-500">{t.admin.topBars.bar}</th>
                    <th className="px-6 py-4 text-xs text-gray-500">{t.admin.topBars.revenue}</th>
                    <th className="px-6 py-4 text-xs text-gray-500">{t.admin.topBars.matches}</th>
                  </tr>
                </thead>
                <tbody>
                  {topBares.map((bar, idx) => (
                    <tr key={idx} className="hover:bg-yellow-500/5">
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

          {/* TAB CONTENT - PARTIDOS (próximos partidos) */}
          {activeTab === "partidos" && (
            <div className="space-y-6">
              <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-white font-medium">Filtrar partidos</h3>
                  </div>
                  <button
                    onClick={syncApi}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-sm hover:bg-yellow-500/20 transition-all disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sincronizar
                      </>
                    )}
                  </button>
                </div>

                {syncResult && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${syncResult.success
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {syncResult.message}
                    {syncResult.stats && (
                      <div className="text-xs mt-1">
                        ✅ Nuevos: {syncResult.stats.newMatches} |
                        🔄 Actualizados: {syncResult.stats.updatedMatches} |
                        📊 Total: {syncResult.stats.totalProcessed}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Liga</label>
                    <select
                      value={filters.leagueId}
                      onChange={(e) => setFilters({ ...filters, leagueId: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Todas</option>
                      {leagues.map(league => (
                        <option key={league.league_id} value={league.league_id.toString()}>
                          {league.league_country} - {league.league_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Temporada</label>
                    <input
                      type="text"
                      placeholder="2026"
                      value={filters.season}
                      onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Desde</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Hasta</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Equipo</label>
                    <input
                      type="text"
                      placeholder="Buscar equipo..."
                      value={filters.teamName}
                      onChange={(e) => setFilters({ ...filters, teamName: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {filteredMatches.length === 0 ? (
                <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6 text-gray-400 text-sm">
                  No se encontraron partidos. Haz clic en "Sincronizar" para cargar partidos desde API-Football.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map((match) => (
                    <div key={match.id} className={`bg-black/30 border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${new Date(match.date).toDateString() === new Date().toDateString()
                      ? 'border-yellow-500/60 bg-yellow-500/5'
                      : 'border-yellow-500/20'
                      }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-5" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                          <span className="text-white font-medium">{match.homeTeam}</span>
                          <span className="text-gray-500 text-sm">vs</span>
                          {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-5" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                          <span className="text-white font-medium">{match.awayTeam}</span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {match.leagueName} • {match.country} • {formatMatchDate(match.date)}
                        </p>
                      </div>
                      <div>
                        <button className="border border-yellow-500/30 text-gray-400 px-4 py-1.5 text-xs rounded-sm cursor-not-allowed opacity-60" disabled>
                          Solo visualización
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT - ACTIVOS (partidos en curso) */}
          {activeTab === "activos" && (
            <div className="space-y-4">
              {loadingLive ? (
                <div className="text-gray-400 text-sm">Cargando partidos en curso...</div>
              ) : liveFixtures.length === 0 ? (
                <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6 text-gray-400 text-sm">
                  No hay partidos en curso en este momento.
                </div>
              ) : (
                liveFixtures.map((match) => (
                  <div key={match.id} className="bg-black/30 border border-yellow-500/20 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-green-500 text-xs tracking-wide">
                            {getStatusText(match.status)}
                          </span>
                        </div>
                        <h3 className="text-white text-lg font-medium">
                          {match.home_team_name} vs {match.away_team_name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">
                          {match.league_name} • {match.league_country}
                        </p>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-white text-sm">{match.home_team_name}</div>
                          <div className="text-3xl text-yellow-500 font-bold">{match.goals_home ?? 0}</div>
                        </div>
                        <div className="text-gray-500 text-xl font-light">-</div>
                        <div className="text-center">
                          <div className="text-white text-sm">{match.away_team_name}</div>
                          <div className="text-3xl text-yellow-500 font-bold">{match.goals_away ?? 0}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{match.elapsed ? `${match.elapsed}'` : 'Por confirmar'}</div>
                        {match.venue && <div className="text-xs text-gray-600 mt-1">{match.venue}</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT - GESTIÓN DE LIGAS */}
          {activeTab === "ligas" && (
            <div className="space-y-6">
              {/* Panel de filtros */}
              <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-5">
                <h3 className="text-white font-medium mb-4">Filtrar ligas disponibles</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">País</label>
                    <select
                      value={leagueFilters.country}
                      onChange={(e) => setLeagueFilters({ ...leagueFilters, country: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Todos los países</option>
                      {getUniqueCountries().map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Temporada</label>
                    <select
                      value={leagueFilters.season}
                      onChange={(e) => setLeagueFilters({ ...leagueFilters, season: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Todas</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Buscar liga</label>
                    <input
                      type="text"
                      placeholder="Nombre de la liga..."
                      value={leagueFilters.search}
                      onChange={(e) => setLeagueFilters({ ...leagueFilters, search: e.target.value })}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Checkbox para mostrar solo ligas sincronizadas */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-yellow-500/20">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlySynced}
                      onChange={(e) => setShowOnlySynced(e.target.checked)}
                      className="w-4 h-4 rounded border-yellow-500/30 bg-black text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">
                      Mostrar solo ligas sincronizadas
                    </span>
                  </label>

                  {showOnlySynced && syncedLeagues.length === 0 && (
                    <span className="text-xs text-yellow-500">
                      (No hay ligas sincronizadas aún)
                    </span>
                  )}
                </div>
              </div>

              {loadingLeagues ? (
                <div className="text-gray-400 text-center py-12">Cargando ligas disponibles...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredLeagues().map((league) => (
                      <div
                        key={league.id}
                        onClick={() => {
                          // No permitir seleccionar si ya está sincronizada
                          if (!syncedLeagues.some(sl => sl.league_id === league.id)) {
                            setSelectedLeagueIds(prev =>
                              prev.includes(league.id) ? prev.filter(id => id !== league.id) : [...prev, league.id]
                            );
                          }
                        }}
                        className={`bg-black/30 border rounded-xl p-4 transition-all ${syncedLeagues.some(sl => sl.league_id === league.id)
                          ? 'border-green-500/60 bg-green-500/10 cursor-default'
                          : selectedLeagueIds.includes(league.id)
                            ? 'border-yellow-500/60 bg-yellow-500/5 cursor-pointer'
                            : 'border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {league.logo && (
                            <img
                              src={league.logo}
                              alt=""
                              className="w-8 h-8 object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-white font-medium">
                              {league.name}
                              {syncedLeagues.some(sl => sl.league_id === league.id) && (
                                <span className="ml-2 text-xs text-green-400">(Sincronizada)</span>
                              )}
                            </h3>
                            <p className="text-gray-500 text-xs">{league.country} • Temporada {league.season}</p>
                          </div>
                          {!syncedLeagues.some(sl => sl.league_id === league.id) && (
                            <div className={`w-5 h-5 rounded-full border ${selectedLeagueIds.includes(league.id)
                              ? 'bg-yellow-500 border-yellow-500 flex items-center justify-center'
                              : 'border-gray-500'
                              }`}>
                              {selectedLeagueIds.includes(league.id) && <Check className="w-3 h-3 text-black" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {getFilteredLeagues().length === 0 && (
                    <div className="text-gray-400 text-center py-12">No se encontraron ligas</div>
                  )}
                </>
              )}

              {/* Botón flotante para agregar ligas seleccionadas */}
              {selectedLeagueIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                  <button
                    onClick={addSelectedLeagues}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-400 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {syncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Agregar {selectedLeagueIds.length} liga(s)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}