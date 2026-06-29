// app/jugador/en-vivo/[salaId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import io, { Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Crown,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface LiveRoomData {
  id: string;
  team_home: string;
  home_team_logo: string;
  team_away: string;
  away_team_logo: string;
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
  totalPlayers?: number;
  matchStatus?: string;
  winners_count?: number;
  total_prize?: number;
}

export default function EnVivo() {
  const router = useRouter();
  const params = useParams();
  const salaId = params?.salaId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveData, setLiveData] = useState<LiveRoomData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScoreAnimation, setShowScoreAnimation] = useState<{ home: boolean; away: boolean }>({ home: false, away: false });

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousScoresRef = useRef<{ home: number; away: number } | null>(null);
  const isPollingActiveRef = useRef(true);

  const fetchLiveData = async (showLoadingIndicator = false, isAutoRefresh = false) => {
    if (!salaId || salaId === 'undefined' || salaId === 'null') {
      console.error("❌ salaId inválido:", salaId);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/player/live-room/${salaId}?_t=${Date.now()}`;

      console.log(`🔄 ${isAutoRefresh ? 'Auto-refresh' : 'Manual refresh'} - Fetching data...`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = await response.json();
      console.log('📦 Respuesta completa:', data);

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar la sala en vivo");
      }

      if (!data.success || !data.data) {
        throw new Error("No se pudo cargar la información en vivo");
      }

      const roomData = data.data;

      // Detectar cambios en el marcador para animación
      if (previousScoresRef.current) {
        const oldHome = previousScoresRef.current.home;
        const oldAway = previousScoresRef.current.away;
        const newHome = roomData.current_score_home;
        const newAway = roomData.current_score_away;

        if (newHome > oldHome) {
          console.log(`🎯 Gol LOCAL! ${oldHome} -> ${newHome}`);
          setShowScoreAnimation({ home: true, away: false });
          setTimeout(() => setShowScoreAnimation({ home: false, away: false }), 1000);
        } else if (newAway > oldAway) {
          console.log(`🎯 Gol VISITANTE! ${oldAway} -> ${newAway}`);
          setShowScoreAnimation({ home: false, away: true });
          setTimeout(() => setShowScoreAnimation({ home: false, away: false }), 1000);
        }
      }

      setLiveData(roomData);
      previousScoresRef.current = {
        home: roomData.current_score_home,
        away: roomData.current_score_away
      };
      setLastUpdate(new Date());
      setError("");

      console.log(`✅ Datos actualizados - Marcador: ${roomData.current_score_home} x ${roomData.current_score_away}`);
      console.log('📊 userPrediction:', roomData.userPrediction);
      console.log('📊 ranking:', roomData.ranking?.length || 0, 'jugadores');

    } catch (err: any) {
      console.error("❌ Error cargando sala en vivo:", err);
      if (!isAutoRefresh) {
        setError(err.message || "Error al cargar la sala en vivo");
      }
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  const startPolling = (intervalSeconds: number = 5) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    console.log(`🔄 Iniciando polling automático cada ${intervalSeconds} segundos`);
    isPollingActiveRef.current = true;

    pollingIntervalRef.current = setInterval(() => {
      if (isPollingActiveRef.current && !isRefreshing) {
        fetchLiveData(false, true);
      }
    }, intervalSeconds * 1000);
  };

  const stopPolling = () => {
    console.log("⏹️ Deteniendo polling automático");
    isPollingActiveRef.current = false;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!salaId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    console.log("🔌 Conectando a WebSocket...");

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
      socket.emit('join-live-room', salaId);
      console.log(`📡 Unido a sala: live-room-${salaId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos`);
      setIsConnected(true);
      socket.emit('join-live-room', salaId);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    socket.on('score-update', (data: { home: number; away: number; salaId: string }) => {
      console.log(`⚽ ACTUALIZACIÓN EN TIEMPO REAL - Marcador: ${data.home} x ${data.away}`);
      if (data.salaId === salaId) {
        fetchLiveData(false, true);
      }
    });

    socket.on('ranking-update', (data: { salaId: string }) => {
      console.log(`📊 Actualización de ranking recibida`);
      if (data.salaId === salaId) {
        fetchLiveData(false, true);
      }
    });

    socket.on('live-room-update', (data: { salaId: string }) => {
      console.log(`🔄 Actualización de sala en vivo recibida`);
      if (data.salaId === salaId) {
        fetchLiveData(false, true);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-live-room', salaId);
        socketRef.current.disconnect();
      }
    };
  }, [salaId, router]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchLiveData(true, false);
      const pollingInterval = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL) || 3;
      startPolling(pollingInterval);
    };

    initializeData();

    return () => {
      stopPolling();
    };
  }, [salaId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log("🔄 Refresco manual solicitado");
    await fetchLiveData(true, false);
    setIsRefreshing(false);
  };

  const handleAddPrediction = () => {
    if (salaId) {
      router.push(`/jugador/prediccion/${salaId}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Conectando a la sala en vivo...</p>
        </div>
      </main>
    );
  }

  if (error || !liveData) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || "No se pudo cargar la sala"}</p>
          <p className="text-gray-500 text-sm mb-6">ID de sala: {salaId || "No disponible"}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleManualRefresh}
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition"
            >
              Reintentar
            </button>
            <Link href="/jugador/dashboard" className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const prediccionUsuario = liveData.userPrediction
    ? `${liveData.userPrediction.score_home} x ${liveData.userPrediction.score_away}`
    : "-- x --";

  const totalJugadores = liveData.ranking?.length || 0;
  const pozoActual = Number(liveData.total_pool) || 0;
  const userPosition = liveData.ranking?.findIndex(r => r.isUser) ?? -1;
  const posicionActual = userPosition >= 0 ? userPosition + 1 : "-";

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Link href="/jugador/dashboard" className="text-white hover:text-yellow-500 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Actualizar manualmente"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-500">EN VIVO</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">

          <div className="bg-gradient-to-br from-black to-gray-900 border border-yellow-500/20 rounded-2xl p-6 md:p-8 mb-6 shadow-2xl">
            <div className="grid grid-cols-3 items-center text-center gap-4">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full blur-md opacity-50"></div>
                  <img
                    src={liveData.home_team_logo}
                    alt={liveData.team_home}
                    className="relative w-16 h-16 md:w-24 md:h-24 object-contain rounded-full bg-black/50 p-2 border-2 border-yellow-500 shadow-xl"
                  />
                </div>
                <p className="text-white text-lg md:text-xl font-medium mb-2 truncate max-w-[150px]">
                  {liveData.team_home}
                </p>
                <span className={`text-yellow-500 text-5xl md:text-7xl font-bold leading-none transition-all duration-300 ${showScoreAnimation.home ? 'scale-150 text-green-500' : ''
                  }`}>
                  {liveData.current_score_home}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-transparent flex items-center justify-center border border-yellow-500/30">
                  <p className="text-yellow-500 text-xl md:text-2xl font-black">VS</p>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full blur-md opacity-50"></div>
                  <img
                    src={liveData.away_team_logo}
                    alt={liveData.team_away}
                    className="relative w-16 h-16 md:w-24 md:h-24 object-contain rounded-full bg-black/50 p-2 border-2 border-yellow-500 shadow-xl"
                  />
                </div>
                <p className="text-white text-lg md:text-xl font-medium mb-2 truncate max-w-[150px]">
                  {liveData.team_away}
                </p>
                <span className={`text-yellow-500 text-5xl md:text-7xl font-bold leading-none transition-all duration-300 ${showScoreAnimation.away ? 'scale-150 text-green-500' : ''
                  }`}>
                  {liveData.current_score_away}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-yellow-500/10">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">
                {new Date(liveData.match_date).toLocaleString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-xs tracking-wide uppercase mb-1">
                  TU PREDICCIÓN
                </p>
                <p className="text-3xl font-light text-yellow-500">
                  {prediccionUsuario}
                </p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 text-xs tracking-wide uppercase mb-1">
                  PREMIO POTENCIAL
                </p>
                <p className="text-2xl font-bold text-yellow-500">
                  R$ {pozoActual.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddPrediction}
            className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/25 text-sm"
          >
            AGREGAR PREDICCIÓN
          </button>

          {/* Ranking de jugadores */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-yellow-500/20 px-6 py-4">
              <h3 className="text-white text-sm font-light tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RANKING EN VIVO
                <span className="text-xs text-green-500 ml-2">(Actualización cada 3 segundos)</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Top 5 de {liveData.ranking?.length || 0} jugadores
                </span>
              </h3>
            </div>

            <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
              {liveData.ranking && liveData.ranking.length > 0 ? (
                <>
                  {/* Mostrar Top 5 */}
                  {liveData.ranking.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.userId || idx}
                      className={`px-6 py-3 transition-all duration-300 ${item.isUser ? "bg-yellow-500/5 border-l-2 border-yellow-500" : "hover:bg-white/5"
                        }`}
                    >
                      <div className="grid grid-cols-5 gap-2 items-center">
                        {/* Columna 1: Posición con ícono */}
                        <div className="flex justify-center w-10">
                          {item.position === 1 ? (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          ) : item.position === 2 ? (
                            <Trophy className="w-5 h-5 text-gray-400" />
                          ) : item.position === 3 ? (
                            <Trophy className="w-5 h-5 text-amber-600" />
                          ) : (
                            <span className="text-sm font-mono text-gray-500">
                              {item.position || idx + 1}°
                            </span>
                          )}
                        </div>

                        {/* Columna 2: Emoji */}
                        <div className="flex justify-center w-10">
                          <span className="text-xl">{item.emoji || '⚽'}</span>
                        </div>

                        {/* Columna 3: Nombre */}
                        <div className="flex-1 text-left">
                          <span className={`text-sm font-medium ${item.isUser ? "text-yellow-500" : "text-white"
                            }`}>
                            {item.isUser ? "TÚ" : item.name || 'Anónimo'}
                          </span>
                        </div>

                        {/* Columna 4: Predicción */}
                        <div className="flex justify-center w-20">
                          <span className="text-gray-300 text-sm font-mono">
                            {item.prediction || '-- x --'}
                          </span>
                        </div>

                        {/* Columna 5: Estado */}
                        <div className="flex justify-center w-24">
                          {item.status && (
                            <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'Excelente' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'Bien' ? 'bg-blue-500/20 text-blue-400' :
                                item.status === 'Regular' ? 'bg-yellow-500/20 text-yellow-400' :
                                  item.status === 'Imposible' ? 'bg-red-500/20 text-red-400 line-through' :
                                    'bg-gray-500/20 text-gray-400'
                              }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Si hay más de 5 jugadores */}
                  {liveData.ranking.length > 5 && (
                    <>
                      {/* Separador */}
                      <div className="px-6 py-2 text-center border-y border-yellow-500/10">
                        <span className="text-xs text-gray-500">⋯</span>
                      </div>

                      {/* Mostrar al usuario si no está en el Top 5 */}
                      {(() => {
                        const userInTop5 = liveData.ranking.slice(0, 5).some(r => r.isUser);
                        const userData = liveData.ranking.find(r => r.isUser);

                        if (!userInTop5 && userData) {
                          return (
                            <div className="px-6 py-3 bg-yellow-500/5 border-l-2 border-yellow-500">
                              <div className="grid grid-cols-4 gap-2 items-center">
                                {/* Columna 1: Posición */}
                                <div className="flex justify-center w-10">
                                  <span className="text-sm font-mono text-yellow-500">
                                    {userData.position}°
                                  </span>
                                </div>

                                {/* Columna 2: Emoji */}
                                <div className="flex justify-center w-10">
                                  <span className="text-xl">{userData.emoji || '⚽'}</span>
                                </div>

                                {/* Columna 3: Nombre */}
                                <div className="flex-1 justify-center w-20">
                                  <span className="text-sm font-medium text-yellow-500">
                                    TÚ
                                  </span>
                                </div>

                                {/* Columna 4: Predicción */}
                                <div className="flex justify-center w-20">
                                  <span className="text-gray-300 text-sm font-mono">
                                    {userData.prediction || '-- x --'}
                                  </span>
                                </div>

                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No hay predicciones para esta sala aún
                </div>
              )}
            </div>
          </div>

          {liveData.status === 'finished' && liveData.winners_count !== undefined && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
              <p className="text-green-400 font-medium">
                🏆 Partido Finalizado - {liveData.winners_count} ganador(es)
              </p>
              <p className="text-green-300 text-sm">
                Premio: R$ {liveData.total_prize || 0}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}