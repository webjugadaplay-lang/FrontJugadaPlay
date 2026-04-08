// app/jugador/en-vivo/[salaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";

interface LiveRoomData {
  id: string;
  team_home: string;
  team_away: string;
  match_date: string;
  status: string;
  total_pool: number | string;
  current_score_home: number;
  current_score_away: number;
  entry_fee: number | string;
  bar?: {
    id?: string;
    name?: string;
    bar_name?: string;
  } | null;
  userPrediction: {
    score_home: number;
    score_away: number;
  } | null;
  ranking: Array<{
    userId: string;
    name: string;
    prediction: string;
    isUser: boolean;
    position?: number;
    emoji?: string;
    status?: string;
  }>;
}

export default function EnVivo() {
  const router = useRouter();
  const params = useParams<{ salaId: string }>();
  const salaId = params?.salaId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveData, setLiveData] = useState<LiveRoomData | null>(null);

  useEffect(() => {
    if (!salaId) {
      setError("ID de sala inválido");
      setLoading(false);
      return;
    }

    const fetchLiveRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userData);

        if (user.role !== "player") {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/player/live-room/${salaId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        console.log("📦 Datos recibidos:", data);

        if (!response.ok) {
          throw new Error(data.message || "Error al cargar la sala en vivo");
        }

        if (!data.success || !data.data) {
          throw new Error("No se pudo cargar la información en vivo");
        }

        setLiveData(data.data);
      } catch (err: any) {
        console.error("❌ Error cargando sala en vivo:", err);
        setError(err.message || "Error al cargar la sala en vivo");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRoom();
  }, [salaId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </main>
    );
  }

  if (error || !liveData) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500">{error || "No se pudo cargar la sala"}</p>
          <Link href="/jugador/dashboard" className="text-yellow-500 mt-4 inline-block">
            Volver al dashboard
          </Link>
        </div>
      </main>
    );
  }

  const prediccionUsuario = liveData.userPrediction
    ? `${liveData.userPrediction.score_home} x ${liveData.userPrediction.score_away}`
    : "-- x --";

  const totalJugadores = liveData.ranking?.length || 0;
  const pozoActual = Number(liveData.total_pool) || 0;

  // Encontrar la posición del usuario en el ranking
  const userPosition = liveData.ranking?.findIndex(r => r.isUser) ?? -1;
  const posicionActual = userPosition >= 0 ? userPosition + 1 : "-";

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Link href="/jugador/dashboard" className="text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-white text-sm">
                JUGADA<span className="text-yellow-500">PLAY</span>
              </span>
            </div>
            <span className="text-xs text-yellow-500">EN VIVO</span>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">

          {/* Marcador */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 items-center text-center gap-4">
              <div className="flex flex-col items-center">
                <p className="text-white text-xl md:text-2xl font-light">
                  {liveData.team_home}
                </p>
                <span className="mt-3 text-yellow-500 text-4xl md:text-6xl font-bold leading-none">
                  {liveData.current_score_home}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <p className="text-white text-xl md:text-2xl font-light">
                  VS
                </p>
                <span className="mt-3 text-gray-500 text-4xl md:text-6xl font-light leading-none">
                  -
                </span>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-white text-xl md:text-2xl font-light">
                  {liveData.team_away}
                </p>
                <span className="mt-3 text-yellow-500 text-4xl md:text-6xl font-bold leading-none">
                  {liveData.current_score_away}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">
                {new Date(liveData.match_date).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tu predicción */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-xs tracking-wide">
                  TU PREDICCIÓN
                </p>
                <p className="text-3xl font-light text-yellow-500">
                  {prediccionUsuario}
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-xs">POSICIÓN ACTUAL</p>
                <p className="text-2xl font-light text-white">
                  {posicionActual}
                  {typeof posicionActual === "number" ? "°" : ""}{" "}
                  <span className="text-sm text-gray-500">
                    de {totalJugadores}
                  </span>
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-xs">PREMIO POTENCIAL</p>
                <p className="text-xl font-medium text-yellow-500">
                  R$ {pozoActual}
                </p>
              </div>
            </div>
          </div>

          {/* Estado del ranking */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              ESTADO DEL RANKING
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Marcador actual:</span>
                <span className="text-white">
                  {liveData.current_score_home} x {liveData.current_score_away}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Valor entrada:</span>
                <span className="text-yellow-500">R$ {Number(liveData.entry_fee)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Jugadores en ranking:</span>
                <span className="text-white">{totalJugadores}</span>
              </div>
            </div>
          </div>

          {/* Ranking en vivo */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-yellow-500/20 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-sm font-light tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RANKING EN VIVO
              </h3>
              <Users className="w-4 h-4 text-gray-500" />
            </div>

            <div className="divide-y divide-yellow-500/10">
              {liveData.ranking && liveData.ranking.length > 0 ? (
                liveData.ranking.map((item, idx) => (
                  <div
                    key={item.userId}
                    className={`px-6 py-3 flex justify-between items-center ${item.isUser ? "bg-yellow-500/5" : ""
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-mono w-8 ${idx === 0 ? "text-yellow-500" : "text-gray-500"
                          }`}
                      >
                        {item.position || idx + 1}°
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji || '⚽'}</span>
                        <span
                          className={`text-sm ${item.isUser ? "text-yellow-500" : "text-white"
                            }`}
                        >
                          {item.isUser ? "TÚ" : item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm font-mono">
                        {item.prediction}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {item.status || ''}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-6 text-center text-gray-500 text-sm">
                  No hay predicciones para esta sala
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}