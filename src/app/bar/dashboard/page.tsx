// app/bar/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Users,
  Trophy,
  Coins,
  Calendar,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Clock,
  Star,
  LogOut,
  ChevronDown,
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

interface Bar {
  id: string;
  name: string;
  bar_name: string;
  balance: number;
}

interface StatsData {
  bar: { name: string; bar_name: string; balance: number };
  stats: {
    activeRooms: number;
    totalPlayers: number;
    todayRevenue: number;
    totalRevenue: number;
    rating: number;
  };
  ranking: any[];
}

export default function BarDashboard() {
  const router = useRouter();

  // Estado del idioma (exactamente igual a la landing)
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const t = translations[locale];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("activas");
  const [loading, setLoading] = useState(true);
  const [userBars, setUserBars] = useState<Bar[]>([]);
  const [selectedBarId, setSelectedBarId] = useState<string>("");
  const [selectedBarName, setSelectedBarName] = useState("");
  const [stats, setStats] = useState<StatsData>({
    bar: { name: "", bar_name: "", balance: 0 },
    stats: {
      activeRooms: 0,
      totalPlayers: 0,
      todayRevenue: 0,
      totalRevenue: 0,
      rating: 0,
    },
    ranking: [],
  });
  const [rooms, setRooms] = useState({
    activas: [],
    proximos: [],
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // En lugar de llamar a /api/owner/bars, usa los bares del localStorage
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData);
      console.log("Datos del usuario:", user);

      if (user.role !== "owner" && user.role !== "admin") {
        router.push(user.role === "player" ? "/jugador/dashboard" : "/login");
        return;
      }

      // 🔥 USAR LOS BARES DEL LOGIN
      if (user.bars && user.bars.length > 0) {
        setUserBars(user.bars);
        const firstBar = user.bars[0];
        setSelectedBarId(firstBar.id);
        setSelectedBarName(firstBar.barName || firstBar.name);
        setLoading(false);
        return;
      }

      // Fallback: intentar cargar desde el endpoint
      try {
        const barsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/owner/bars`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const barsData = await barsRes.json();

        if (barsData.success && barsData.bars.length > 0) {
          setUserBars(barsData.bars);
          const firstBar = barsData.bars[0];
          setSelectedBarId(firstBar.id);
          setSelectedBarName(firstBar.name || firstBar.bar_name);
        } else {
          console.error("No se encontraron bares para este owner");
        }
      } catch (error) {
        console.error("Error al cargar bares:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Cargar datos del bar seleccionado
  useEffect(() => {
    if (!selectedBarId) return;

    const fetchBarData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        // Cargar estadísticas del bar específico
        const statsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bar/stats?barId=${selectedBarId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats({
            ...statsData.data,
            bar: {
              ...statsData.data.bar,
              bar_name: selectedBarName,
            },
          });
        }

        // Cargar salas activas del bar específico
        const roomsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms?status=active&barId=${selectedBarId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const roomsData = await roomsRes.json();

        if (roomsData.success) {
          setRooms((prev) => ({ ...prev, activas: roomsData.data }));
        }

        // Cargar próximos partidos del bar específico
        const upcomingRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms?status=upcoming&barId=${selectedBarId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const upcomingData = await upcomingRes.json();

        if (upcomingData.success) {
          setRooms((prev) => ({ ...prev, proximos: upcomingData.data }));
        }
      } catch (error) {
        console.error("Error al cargar datos del bar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarData();
  }, [selectedBarId, selectedBarName, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleBarChange = (barId: string, barName: string) => {
    setSelectedBarId(barId);
    setSelectedBarName(barName);
    setIsDropdownOpen(false);
    // Resetear tab activo al cambiar de bar
    setActiveTab("activas");
  };

  if ((loading && userBars.length === 0) || !isLocaleReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center">
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {/* Selector de bares para owner */}
              {userBars.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-yellow-500 text-sm tracking-wide uppercase hover:text-yellow-400 transition-colors"
                  >
                    {selectedBarName}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-black/95 border border-yellow-500/20 rounded-md shadow-lg z-50 min-w-[200px]">
                      {userBars.map((bar) => (
                        <button
                          key={bar.id}
                          onClick={() => handleBarChange(bar.id, bar.name || bar.bar_name)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 transition-colors ${selectedBarId === bar.id
                              ? "text-yellow-500"
                              : "text-gray-400"
                            }`}
                        >
                          {bar.name || bar.bar_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {userBars.length === 1 && (
                <span className="text-yellow-500 text-sm tracking-wide uppercase">
                  {selectedBarName}
                </span>
              )}

              <div className="w-px h-6 bg-yellow-500/20"></div>

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

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t.barDashboard.logout}
              </button>
            </div>

            <button
              className="md:hidden text-yellow-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menú móvil */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-3">
                {userBars.length > 1 && (
                  <div className="space-y-2">
                    <span className="text-gray-400 text-xs">{t.barDashboard.selectBar}</span>
                    {userBars.map((bar) => (
                      <button
                        key={bar.id}
                        onClick={() => {
                          handleBarChange(bar.id, bar.name || bar.bar_name);
                          setIsMenuOpen(false);
                        }}
                        className={`block w-full text-left py-1 ${selectedBarId === bar.id
                            ? "text-yellow-500"
                            : "text-gray-400"
                          }`}
                      >
                        {bar.name || bar.bar_name}
                      </button>
                    ))}
                  </div>
                )}
                {userBars.length === 1 && (
                  <span className="text-yellow-500 text-sm uppercase">
                    {selectedBarName}
                  </span>
                )}

                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  {t.barDashboard.logout}
                </button>

                {/* Selector de idioma en móvil */}
                <div className="flex items-center gap-2 pt-2">
                  <label className="text-gray-400 text-xs tracking-wide">
                    {t.header.language}
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none"
                  >
                    <option value="pt-BR">PT</option>
                    <option value="es">ES</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Link href={`/bar/crear-sala?barId=${selectedBarId}`}>
              <button className="group relative overflow-hidden bg-yellow-500 text-black px-6 py-2.5 rounded-sm text-sm font-medium tracking-wide flex items-center gap-2 hover:bg-yellow-400 transition-all">
                <Plus className="w-4 h-4" />
                <span>{t.barDashboard.createNewRoom}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
              </button>
            </Link>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-light text-white">
                {stats.stats.totalPlayers}
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                {t.barDashboard.totalPlayers}
              </div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">
                {t.currencyPrefix} {stats.stats.todayRevenue}
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                {t.barDashboard.collectedToday}
              </div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">
                {t.currencyPrefix} {stats.stats.totalRevenue}
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                {t.barDashboard.totalReceived}
              </div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-yellow-500/60" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-light text-white">
                {stats.stats.rating}
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                {t.barDashboard.rating}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mb-6 border-b border-yellow-500/20">
            <button
              onClick={() => setActiveTab("activas")}
              className={`pb-3 text-sm tracking-wide transition-all ${activeTab === "activas"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
                }`}
            >
              {t.barDashboard.activeRooms} ({rooms.activas.length})
            </button>

            <button
              onClick={() => setActiveTab("proximos")}
              className={`pb-3 text-sm tracking-wide transition-all ${activeTab === "proximos"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-400"
                }`}
            >
              {t.barDashboard.upcomingMatches} ({rooms.proximos.length})
            </button>
          </div>

          {/* Lista de salas */}
          <div className="space-y-3">
            {activeTab === "activas" &&
              rooms.activas.map((sala: any) => (
                <div
                  key={sala.id}
                  className="group bg-black/30 border border-yellow-500/20 hover:border-yellow-500/40 rounded-lg p-4 transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h3 className="text-white font-medium">{sala.partido}</h3>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(sala.fecha).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="w-3 h-3" />
                          {sala.jugadores} {t.barDashboard.players}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Coins className="w-3 h-3" />
                          {t.currencyPrefix} {sala.pozo}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <Link href={`/bar/sala/${sala.id}`} className="flex-1 md:flex-none">
                        <button className="w-full border border-yellow-500/50 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/10 transition-all">
                          {t.barDashboard.viewRoom}
                        </button>
                      </Link>

                      <button className="flex-1 md:flex-none bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/20 transition-all">
                        QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "proximos" &&
              rooms.proximos.map((partido: any) => (
                <div
                  key={partido.id}
                  className="bg-black/30 border border-yellow-500/20 rounded-lg p-4 opacity-60"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-white font-medium mb-2">{partido.partido}</h3>
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(partido.fecha).toLocaleString()}
                      </span>
                    </div>

                    <Link href={`/bar/crear-sala?barId=${selectedBarId}`}>
                      <button className="w-full border border-yellow-500/30 text-yellow-500/70 px-4 py-2 text-sm rounded-sm hover:border-yellow-500/50 transition-all">
                        {t.barDashboard.activateRoom}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          {/* Ranking rápido */}
          <div className="mt-12 bg-black/30 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-light tracking-wide">{t.barDashboard.rankingOfTheDay}</h3>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <div className="space-y-2">
              {stats.ranking.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-yellow-500/10"
                >
                  <span className={idx === 0 ? "text-yellow-500" : "text-gray-500"}>
                    {idx + 1}°
                  </span>
                  <span className="text-white text-sm">{item.name}</span>
                  <span
                    className={
                      idx === 0
                        ? "text-yellow-500 text-sm"
                        : "text-gray-500 text-sm"
                    }
                  >
                    {item.predictions} {t.barDashboard.hits}
                  </span>
                </div>
              ))}

              {stats.ranking.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  {t.barDashboard.noPredictionsToday}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}