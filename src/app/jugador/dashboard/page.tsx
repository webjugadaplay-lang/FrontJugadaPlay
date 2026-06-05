//src/aoo/jugador/dashboar/page.tsx
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

interface Prediction {
  id: string;
  room_id: string;
  goals_home: number;    // ← cambia score_home a goals_home
  goals_away: number;    // ← cambia score_away a goals_away
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

export default function PlayerDashboard() {
  const router = useRouter();
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

      console.log("RESPUESTA /player/my-predictions:", data);

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar predicciones");
      }

      if (data.success) {
        const predicciones: Prediction[] = data.data || [];

        console.log("PREDICCIONES RECIBIDAS:", predicciones);

        const activas = predicciones.filter(
          (p: Prediction) => p.room && p.room.status === "active"
        );

        const finalizadas = predicciones.filter(
          (p: Prediction) =>
            p.room &&
            (p.room.status === "finished" || p.room.status === "closed")
        );

        setPartidosActivos(activas);
        console.log("📊 PREDICCIONES ACTIVAS:", activas);
        console.log("📊 Cantidad de activas:", activas.length);

        const partidosJugados = finalizadas.length;
        let aciertos = 0;
        let totalGanado = 0;

        for (const pred of finalizadas) {
          try {
            const resultResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/player/match-result/${pred.room_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

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
            }
          } catch (error) {
            console.error(
              `Error obteniendo resultado del partido ${pred.room_id}:`,
              error
            );
          }
        }

        const tasaAcierto =
          partidosJugados > 0 ? (aciertos / partidosJugados) * 100 : 0;

        setStats({
          partidosJugados,
          aciertos,
          tasaAcierto: Math.round(tasaAcierto),
          totalGanado: Math.round(totalGanado),
        });

        const historialData = [];

        for (const pred of finalizadas.slice(0, 10)) {
          try {
            const resultResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/player/match-result/${pred.room_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

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
                premio:
                  acerto && resultado.winners_count > 0
                    ? Number(resultado.total_prize) / Number(resultado.winners_count)
                    : 0,
                fecha: pred.room?.Fixture?.match_date,
              });
            } else {
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
            console.error(
              `Error construyendo historial para ${pred.room_id}:`,
              error
            );

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
        <div className="text-yellow-500">Cargando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
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
              <span className="text-yellow-500 text-sm tracking-wide">
                Hola, {user?.nickname || "Jugador"}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                SALIR
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
                  Hola, {user?.nickname || "Jugador"}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-yellow-500 py-2 text-sm text-left"
                >
                  SALIR
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
              <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-black to-black p-8">

                <div className="text-yellow-500 uppercase tracking-[0.2em] text-xs mb-3">
                  Partido Destacado
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  {partidosActivos[0].room?.Fixture?.home_team_name}
                  <span className="text-yellow-500 mx-4">VS</span>
                  {partidosActivos[0].room?.Fixture?.away_team_name}
                </h1>

                <div className="grid md:grid-cols-3 gap-6">

                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      Tu Predicción
                    </p>

                    <p className="text-green-500 text-4xl font-bold">
                      {partidosActivos[0].goals_home} x {partidosActivos[0].goals_away}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      Pozo Actual
                    </p>

                    <p className="text-yellow-500 text-4xl font-bold">
                      R$ {partidosActivos[0].room?.total_pool}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <Link
                      href={`/jugador/en-vivo/${partidosActivos[0].room_id}`}
                    >
                      <button className="bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all">
                        VER EN VIVO
                      </button>
                    </Link>
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
                PARTIDOS
              </div>

            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-6 hover:border-yellow-500 hover:scale-105 transition-all">

              <Star className="w-7 h-7 text-yellow-500 mb-4" />

              <div className="text-4xl font-bold text-green-500">
                {stats.aciertos}
              </div>

              <div className="text-gray-500 text-sm mt-2">
                ACIERTOS
              </div>

            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-6 hover:border-yellow-500 hover:scale-105 transition-all">

              <TrendingUp className="w-7 h-7 text-yellow-500 mb-4" />

              <div className="text-4xl font-bold text-blue-400">
                {stats.tasaAcierto}%
              </div>

              <div className="text-gray-500 text-sm mt-2">
                EFECTIVIDAD
              </div>

            </div>

            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-black p-6 hover:border-yellow-500 hover:scale-105 transition-all">

              <Trophy className="w-7 h-7 text-yellow-500 mb-4" />

              <div className="text-4xl font-bold text-yellow-500">
                R$ {stats.totalGanado}
              </div>

              <div className="text-gray-500 text-sm mt-2">
                GANADO
              </div>

            </div>

          </div>

          {/* PROGRESO */}
          <div className="mb-12">

            <div className="flex justify-between mb-2">

              <span className="text-white">
                Nivel Novato
              </span>

              <span className="text-yellow-500">
                {stats.aciertos}/10
              </span>

            </div>

            <div className="h-4 bg-gray-900 rounded-full overflow-hidden">

              <div
                className="h-full bg-yellow-500 transition-all duration-1000"
                style={{
                  width: `${Math.min(
                    (stats.aciertos / 10) * 100,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* ACTIVAS */}
          <div className="mb-12">

            <h2 className="text-2xl text-white font-semibold mb-5">
              Predicciones Activas
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
                          Tu predicción:
                          <span className="text-green-500 ml-2 font-bold">
                            {prediccion.goals_home} x {prediccion.goals_away}
                          </span>
                        </p>

                      </div>

                      <div className="text-right">

                        <div className="text-yellow-500 text-2xl font-bold">
                          R$ {prediccion.room?.total_pool}
                        </div>

                        <div className="text-gray-500 text-sm">
                          Pozo
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
              Historial
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

                        Resultado:
                        <span className="ml-2">
                          {item.resultado}
                        </span>

                      </div>

                      <div className="text-gray-400">

                        Predicción:
                        <span className="ml-2">
                          {item.prediccion}
                        </span>

                      </div>

                    </div>

                    {item.ganado ? (

                      <div className="bg-green-500/20 text-green-500 px-4 py-2 rounded-full font-semibold">

                        + R$ {Math.round(item.premio)}

                      </div>

                    ) : (

                      <div className="bg-red-500/20 text-red-500 px-4 py-2 rounded-full font-semibold">

                        Fallaste

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