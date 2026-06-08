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
  Target,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw
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

// Componente para mostrar notificaciones de goles
function GoalNotification({ homeScore, awayScore, isHomeGoal }: { 
  homeScore: number; 
  awayScore: number; 
  isHomeGoal: boolean;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        isHomeGoal ? 'bg-green-500' : 'bg-blue-500'
      } text-white`}>
        <div className="text-2xl">⚽</div>
        <div>
          <p className="font-bold text-lg">
            ¡GOL {isHomeGoal ? 'LOCAL' : 'VISITANTE'}!
          </p>
          <p className="text-sm">
            Marcador actual: {homeScore} - {awayScore}
          </p>
        </div>
      </div>
    </div>
  );
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
  const [showGoalNotif, setShowGoalNotif] = useState<{ show: boolean; isHome: boolean }>({ show: false, isHome: true });
  
  const socketRef = useRef<Socket | null>(null);
  const previousScoreRef = useRef<{ home: number; away: number } | null>(null);

  // 🔥 CONFIGURAR WEBSOCKET - CONEXIÓN EN TIEMPO REAL
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

    // Evento: conexión exitosa
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
      
      // Unirse a la sala específica
      socket.emit('join-live-room', salaId);
      console.log(`📡 Unido a sala: live-room-${salaId}`);
    });

    // Evento: desconexión
    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    // Evento: reconexión
    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos`);
      setIsConnected(true);
      socket.emit('join-live-room', salaId);
    });

    // Evento: error de conexión
    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    // 🔥 EVENTO PRINCIPAL: Escuchar actualizaciones del marcador
    socket.on('score-updated', (data) => {
      console.log('⚽ ¡ACTUALIZACIÓN DE MARCADOR VÍA WEBSOCKET!', data);
      
      // Actualizar el estado inmediatamente
      setLiveData(prev => {
        if (!prev) return prev;
        
        // Detectar qué equipo anotó
        const oldHome = prev.current_score_home;
        const oldAway = prev.current_score_away;
        const newHome = data.goals_home;
        const newAway = data.goals_away;
        
        let isHomeGoal = false;
        if (newHome > oldHome) isHomeGoal = true;
        if (newAway > oldAway) isHomeGoal = false;
        
        // Mostrar notificación de gol
        setShowGoalNotif({ show: true, isHome: isHomeGoal });
        setTimeout(() => setShowGoalNotif({ show: false, isHome: true }), 4000);
        
        // Reproducir sonido de gol (opcional)
        try {
          const audio = new Audio('/goal-sound.mp3');
          audio.play().catch(e => console.log('Audio no disponible'));
        } catch (e) {
          console.log('Error reproduciendo audio');
        }
        
        return {
          ...prev,
          current_score_home: data.goals_home,
          current_score_away: data.goals_away
        };
      });
      
      setLastUpdate(new Date());
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-live-room', salaId);
        socketRef.current.disconnect();
      }
    };
  }, [salaId, router]);

  // Función para obtener datos iniciales (solo la primera vez)
  const fetchInitialData = async () => {
    if (!salaId || salaId === 'undefined' || salaId === 'null') {
      console.error("❌ salaId inválido:", salaId);
      setError("ID de sala inválido o no proporcionado");
      setLoading(false);
      return;
    }

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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/player/live-room/${salaId}?_t=${Date.now()}`;
      console.log("📡 Cargando datos iniciales:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar la sala en vivo");
      }

      if (!data.success || !data.data) {
        throw new Error("No se pudo cargar la información en vivo");
      }

      console.log("✅ Datos iniciales cargados:", {
        score: `${data.data.current_score_home} x ${data.data.current_score_away}`,
        players: data.data.ranking?.length
      });

      setLiveData(data.data);
      previousScoreRef.current = {
        home: data.data.current_score_home,
        away: data.data.current_score_away
      };
      setLastUpdate(new Date());
      setError("");

    } catch (err: any) {
      console.error("❌ Error cargando sala en vivo:", err);
      setError(err.message || "Error al cargar la sala en vivo");
    } finally {
      setLoading(false);
    }
  };

  // Refrescar manualmente (fallback si WebSocket falla)
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/player/live-room/${salaId}?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setLiveData(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error en refresh manual:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchInitialData();
  }, [salaId]);

  // Mostrar loading
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

  // Mostrar error
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
      {/* Notificación de gol */}
      {showGoalNotif.show && (
        <GoalNotification 
          homeScore={liveData.current_score_home}
          awayScore={liveData.current_score_away}
          isHomeGoal={showGoalNotif.isHome}
        />
      )}

      {/* Header */}
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
              {/* Indicador de conexión WebSocket */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-500 hidden sm:inline">Tiempo real</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-xs text-red-500 hidden sm:inline">Reconectando...</span>
                  </>
                )}
              </div>
              
              {/* Botón refresh manual */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Actualizar manualmente"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Indicador EN VIVO */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-500">EN VIVO</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          
          {/* Info de última actualización */}
          <div className="flex justify-between items-center text-xs mb-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="text-green-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Conexión en tiempo real activa
                </span>
              ) : (
                <span className="text-yellow-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
 Usando actualización por polling
                </span>
              )}
            </div>
            <span className="text-gray-600">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Marcador */}
          <div className="bg-gradient-to-br from-black to-gray-900 border border-yellow-500/20 rounded-2xl p-6 md:p-8 mb-6 shadow-2xl">
            <div className="grid grid-cols-3 items-center text-center gap-4">
              {/* Equipo local */}
              <div className="flex flex-col items-center">
                <p className="text-white text-xl md:text-2xl font-light mb-2">
                  {liveData.team_home}
                </p>
                <span className="text-yellow-500 text-5xl md:text-7xl font-bold leading-none transition-all duration-300 hover:scale-110 inline-block">
                  {liveData.current_score_home}
                </span>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-gray-500 text-lg md:text-2xl font-light">VS</p>
                <span className="mt-2 text-gray-600 text-sm">-</span>
              </div>

              {/* Equipo visitante */}
              <div className="flex flex-col items-center">
                <p className="text-white text-xl md:text-2xl font-light mb-2">
                  {liveData.team_away}
                </p>
                <span className="text-yellow-500 text-5xl md:text-7xl font-bold leading-none transition-all duration-300 hover:scale-110 inline-block">
                  {liveData.current_score_away}
                </span>
              </div>
            </div>

            {/* Fecha del partido */}
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

          {/* Tarjeta de predicción del usuario */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tu predicción */}
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-xs tracking-wide uppercase mb-1">
                  TU PREDICCIÓN
                </p>
                <p className="text-3xl font-light text-yellow-500">
                  {prediccionUsuario}
                </p>
              </div>

              {/* Posición actual */}
              <div className="text-center">
                <p className="text-gray-400 text-xs tracking-wide uppercase mb-1">
                  POSICIÓN ACTUAL
                </p>
                <p className="text-3xl font-light text-white">
                  {posicionActual}
                  {typeof posicionActual === "number" ? "°" : ""}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  de {totalJugadores} jugadores
                </p>
              </div>

              {/* Premio potencial */}
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

          {/* Estadísticas de la sala */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              ESTADO DEL RANKING
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between items-center md:block">
                <span className="text-gray-400">Marcador actual:</span>
                <span className="text-white font-bold md:mt-1 block">
                  {liveData.current_score_home} - {liveData.current_score_away}
                </span>
              </div>

              <div className="flex justify-between items-center md:block">
                <span className="text-gray-400">Valor entrada:</span>
                <span className="text-yellow-500 font-bold md:mt-1 block">
                  R$ {Number(liveData.entry_fee).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center md:block">
                <span className="text-gray-400">Jugadores:</span>
                <span className="text-white font-bold md:mt-1 block">
                  {totalJugadores}
                </span>
              </div>
            </div>
          </div>

          {/* Ranking de jugadores */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-yellow-500/20 px-6 py-4">
              <h3 className="text-white text-sm font-light tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RANKING EN VIVO
                {!isConnected && (
                  <span className="text-xs text-yellow-500 ml-2">(Actualización cada 5s)</span>
                )}
              </h3>
            </div>

            <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
              {liveData.ranking && liveData.ranking.length > 0 ? (
                liveData.ranking.map((item, idx) => (
                  <div
                    key={item.userId}
                    className={`px-6 py-3 flex justify-between items-center transition-all duration-300 ${
                      item.isUser ? "bg-yellow-500/5 border-l-2 border-yellow-500" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Posición con medalla para top 3 */}
                      <div className="w-10">
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

                      {/* Avatar y nombre */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji || '⚽'}</span>
                        <span className={`text-sm font-medium ${item.isUser ? "text-yellow-500" : "text-white"}`}>
                          {item.isUser ? "TÚ" : item.name}
                        </span>
                      </div>
                    </div>

                    {/* Predicción y estado */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-300 text-sm font-mono">
                        {item.prediction}
                      </span>
                      {item.status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'Excelente' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'Bien' ? 'bg-blue-500/20 text-blue-400' :
                          item.status === 'Regular' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No hay predicciones para esta sala aún
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}