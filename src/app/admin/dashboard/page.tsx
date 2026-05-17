"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, Calendar, DollarSign,
  TrendingUp, AlertCircle, Menu, X, Search,
  Download, LogOut, Settings, PlayCircle, Save,
  Plus, Minus, CheckCircle, Filter, Trash2, RefreshCw
} from "lucide-react";
import { translations, type Locale } from "@/messages";

// DATOS MOCKEADOS (simulan partidos desde API-Football)
const MOCK_MATCHES = [
  {
    id: 1,
    homeTeam: "Flamengo",
    awayTeam: "Fluminense",
    homeLogo: "https://cdn.api-football.com/images/teams/151.png",
    awayLogo: "https://cdn.api-football.com/images/teams/152.png",
    leagueName: "Brasileirão Série A",
    country: "Brasil",
    season: 2025,
    date: "2025-05-20T19:00:00",
    status: "NS"
  },
  {
    id: 2,
    homeTeam: "Palmeiras",
    awayTeam: "Corinthians",
    homeLogo: "https://cdn.api-football.com/images/teams/131.png",
    awayLogo: "https://cdn.api-football.com/images/teams/132.png",
    leagueName: "Brasileirão Série A",
    country: "Brasil",
    season: 2025,
    date: "2025-05-21T21:30:00",
    status: "NS"
  },
  {
    id: 3,
    homeTeam: "River Plate",
    awayTeam: "Boca Juniors",
    homeLogo: "https://cdn.api-football.com/images/teams/202.png",
    awayLogo: "https://cdn.api-football.com/images/teams/203.png",
    leagueName: "Liga Profesional Argentina",
    country: "Argentina",
    season: 2025,
    date: "2025-05-22T20:00:00",
    status: "NS"
  },
  {
    id: 4,
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeLogo: "https://cdn.api-football.com/images/teams/541.png",
    awayLogo: "https://cdn.api-football.com/images/teams/529.png",
    leagueName: "La Liga",
    country: "España",
    season: 2025,
    date: "2025-05-25T16:15:00",
    status: "NS"
  },
  {
    id: 5,
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    homeLogo: "https://cdn.api-football.com/images/teams/50.png",
    awayLogo: "https://cdn.api-football.com/images/teams/40.png",
    leagueName: "Premier League",
    country: "Inglaterra",
    season: 2025,
    date: "2025-05-26T17:30:00",
    status: "NS"
  },
  {
    id: 6,
    homeTeam: "São Paulo",
    awayTeam: "Santos",
    homeLogo: "https://cdn.api-football.com/images/teams/148.png",
    awayLogo: "https://cdn.api-football.com/images/teams/149.png",
    leagueName: "Brasileirão Série A",
    country: "Brasil",
    season: 2025,
    date: "2025-05-19T20:00:00",
    status: "NS"
  }
];

// Ligas mockeadas para los filtros
const MOCK_LEAGUES = [
  { id: 1, name: "Brasileirão Série A", country: "Brasil", season: 2025 },
  { id: 2, name: "Liga Profesional Argentina", country: "Argentina", season: 2025 },
  { id: 3, name: "La Liga", country: "España", season: 2025 },
  { id: 4, name: "Premier League", country: "Inglaterra", season: 2025 },
];

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") return savedLocale;
  const browserLanguage = navigator.language || "";
  if (browserLanguage.toLowerCase().startsWith("es")) return "es";
  return "pt-BR";
}

interface LiveMatch {
  id: string;
  name: string;
  team_home: string;
  team_away: string;
  match_date: string;
  current_score_home: number;
  current_score_away: number;
  status: string;
  bar?: { id: string; name: string; bar_name: string };
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

export default function AdminDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  const [stats, setStats] = useState({
    ingresosTotales: 45230,
    baresActivos: 12,
    jugadoresUnicos: 2840,
    prediccionesPagadas: 52000,
  });

  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loadingLiveMatches, setLoadingLiveMatches] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [editableScores, setEditableScores] = useState<Record<string, { home: number; away: number }>>({});

  const [matchesList] = useState<DisplayMatch[]>(MOCK_MATCHES);
  const [filteredMatches, setFilteredMatches] = useState<DisplayMatch[]>(MOCK_MATCHES);
  const [filters, setFilters] = useState<MatchFilters>({
    leagueId: "",
    season: "2025",
    dateFrom: "",
    dateTo: "",
    teamName: "",
  });

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

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

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      if (parsedUser.role === "bar") router.push("/bar/dashboard");
      else if (parsedUser.role === "player") router.push("/jugador/dashboard");
      else router.push("/login");
      return;
    }

    setUser(parsedUser);
    setLoading(false);

    setLiveMatches([
      {
        id: "1",
        name: "Flamengo vs Fluminense",
        team_home: "Flamengo",
        team_away: "Fluminense",
        match_date: new Date().toISOString(),
        current_score_home: 1,
        current_score_away: 0,
        status: "live",
        bar: { id: "bar1", name: "El Goloso FC", bar_name: "El Goloso FC" }
      }
    ]);
    setEditableScores({ "1": { home: 1, away: 0 } });
  }, [router]);

  // Aplicar filtros automáticamente cuando cambie cualquier filtro
  useEffect(() => {
    let filtered = [...matchesList];

    if (filters.leagueId) {
      const league = MOCK_LEAGUES.find(l => l.id.toString() === filters.leagueId);
      if (league) {
        filtered = filtered.filter(m => m.leagueName === league.name);
      }
    }

    if (filters.season) {
      filtered = filtered.filter(m => m.season.toString() === filters.season);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(m => m.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(m => m.date <= filters.dateTo);
    }

    if (filters.teamName) {
      const searchTerm = filters.teamName.toLowerCase();
      filtered = filtered.filter(m =>
        m.homeTeam.toLowerCase().includes(searchTerm) ||
        m.awayTeam.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredMatches(filtered);
  }, [filters, matchesList]);

  const clearFilters = () => {
    setFilters({
      leagueId: "",
      season: "2025",
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

  const handleScoreChange = (matchId: string, team: "home" | "away", delta: number) => {
    setEditableScores(prev => {
      const current = prev[matchId] || { home: 0, away: 0 };
      const newValue = Math.max(0, current[team] + delta);
      return { ...prev, [matchId]: { ...current, [team]: newValue } };
    });
  };

  const handleSaveScore = async (matchId: string) => {
    setSavingMatchId(matchId);
    setTimeout(() => {
      alert("Marcador actualizado (simulado)");
      setSavingMatchId(null);
    }, 500);
  };

  const handleFinishMatch = async (matchId: string) => {
    if (confirm("¿Finalizar este partido?")) {
      alert("Partido finalizado (simulado)");
    }
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

          {/* TAB CONTENT - PARTIDOS (con filtros automáticos y botón limpiar) */}
          {activeTab === "partidos" && (
            <div className="space-y-6">
              {/* PANEL DE FILTROS */}
              <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-white font-medium">Filtrar partidos</h3>
                  </div>

                  {/* BOTÓN DE SINCRONIZACIÓN */}
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

                {/* Mostrar resultado de la sincronización */}
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
                      {MOCK_LEAGUES.map(league => (
                        <option key={league.id} value={league.id}>{league.country} - {league.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Temporada</label>
                    <input
                      type="text"
                      placeholder="2025"
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

              {/* LISTADO DE PARTIDOS */}
              {filteredMatches.length === 0 ? (
                <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6 text-gray-400 text-sm">
                  No se encontraron partidos
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map((match) => (
                    <div key={match.id} className="bg-black/30 border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-5" />}
                          <span className="text-white font-medium">{match.homeTeam}</span>
                          <span className="text-gray-500 text-sm">vs</span>
                          {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-5" />}
                          <span className="text-white font-medium">{match.awayTeam}</span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {match.leagueName} • {match.country} • {new Date(match.date).toLocaleString()}
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

          {/* TAB CONTENT - ACTIVOS */}
          {activeTab === "activos" && (
            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6 text-gray-400 text-sm">
                  No hay partidos activos
                </div>
              ) : (
                liveMatches.map((match) => (
                  <div key={match.id} className="bg-black/30 border border-yellow-500/20 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PlayCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 text-xs">En vivo</span>
                        </div>
                        <h3 className="text-white text-lg font-medium">{match.team_home} vs {match.team_away}</h3>
                        <p className="text-gray-500 text-xs mt-1">{match.bar?.bar_name || "Bar"}</p>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleScoreChange(match.id, "home", -1)} className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500">
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                              <div className="text-white text-sm">{match.team_home}</div>
                              <div className="text-2xl text-yellow-500 font-bold">{editableScores[match.id]?.home ?? 0}</div>
                            </div>
                            <button onClick={() => handleScoreChange(match.id, "home", 1)} className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-gray-500 text-xl font-light">-</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleScoreChange(match.id, "away", -1)} className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500">
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                              <div className="text-white text-sm">{match.team_away}</div>
                              <div className="text-2xl text-yellow-500 font-bold">{editableScores[match.id]?.away ?? 0}</div>
                            </div>
                            <button onClick={() => handleScoreChange(match.id, "away", 1)} className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveScore(match.id)} disabled={savingMatchId === match.id} className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg">
                            <Save className="w-4 h-4" />
                            {savingMatchId === match.id ? "Guardando..." : "Guardar"}
                          </button>
                          <button onClick={() => handleFinishMatch(match.id)} className="flex items-center gap-2 border border-green-500/30 text-green-500 px-4 py-2 text-sm rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            Finalizar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}