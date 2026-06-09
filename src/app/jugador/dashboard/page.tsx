//src/app/jugador/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Menu,
  X,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { translations, type Locale } from "@/messages";

interface Prediction {
  id: string;
  room_id: string;
  goals_home: number;
  goals_away: number;
  paid: boolean;
  is_paid: boolean;
  room: {
    id: string;
    name: string;
    entry_fee: number;
    total_pool: number;
    status: string;
    Fixture: {
      home_team_name: string;
      away_team_name: string;
      match_date: string;
    };
  };
}

interface MatchResult {
  id: string;
  room_id: string;
  score_home: number;
  score_away: number;
  winners_count: number;
  total_prize: number;
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

export default function PlayerDashboard() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    partidosJugados: 0,
    aciertos: 0,
    tasaAcierto: 0,
    totalGanado: 0,
  });

  const [partidosActivos, setPartidosActivos] = useState<Prediction[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  const t = translations[locale];

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

    if (parsedUser.role !== "player") {
      if (parsedUser.role === "bar") {
        router.push("/bar/dashboard");
      } else if (parsedUser.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/login");
      }
      return;
    }

    setUser(parsedUser);
    cargarDatosJugador();
  }, [router]);

  const cargarDatosJugador = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/my-predictions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar predicciones");
      }

      if (data.success) {
        const predicciones: Prediction[] = data.data || [];

        const activas = predicciones.filter(
          (p: Prediction) => p.room && p.room.status === "active"
        );

        const finalizadas = predicciones.filter(
          (p: Prediction) =>
            p.room &&
            (p.room.status === "finished" || p.room.status === "closed")
        );

        setPartidosActivos(activas);

        const partidosJugados = finalizadas.length;
        let aciertos = 0;
        let totalGanado = 0;

        // Procesar cada predicción finalizada
        for (const pred of finalizadas) {
          try {

            const resultResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/player/match-result/${pred.room_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              }
            );

            // Verificar si la respuesta es JSON válido
            const contentType = resultResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn(`⚠️ Respuesta no es JSON para sala ${pred.room_id}, status: ${resultResponse.status}`);
              continue; // Saltar esta predicción
            }

            const resultData = await resultResponse.json();

            if (resultResponse.ok && resultData.success && resultData.data) {
              const resultado: MatchResult = resultData.data;
              if (
                pred.goals_home === resultado.score_home &&
                pred.goals_away === resultado.score_away
              ) {
                aciertos++;

                if (resultado.winners_count > 0) {
                  totalGanado +=
                    Number(resultado.total_prize) / Number(resultado.winners_count);
                }
              }
            } else {
              console.warn(`⚠️ No se pudo obtener resultado para sala ${pred.room_id}:`, resultData.message || "Sin datos");
            }
          } catch (error) {
            console.error(`❌ Error obteniendo resultado del partido ${pred.room_id}:`, error);
            // Continuar con la siguiente predicción en lugar de detener todo
            continue;
          }
        }

        const tasaAcierto = partidosJugados > 0 ? (aciertos / partidosJugados) * 100 : 0;

        setStats({
          partidosJugados,
          aciertos,
          tasaAcierto: Math.round(tasaAcierto),
          totalGanado: Math.round(totalGanado),
        });

        // Construir historial
        const historialData = [];

        for (const pred of finalizadas.slice(0, 10)) {
          try {
            const resultResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/player/match-result/${pred.room_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              }
            );

            const contentType = resultResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              // Si no hay resultado disponible, mostrar como pendiente
              historialData.push({
                id: pred.id,
                partido: pred.room?.name || `${pred.room?.Fixture?.home_team_name} vs ${pred.room?.Fixture?.away_team_name}`,
                resultado: "Pendiente",
                prediccion: `${pred.goals_home} x ${pred.goals_away}`,
                ganado: false,
                premio: 0,
                fecha: pred.room?.Fixture?.match_date,
              });
              continue;
            }

            const resultData = await resultResponse.json();

            if (resultResponse.ok && resultData.success && resultData.data) {
              const resultado: MatchResult = resultData.data;
              const acerto =
                pred.goals_home === resultado.score_home &&
                pred.goals_away === resultado.score_away;

              historialData.push({
                id: pred.id,
                partido: pred.room?.name || `${pred.room?.Fixture?.home_team_name} vs ${pred.room?.Fixture?.away_team_name}`,
                resultado: `${resultado.score_home} x ${resultado.score_away}`,
                prediccion: `${pred.goals_home} x ${pred.goals_away}`,
                ganado: acerto,
                premio: acerto && resultado.winners_count > 0
                  ? Number(resultado.total_prize) / Number(resultado.winners_count)
                  : 0,
                fecha: pred.room?.Fixture?.match_date,
              });
            } else {
              // Si no hay resultado disponible, mostrar como pendiente
              historialData.push({
                id: pred.id,
                partido: pred.room?.name || `${pred.room?.Fixture?.home_team_name} vs ${pred.room?.Fixture?.away_team_name}`,
                resultado: "Pendiente",
                prediccion: `${pred.goals_home} x ${pred.goals_away}`,
                ganado: false,
                premio: 0,
                fecha: pred.room?.Fixture?.match_date,
              });
            }
          } catch (error) {
            console.error(`❌ Error construyendo historial para ${pred.room_id}:`, error);
            // Agregar entrada como pendiente en caso de error
            historialData.push({
              id: pred.id,
              partido: pred.room?.name || `${pred.room?.Fixture?.home_team_name} vs ${pred.room?.Fixture?.away_team_name}`,
              resultado: "Pendiente",
              prediccion: `${pred.goals_home} x ${pred.goals_away}`,
              ganado: false,
              premio: 0,
              fecha: pred.room?.Fixture?.match_date,
            });
          }
        }

        setHistorial(historialData);
      }
    } catch (error) {
      console.error("Error cargando datos del jugador:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
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
          <div className="flex justify-between items-center h-20 gap-4">
            <Link href="/" className="flex items-center">
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">
                {t.header.language === "Idioma" ? `Hola, ${user?.nickname || "Jugador"}` : `Olá, ${user?.nickname || "Jogador"}`}
              </span>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="locale-select"
                  className="text-gray-400 text-xs md:text-sm tracking-wide"
                >
                  {t.header.language}
                </label>
                <select
                  id="locale-select"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none cursor-pointer hover:border-yellow-500 transition-colors"
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
                {t.admin.logout}
              </button>
            </div>

            <button
              className="md:hidden text-yellow-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-3">
                <span className="text-yellow-500 text-sm">
                  {t.header.language === "Idioma" ? `Hola, ${user?.nickname || "Jugador"}` : `Olá, ${user?.nickname || "Jogador"}`}
                </span>

                <div className="flex items-center justify-between">
                  <label
                    htmlFor="locale-select-mobile"
                    className="text-gray-400 text-xs tracking-wide"
                  >
                    {t.header.language}
                  </label>
                  <select
                    id="locale-select-mobile"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-2 rounded-sm outline-none cursor-pointer"
                  >
                    <option value="pt-BR">Português</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  {t.admin.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">

          {/* HERO */}
          {partidosActivos.length > 0 && (
            <div className="mb-10">
              <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-black to-black p-6 md:p-8">
                <div className="text-center">
                  <div className="text-yellow-500 uppercase tracking-[0.2em] text-xs mb-3">
                    {t.hero.badge}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-6 hover:border-yellow-500 hover:scale-105 transition-all">
              <Trophy className="w-7 h-7 text-yellow-500 mb-4" />
              <div className="text-4xl font-bold text-white">
                {stats.partidosJugados}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {t.barDashboard.totalPlayers}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-6 hover:border-yellow-500 hover:scale-105 transition-all">
              <Star className="w-7 h-7 text-yellow-500 mb-4" />

              <div className="text-4xl font-bold text-green-500">
                {stats.aciertos}
              </div>

              <div className="text-gray-500 text-sm mt-2">
                {t.barDashboard.hits}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-6 hover:border-yellow-500 hover:scale-105 transition-all">

              <TrendingUp className="w-7 h-7 text-yellow-500 mb-4" />

              <div className="text-4xl font-bold text-blue-400">
                {stats.tasaAcierto}%
              </div>

              <div className="text-gray-500 text-sm mt-2">
                {t.barDashboard.rating}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-black p-6 hover:border-yellow-500 hover:scale-105 transition-all">
              <Trophy className="w-7 h-7 text-yellow-500 mb-4" />
              <div className="text-4xl font-bold text-yellow-500">
                {t.currencyPrefix} {stats.totalGanado}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {t.admin.stats.totalRevenue}
              </div>
            </div>
          </div>

          {/* ACTIVAS */}
          <div className="mb-12">

            <Link
              href={`/entrar`}
              className="w-full md:w-auto block mb-8"
            >
              <button className="bg-yellow-500 text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl hover:scale-105 transition-all w-full md:w-auto text-sm md:text-base">
                {t.playerDashboard.goToRoom}
              </button>
            </Link>

            <h2 className="text-2xl text-white font-semibold mb-5">
              {locale === "es" ? "Predicciones Activas" : "Previsões Ativas"}
            </h2>

            <div className="space-y-4">
              {partidosActivos.map((prediccion) => (

                <Link
                  key={prediccion.id}
                  href={`/jugador/en-vivo/${prediccion.room_id}`}
                >

                  <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-5 hover:border-yellow-500 transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white text-lg font-semibold">
                          {prediccion.room?.Fixture?.home_team_name}
                          {" vs "}
                          {prediccion.room?.Fixture?.away_team_name}
                        </h3>

                        <p className="text-gray-400 mt-2">
                          {locale === "es" ? "Tu predicción:" : "Sua previsão:"}
                          <span className="text-green-500 ml-2 font-bold">
                            {prediccion.goals_home} x {prediccion.goals_away}
                          </span>
                        </p>

                      </div>

                      <div className="text-right">

                        <div className="text-yellow-500 text-2xl font-bold">
                          {t.currencyPrefix} {prediccion.room?.total_pool}
                        </div>

                        <div className="text-gray-500 text-sm">
                          {t.prediction.prizePool}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>


          {/* HISTORIAL */}
          <div>

            <h2 className="text-2xl text-white font-semibold mb-5">
              {locale === "es" ? "Historial" : "Histórico"}
            </h2>

            <div className="space-y-4">

              {historial.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl border border-yellow-500/20 bg-black/40 p-5"
                >

                  <div className="flex justify-between items-center">

                    <div>

                      <h3 className="text-white font-semibold">
                        {item.partido}
                      </h3>

                      <div className="mt-2 text-gray-400">
                        {locale === "es" ? "Resultado:" : "Resultado:"}
                        <span className="ml-2">
                          {item.resultado}
                        </span>
                      </div>

                      <div className="text-gray-400">
                        {locale === "es" ? "Predicción:" : "Previsão:"}
                        <span className="ml-2">
                          {item.prediccion}
                        </span>
                      </div>
                    </div>

                    {item.ganado ? (
                      <div className="bg-green-500/20 text-green-500 px-4 py-2 rounded-full font-semibold">
                        + {t.currencyPrefix} {Math.round(item.premio)}
                      </div>

                    ) : (

                      <div className="bg-red-500/20 text-red-500 px-4 py-2 rounded-full font-semibold">
                        {locale === "es" ? "Fallaste" : "Errou"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}