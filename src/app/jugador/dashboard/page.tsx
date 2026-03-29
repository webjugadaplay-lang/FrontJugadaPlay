// app/jugador/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
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
  score_home: number;
  score_away: number;
  paid: boolean;
  room: {
    id: string;
    name: string;
    team_home: string;
    team_away: string;
    match_date: string;
    entry_fee: number;
    total_pool: number;
    status: string;
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/predictions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      console.log("RESPUESTA /player/predictions:", data);

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

        console.log("ACTIVAS:", activas);
        console.log("FINALIZADAS:", finalizadas);

        setPartidosActivos(activas);

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
                pred.score_home === resultado.score_home &&
                pred.score_away === resultado.score_away
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
                pred.score_home === resultado.score_home &&
                pred.score_away === resultado.score_away;

              historialData.push({
                id: pred.id,
                partido:
                  pred.room?.name ||
                  `${pred.room?.team_home} vs ${pred.room?.team_away}`,
                resultado: `${resultado.score_home} x ${resultado.score_away}`,
                prediccion: `${pred.score_home} x ${pred.score_away}`,
                ganado: acerto,
                premio:
                  acerto && resultado.winners_count > 0
                    ? Number(resultado.total_prize) / Number(resultado.winners_count)
                    : 0,
                fecha: pred.room?.match_date,
              });
            } else {
              historialData.push({
                id: pred.id,
                partido:
                  pred.room?.name ||
                  `${pred.room?.team_home} vs ${pred.room?.team_away}`,
                resultado: "Pendiente",
                prediccion: `${pred.score_home} x ${pred.score_away}`,
                ganado: false,
                premio: 0,
                fecha: pred.room?.match_date,
              });
            }
          } catch (error) {
            console.error(
              `Error construyendo historial para ${pred.room_id}:`,
              error
            );

            historialData.push({
              id: pred.id,
              partido:
                pred.room?.name ||
                `${pred.room?.team_home} vs ${pred.room?.team_away}`,
              resultado: "Pendiente",
              prediccion: `${pred.score_home} x ${pred.score_away}`,
              ganado: false,
              premio: 0,
              fecha: pred.room?.match_date,
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
            <Link href="/" className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
              <span className="text-xl font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">
                Hola, {user?.name || "Jugador"}
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
                  Hola, {user?.name || "Jugador"}
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
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-white">
              MI <span className="text-yellow-500 font-medium">DASHBOARD</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">
                {stats.partidosJugados}
              </div>
              <div className="text-xs text-gray-500">PARTIDOS JUGADOS</div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Star className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">
                {stats.aciertos}
              </div>
              <div className="text-xs text-gray-500">ACIERTOS</div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <TrendingUp className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">
                {stats.tasaAcierto}%
              </div>
              <div className="text-xs text-gray-500">TASA DE ACIERTO</div>
            </div>

            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
              <Crown className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="text-2xl font-light text-white">
                R$ {stats.totalGanado}
              </div>
              <div className="text-xs text-gray-500">TOTAL GANADO</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-white text-lg font-light tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              MIS PREDICCIONES ACTIVAS
            </h2>

            {partidosActivos.length > 0 ? (
              <div className="space-y-3">
                {partidosActivos.map((prediccion) => (
                  <Link
                    key={prediccion.id}
                    href={`/jugador/en-vivo/${prediccion.room_id}`}
                    className="block"
                  >
                    <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-4 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all cursor-pointer">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            {prediccion.room?.team_home} vs {prediccion.room?.team_away}
                          </h3>

                          <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(prediccion.room?.match_date).toLocaleString()}
                            </span>

                            <span className="text-yellow-500">
                              Pozo: R$ {prediccion.room?.total_pool}
                            </span>

                            <span className="text-green-500">
                              Tu predicción: {prediccion.score_home} x {prediccion.score_away}
                            </span>
                          </div>
                        </div>

                        <div className="text-yellow-500 text-sm font-medium">
                          VER EN VIVO
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-8 text-center">
                <p className="text-gray-500">No tienes predicciones activas</p>
                <Link href="/entrar">
                  <button className="mt-4 border border-yellow-500/50 text-yellow-500 px-4 py-2 text-sm rounded-sm hover:bg-yellow-500/10 transition-all">
                    UNIRME A UNA SALA
                  </button>
                </Link>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              HISTORIAL DE PREDICCIONES
            </h2>

            {historial.length > 0 ? (
              <div className="space-y-3">
                {historial.map((item) => (
                  <div
                    key={item.id}
                    className="bg-black/30 border border-yellow-500/20 rounded-lg p-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.partido}</h3>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm">
                          <span className="text-gray-500">
                            Resultado: {item.resultado}
                          </span>
                          <span className="text-gray-500">
                            Tu predicción: {item.prediccion}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">
                          {item.fecha ? new Date(item.fecha).toLocaleDateString() : ""}
                        </p>
                      </div>

                      <div>
                        {item.ganado ? (
                          <span className="text-green-500 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> + R$ {Math.round(item.premio)}
                          </span>
                        ) : (
                          <span className="text-red-500 text-sm flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> No acertaste
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-8 text-center">
                <p className="text-gray-500">No hay historial de predicciones</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}