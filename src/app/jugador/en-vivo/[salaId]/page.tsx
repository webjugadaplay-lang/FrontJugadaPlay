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
  room: {
    id: string;
    name: string;
    team_home: string;
    team_away: string;
    match_date: string;
    status: string;
    total_pool: number | string;
    current_score_home: number;
    current_score_away: number;
    current_minute: number;
    current_phase: string;
    bar?: {
      id?: string;
      name?: string;
      bar_name?: string;
    } | null;
  };
  user_prediction: {
    id: string;
    score_home: number;
    score_away: number;
    paid: boolean;
  } | null;
  user_ranking: {
    position: number;
    total_players: number;
  } | null;
  ranking: Array<{
    position: number;
    user_id: string;
    user_name: string;
    score_home: number;
    score_away: number;
    prediction: string;
    distance: number;
    is_user: boolean;
    paid: boolean;
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

        const text = await response.text();
        const contentType = response.headers.get("content-type") || "";

        console.log("LIVE ROOM STATUS:", response.status);
        console.log("LIVE ROOM CONTENT-TYPE:", contentType);
        console.log("LIVE ROOM RAW:", text);

        if (!contentType.includes("application/json")) {
          throw new Error("La respuesta de sala en vivo no fue JSON");
        }

        const data = JSON.parse(text);

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

  const { room, user_prediction, user_ranking, ranking } = liveData;

  const prediccionUsuario = user_prediction
    ? `${user_prediction.score_home} x ${user_prediction.score_away}`
    : "-- x --";

  const posicionActual = user_ranking?.position || "-";
  const totalJugadores = user_ranking?.total_players || ranking.length || 0;
  const pozoActual = Number(room.total_pool) || 0;

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
          <div className="bg-black/50 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              {/* Equipo local */}
              <div className="text-right min-w-0">
                <p className="text-white text-xl md:text-2xl font-light truncate">
                  {room.team_home}
                </p>
              </div>

              {/* VS */}
              <div className="text-right min-w-0">
                <p className="text-white text-xl md:text-2xl font-light truncate">
                  VS
                </p>
              </div>

              {/* Equipo visitante */}
              <div className="text-left min-w-0">
                <p className="text-white text-xl md:text-2xl font-light truncate">
                  {room.team_away}
                </p>
              </div>
            </div>

            {/* Marcador */}
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <span className="text-yellow-500 text-3xl md:text-5xl font-bold leading-none">
                {room.current_score_home}
              </span>
              <span className="text-gray-500 text-2xl md:text-4xl font-light leading-none">
                -
              </span>
              <span className="text-yellow-500 text-3xl md:text-5xl font-bold leading-none">
                {room.current_score_away}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">
                {room.current_minute}' • {room.current_phase}
              </span>
            </div>
          </div>

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

          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              ESTADO DEL RANKING
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Marcador actual:</span>
                <span className="text-white">
                  {room.current_score_home} x {room.current_score_away}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tu pronóstico:</span>
                <span className="text-yellow-500">{prediccionUsuario}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Jugadores en ranking:</span>
                <span className="text-white">{ranking.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-yellow-500/20 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-sm font-light tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RANKING EN VIVO
              </h3>
              <Users className="w-4 h-4 text-gray-500" />
            </div>

            <div className="divide-y divide-yellow-500/10">
              {ranking.length > 0 ? (
                ranking.slice(0, 10).map((item) => (
                  <div
                    key={item.user_id}
                    className={`px-6 py-3 flex justify-between items-center ${item.is_user ? "bg-yellow-500/5" : ""
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-mono w-8 ${item.position === 1 ? "text-yellow-500" : "text-gray-500"
                          }`}
                      >
                        {item.position}°
                      </span>

                      <span
                        className={`text-sm ${item.is_user ? "text-yellow-500" : "text-white"
                          }`}
                      >
                        {item.is_user ? "TÚ" : item.user_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm font-mono">
                        {item.prediction}
                      </span>
                      <span className="text-yellow-500 text-xs">
                        Δ {item.distance}
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

            <div className="border-t border-yellow-500/20 px-6 py-4">
              <button className="w-full text-center text-yellow-500 text-sm hover:text-yellow-400 transition-colors">
                VER RANKING COMPLETO
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}