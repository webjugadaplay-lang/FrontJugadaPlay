// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown, Users, Building2, Calendar, DollarSign,
  TrendingUp, AlertCircle, Menu, X, Search,
  Download, LogOut, Settings, PlayCircle, Save,
  Plus, Minus, CheckCircle
} from "lucide-react";
import { translations, type Locale } from "@/messages";

interface LiveMatch {
  id: string;
  name: string;
  team_home: string;
  team_away: string;
  match_date: string;
  current_score_home: number;
  current_score_away: number;
  status: string;
  bar?: {
    id: string;
    name: string;
    bar_name: string;
  };
}

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
    baresActivos: 0,
    jugadoresUnicos: 0,
    prediccionesPagadas: 52000,
  });

  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loadingLiveMatches, setLoadingLiveMatches] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  const [editableScores, setEditableScores] = useState<Record<string, { home: number; away: number }>>({});

  // Detectar idioma inicial
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  // Guardar idioma en localStorage cuando cambie
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
      if (parsedUser.role === "bar") {
        router.push("/bar/dashboard");
      } else if (parsedUser.role === "player") {
        router.push("/jugador/dashboard");
      } else {
        router.push("/login");
      }
      return;
    }

    setUser(parsedUser);

    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            baresActivos: data.data.baresActivos,
            jugadoresUnicos: data.data.jugadores,
          }));
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchLiveMatches(token);
  }, [router]);

  const fetchLiveMatches = async (customToken?: string) => {
    try {
      setLoadingLiveMatches(true);
      const token = customToken || localStorage.getItem("token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/live-matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLiveMatches(data.data);
        
        // Inicializar editableScores con los puntajes actuales
        const initialScores: Record<string, { home: number; away: number }> = {};
        data.data.forEach((match: LiveMatch) => {
          initialScores[match.id] = {
            home: match.current_score_home || 0,
            away: match.current_score_away || 0,
          };
        });
        setEditableScores(initialScores);
      } else {
        console.error("Error en la respuesta:", data.message);
      }
    } catch (error) {
      console.error("Error al obtener partidos activos:", error);
    } finally {
      setLoadingLiveMatches(false);
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

      return {
        ...prev,
        [matchId]: {
          ...current,
          [team]: newValue,
        },
      };
    });
  };

  const handleSaveScore = async (matchId: string) => {
    try {
      setSavingMatchId(matchId);
      const token = localStorage.getItem("token");
      const score = editableScores[matchId];

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms/${matchId}/score`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_score_home: score.home,
          current_score_away: score.away,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchLiveMatches(token || undefined);
      } else {
        alert(data.message || "No se pudo actualizar el marcador");
      }
    } catch (error) {
      console.error("Error al guardar marcador:", error);
      alert("Error al guardar marcador");
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms/${matchId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "finished",
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchLiveMatches(token || undefined);
      } else {
        alert(data.message || "No se pudo finalizar el partido");
      }
    } catch (error) {
      console.error("Error al finalizar partido:", error);
      alert("Error al finalizar partido");
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
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
    { nome: "Sports Bar", receita: 2850, partidos: 12 },
    { nome: "Cantina do Juca", receita: 2100, partidos: 10 },
  ];

  const pendientes = [
    { tipo: "pagos", cantidad: 15, valor: 3200 },
    { tipo: "bares_aprovacao", cantidad: 8 },
    { tipo: "reclamos", cantidad: 3 },
  ];

  const proximosPartidos = [
    { partido: "Brasil vs Argentina", salas: 12, fecha: locale === "pt-BR" ? "Amanhã 16:00" : "Mañana 16:00" },
    { partido: "Flamengo vs Fluminense", salas: 8, fecha: "27/03 20:00" },
    { partido: locale === "pt-BR" ? "Final Champions" : "Final Champions", salas: 23, fecha: locale === "pt-BR" ? "30/03 15:00" : "30/03 15:00" },
  ];

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20 gap-4">

            {/* LOGO */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo-jugadaplay.svg"
                  alt="Jugada Play"
                  className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                />
              </Link>
            </div>

            {/* DESKTOP */}
            <div className="hidden md:flex items-center gap-6">

              {/* SELECTOR IDIOMA */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="locale-select"
                  className="text-gray-400 text-xs tracking-wide"
                >
                  {t.common.language}
                </label>

                <select
                  id="locale-select"
                  value={locale}
                  onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                  className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none"
                >
                  <option value="pt-BR">PT</option>
                  <option value="es">ES</option>
                </select>
              </div>

              <div className="w-px h-6 bg-yellow-500/20"></div>

              {/* EMAIL */}
              <span className="text-yellow-500 text-sm tracking-wide">
                {user?.email || "ADMIN@JUGADAPLAY.COM"}
              </span>

              <div className="w-px h-6 bg-yellow-500/20"></div>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t.admin.logout}
              </button>

              {/* SETTINGS */}
              <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* MOBILE MENU */}
            <button
              className="md:hidden text-yellow-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* MOBILE DROPDOWN */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-4">

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="mobile-locale-select"
                    className="text-gray-400 text-xs"
                  >
                    {t.common.language}
                  </label>

                  <select
                    id="mobile-locale-select"
                    value={locale}
                    onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                    className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none"
                  >
                    <option value="pt-BR">PT</option>
                    <option value="es">ES</option>
                  </select>
                </div>

                <span className="text-gray-400 text-sm">
                  {user?.email || "ADMIN@JUGADAPLAY.COM"}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  {t.admin.logout}
                </button>

                <button className="text-gray-400 text-sm text-left">
                  {t.admin.configuration}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            
            <div className="flex gap-2">
              <Link href="/admin/usuarios">
                <button className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg hover:border-yellow-500/50 transition-all">
                  <Users className="w-4 h-4" />
                  {t.admin.manageUsers}
                </button>
              </Link>
              <button className="p-2 border border-yellow-500/30 rounded-lg hover:border-yellow-500/50 transition-all">
                <Download className="w-4 h-4 text-yellow-500" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={t.admin.search}
                  className="bg-black border border-yellow-500/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/60"
                />
              </div>
            </div>
          </div>

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
                {item.valor && (
                  <p className="text-gray-500 text-xs mt-2">R$ {item.valor.toLocaleString()}</p>
                )}
                <button className="mt-3 text-yellow-500 text-xs hover:text-yellow-400 transition-colors">
                  {t.admin.pending.viewDetails} →
                </button>
              </div>
            ))}
          </div>

          <div className="flex space-x-6 mb-6 border-b border-yellow-500/20 overflow-x-auto">
            <button
              onClick={() => setActiveTab("general")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "general"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-500 hover:text-gray-400"
                }`}
            >
              {t.admin.tabs.topBars}
            </button>

            <button
              onClick={() => setActiveTab("partidos")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "partidos"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-500 hover:text-gray-400"
                }`}
            >
              {t.admin.tabs.upcomingMatches}
            </button>

            <button
              onClick={() => setActiveTab("activos")}
              className={`pb-3 text-sm tracking-wide transition-all whitespace-nowrap ${activeTab === "activos"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-500 hover:text-gray-400"
                }`}
            >
              {t.admin.tabs.activeMatches}
            </button>
          </div>

          {activeTab === "general" && (
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-yellow-500/20">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">#</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.topBars.bar}</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.topBars.revenue}</th>
                    <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.topBars.matches}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {topBares.map((bar, idx) => (
                    <tr key={idx} className="hover:bg-yellow-500/5 transition-colors">
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

          {activeTab === "partidos" && (
            <div className="space-y-3">
              {proximosPartidos.map((partido, idx) => (
                <div key={idx} className="bg-black/30 border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">{partido.partido}</h3>
                    <p className="text-gray-500 text-xs">{partido.fecha}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-yellow-500 text-sm">{partido.salas} {t.admin.upcomingMatches.activeRooms}</span>
                    <button className="border border-yellow-500/30 text-yellow-500 px-4 py-1.5 text-xs rounded-sm hover:border-yellow-500/50 transition-all">
                      {t.admin.upcomingMatches.viewDetails}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "activos" && (
            <div className="space-y-4">
              {loadingLiveMatches ? (
                <div className="text-gray-400 text-sm">{t.admin.activeMatches.loading}</div>
              ) : liveMatches.length === 0 ? (
                <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6 text-gray-400 text-sm">
                  {t.admin.activeMatches.noMatches}
                </div>
              ) : (
                liveMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-black/30 border border-yellow-500/20 rounded-xl p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PlayCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 text-xs tracking-wide">{t.admin.activeMatches.inProgress}</span>
                        </div>
                        <h3 className="text-white text-lg font-medium">
                          {match.team_home} vs {match.team_away}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">
                          {match.bar?.bar_name || match.bar?.name || t.admin.activeMatches.barNotAvailable}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {t.admin.activeMatches.startedAt}: {new Date(match.match_date).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleScoreChange(match.id, "home", -1)}
                              className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500 hover:border-yellow-500/50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <div className="min-w-[56px] text-center">
                              <div className="text-white text-sm">{match.team_home}</div>
                              <div className="text-2xl text-yellow-500 font-bold">
                                {editableScores[match.id]?.home ?? 0}
                              </div>
                            </div>

                            <button
                              onClick={() => handleScoreChange(match.id, "home", 1)}
                              className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500 hover:border-yellow-500/50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-gray-500 text-xl font-light">-</div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleScoreChange(match.id, "away", -1)}
                              className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500 hover:border-yellow-500/50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <div className="min-w-[56px] text-center">
                              <div className="text-white text-sm">{match.team_away}</div>
                              <div className="text-2xl text-yellow-500 font-bold">
                                {editableScores[match.id]?.away ?? 0}
                              </div>
                            </div>

                            <button
                              onClick={() => handleScoreChange(match.id, "away", 1)}
                              className="p-2 border border-yellow-500/20 rounded-lg text-yellow-500 hover:border-yellow-500/50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveScore(match.id)}
                            disabled={savingMatchId === match.id}
                            className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg hover:border-yellow-500/50 transition-all disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {savingMatchId === match.id ? t.admin.activeMatches.saving : t.admin.activeMatches.save}
                          </button>

                          <button
                            onClick={() => handleFinishMatch(match.id)}
                            className="flex items-center gap-2 border border-green-500/30 text-green-500 px-4 py-2 text-sm rounded-lg hover:border-green-500/50 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t.admin.activeMatches.finish}
                          </button>

                          <Link href={`/admin/partidos/${match.id}`}>
                            <button className="border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-lg hover:border-yellow-500/50 transition-all">
                              {t.admin.activeMatches.viewDetails}
                            </button>
                          </Link>
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