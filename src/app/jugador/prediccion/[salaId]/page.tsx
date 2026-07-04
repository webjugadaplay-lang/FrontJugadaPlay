// app/jugador/prediccion/[salaId]/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { translations, type Locale } from "@/messages";

interface Room {
  id: string;
  name: string;
  team_home: string;
  home_team_logo: string;
  team_away: string;
  away_team_logo: string;
  match_date: string;
  prediction_close_time: string;
  entry_fee: number | string;
  total_pool: number | string;
  status: string;
  room_code?: string;
  bar: {
    id?: string;
    name: string;
    bar_name: string;
  };
}

interface Prediction {
  id: string;
  score_home: number;
  score_away: number;
  paid: boolean;
  created_at: string;
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") return savedLocale;
  const browserLanguage = navigator.language || "";
  if (browserLanguage.toLowerCase().startsWith("es")) return "es";
  if (browserLanguage.toLowerCase().startsWith("pt")) return "pt-BR";
  return "pt-BR";
}

export default function PredecirMarcador() {
  const router = useRouter();
  const params = useParams<{ salaId: string }>();
  const salaId = params?.salaId;

  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [scrolled, setScrolled] = useState(false);

  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [existingPredictions, setExistingPredictions] = useState<Prediction[]>([]);
  const [lastPrediction, setLastPrediction] = useState<Prediction | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [limitError, setLimitError] = useState<{
    show: boolean;
    message: string;
    scoreHome: number;
    scoreAway: number;
  }>({
    show: false,
    message: "",
    scoreHome: 0,
    scoreAway: 0
  });

  const t = translations[locale];

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
  }, []);

  useEffect(() => {
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 PRIMERO: Verificar autenticación
  useEffect(() => {
    if (!salaId) {
      setError("ID de sala inválido");
      setLoading(false);
      setLoadingData(false);
      setAuthChecked(true);
      return;
    }

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    console.log('🔍 Verificando autenticación...');
    console.log('🔑 Token:', token ? '✅ Presente' : '❌ Ausente');
    console.log('📌 Sala ID:', salaId);

    if (!token || !userData) {
      console.log('🔒 Usuario no autenticado, redirigiendo al login');
      const currentUrl = `/jugador/prediccion/${salaId}`;
      const redirectParam = encodeURIComponent(currentUrl);
      localStorage.setItem("redirectAfterLogin", currentUrl);
      setIsRedirecting(true);
      router.push(`/login?redirect=${redirectParam}`);
      return;
    }

    try {
      const user = JSON.parse(userData);
      console.log('👤 Usuario parseado:', user);
      console.log('🎭 Rol del usuario:', user.role);
      
      if (user.role !== "player") {
        console.log('🚫 Usuario no es jugador, redirigiendo al login');
        const currentUrl = `/jugador/prediccion/${salaId}`;
        const redirectParam = encodeURIComponent(currentUrl);
        localStorage.setItem("redirectAfterLogin", currentUrl);
        setIsRedirecting(true);
        router.push(`/login?redirect=${redirectParam}`);
        return;
      }
    } catch (e) {
      console.log('❌ Error al parsear user data:', e);
      const currentUrl = `/jugador/prediccion/${salaId}`;
      const redirectParam = encodeURIComponent(currentUrl);
      localStorage.setItem("redirectAfterLogin", currentUrl);
      setIsRedirecting(true);
      router.push(`/login?redirect=${redirectParam}`);
      return;
    }

    console.log('✅ Usuario autenticado como jugador');
    setAuthChecked(true);
    setLoading(false);
  }, [salaId, router]);

  // Función para cargar las predicciones existentes
  const fetchExistingPredictions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/predictions/${salaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.success && data.data) {
        console.log(`📦 Encontradas ${data.data.length} predicciones previas`);
        setExistingPredictions(data.data);

        if (data.data.length > 0) {
          const mostRecent = data.data[0];
          setLastPrediction(mostRecent);
          setGolesLocal(mostRecent.score_home);
          setGolesVisitante(mostRecent.score_away);
        } else {
          setLastPrediction(null);
          setGolesLocal(0);
          setGolesVisitante(0);
        }
      } else {
        console.log("No hay predicciones previas para esta sala");
        setExistingPredictions([]);
        setLastPrediction(null);
        setGolesLocal(0);
        setGolesVisitante(0);
      }
    } catch (error) {
      console.error("Error al buscar predicciones:", error);
      setExistingPredictions([]);
      setLastPrediction(null);
    }
  };

  // 🔥 SEGUNDO: Cargar datos de la sala SOLO después de autenticación
  useEffect(() => {
    if (!authChecked || !salaId) return;

    const fetchRoomData = async () => {
      console.log('📡 Iniciando carga de datos de la sala...');
      setLoadingData(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        
        const roomUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}`;
        console.log('📡 Fetching:', roomUrl);
        
        const roomResponse = await fetch(roomUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📡 Response status:', roomResponse.status);

        if (roomResponse.status === 401 || roomResponse.status === 403) {
          console.log('🔑 Token expirado, redirigiendo al login');
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          const currentUrl = `/jugador/prediccion/${salaId}`;
          localStorage.setItem("redirectAfterLogin", currentUrl);
          setIsRedirecting(true);
          router.push("/login");
          return;
        }

        const roomData = await roomResponse.json();
        console.log('📦 DATOS DEL BACKEND:', roomData);

        if (!roomResponse.ok || !roomData.success) {
          console.log('❌ Error en la respuesta:', roomData.message);
          throw new Error(roomData.message || "Error al cargar la sala");
        }

        // Combinar datos de room y fixture
        const roomFromApi = roomData.data.room;
        const fixtureFromApi = roomData.data.fixture;

        const combinedRoom: Room = {
          id: roomFromApi.id,
          name: roomFromApi.name,
          team_home: fixtureFromApi?.home_team || 'Equipo Local',
          home_team_logo: fixtureFromApi?.home_team_logo || '',
          team_away: fixtureFromApi?.away_team || 'Equipo Visitante',
          away_team_logo: fixtureFromApi?.away_team_logo || '',
          match_date: fixtureFromApi?.match_date || roomFromApi.match_date,
          prediction_close_time: roomFromApi.prediction_close_time,
          entry_fee: roomFromApi.entry_fee,
          total_pool: roomFromApi.total_pool,
          status: roomFromApi.status,
          room_code: roomFromApi.code,
          bar: {
            name: 'Bar',
            bar_name: 'Bar'
          }
        };

        console.log('🏠 Sala combinada:', combinedRoom);
        setRoom(combinedRoom);

        // Cargar predicciones existentes
        await fetchExistingPredictions();

      } catch (err: any) {
        console.error('❌ Error cargando sala:', err);
        setError(err.message || "Error al cargar los datos");
      } finally {
        console.log('✅ Carga de datos completada');
        setLoadingData(false);
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [authChecked, salaId, router]);

  // Función para limpiar el error de límite y resetear el marcador
  const clearLimitErrorAndReset = () => {
    setLimitError({ show: false, message: "", scoreHome: 0, scoreAway: 0 });
  };

  const handleSubmit = async () => {
    if (!salaId) {
      setError("ID de sala inválido");
      return;
    }

    if (!room) {
      setError("Datos de la sala no disponibles");
      return;
    }

    setError("");
    setLimitError({ show: false, message: "", scoreHome: 0, scoreAway: 0 });

    const token = localStorage.getItem("token");
    if (!token) {
      const currentUrl = `/jugador/prediccion/${salaId}`;
      localStorage.setItem("redirectAfterLogin", currentUrl);
      setIsRedirecting(true);
      router.push("/login");
      return;
    }

    setSaving(true);

    try {
      const entryFeeValue = typeof room.entry_fee === 'string'
        ? parseFloat(room.entry_fee)
        : room.entry_fee;

      const payload = {
        room_id: salaId,
        score_home: golesLocal,
        score_away: golesVisitante,
        entry_fee_paid: entryFeeValue
      };

      console.log("📤 Enviando predicción:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const currentUrl = `/jugador/prediccion/${salaId}`;
        localStorage.setItem("redirectAfterLogin", currentUrl);
        setIsRedirecting(true);
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.message && data.message.includes('límite de 3 predicciones')) {
          setLimitError({
            show: true,
            message: data.message,
            scoreHome: golesLocal,
            scoreAway: golesVisitante
          });
          setSaving(false);
          return;
        }
        
        throw new Error(data.message || "Error al guardar");
      }

      console.log("✅ Predicción guardada, redirigiendo a pago");
      router.push(`/jugador/pago/${salaId}`);

    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Componente de error de límite
  const LimitErrorBanner = () => {
    if (!limitError.show) return null;

    return (
      <div className="mb-6 p-4 md:p-6 bg-red-500/10 border-2 border-red-500/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              </div>
            </div>
            <div className="flex-1 md:flex-none">
              <h3 className="text-red-500 font-semibold text-sm md:text-base">
                Límite alcanzado
              </h3>
            </div>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <p className="text-red-400 text-xs md:text-sm leading-relaxed">
              {limitError.message}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Marcador seleccionado:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-md">
                <span className="text-white font-bold text-sm">{limitError.scoreHome}</span>
                <span className="text-red-500 text-xs">vs</span>
                <span className="text-white font-bold text-sm">{limitError.scoreAway}</span>
              </span>
            </div>
          </div>

          <button
            onClick={clearLimitErrorAndReset}
            className="w-full md:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Cambiar marcador</span>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-red-500/20">
          <p className="text-gray-400 text-xs mb-2">
            💡 Sugerencia: Elige otro marcador disponible
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { home: 0, away: 0 },
              { home: 1, away: 0 },
              { home: 0, away: 1 },
              { home: 1, away: 1 },
              { home: 2, away: 0 },
              { home: 0, away: 2 }
            ].map((score) => {
              if (score.home === limitError.scoreHome && score.away === limitError.scoreAway) {
                return null;
              }
              return (
                <button
                  key={`${score.home}-${score.away}`}
                  onClick={() => {
                    setGolesLocal(score.home);
                    setGolesVisitante(score.away);
                    clearLimitErrorAndReset();
                  }}
                  className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md text-xs transition-all duration-200 border border-gray-700/50 hover:border-yellow-500/30"
                >
                  {score.home} - {score.away}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 🔥 ESTADOS DE CARGA - CORREGIDOS
  if (isRedirecting) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-yellow-500">Redirigiendo...</p>
        </div>
      </main>
    );
  }

  // 🔥 Mostrar loading mientras verifica autenticación O carga datos
  if (loading || loadingData || !authChecked) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-yellow-500 text-sm">
            {!authChecked ? 'Verificando autenticación...' : 'Cargando sala...'}
          </p>
        </div>
      </main>
    );
  }

  // 🔥 Solo mostrar error si NO está cargando y realmente hay un error
  if (error && !loadingData && !loading && !room) {
    return (
      <main className="min-h-screen bg-black">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20" : "bg-transparent"}`}>
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20 gap-4">
              <Link href="/entrar" className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm hidden md:inline">Volver</span>
              </Link>
              <Link href="/" className="flex items-center">
                <img src="/logo-jugadaplay.svg" alt="Jugada Play" className="h-10 md:h-12 object-contain" />
              </Link>
              <div className="w-20"></div>
            </div>
          </div>
        </header>
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-center max-w-md px-4">
            <p className="text-red-500 mb-4">{error || "Sala no encontrada"}</p>
            <div className="flex flex-col gap-3 items-center">
              <Link href="/entrar" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                Volver
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-400 hover:text-yellow-500 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 🔥 Si no hay sala pero está cargando o no hay error, mostrar loading
  if (!room) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-yellow-500 text-sm">Cargando sala...</p>
        </div>
      </main>
    );
  }

  const fechaPartido = new Date(room.match_date).toLocaleString(locale === "pt-BR" ? "pt-BR" : "es-CO");
  const isMatchClosed = new Date(room.prediction_close_time) < new Date();
  const isMatchFinished = room.status === "finished" || room.status === "closed";

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20" : "bg-transparent"}`}>
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20 gap-4">
            <Link href="/jugador/dashboard" className="flex items-center">
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

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
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              {t.prediction.title}{" "}
              <span className="text-yellow-500 font-medium">{t.prediction.subtitle}</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mx-auto mt-3"></div>
          </div>

          <LimitErrorBanner />

          {existingPredictions.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
              <p className="text-yellow-500 text-sm">
                Ya has hecho {existingPredictions.length} predicción{existingPredictions.length !== 1 ? 'es' : ''} para este partido.
                {existingPredictions.length === 1 ? ' Esta es tu primera predicción.' : ' ¡Puedes hacer otra!'}
              </p>
            </div>
          )}

          {/* Tarjeta del partido */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-6 md:p-8 mb-8">
            <div className="grid grid-cols-3 gap-4 items-center mb-8">
              <div className="flex flex-col items-center text-center">
                <img
                  src={room.home_team_logo || '/default-logo.png'}
                  alt={room.team_home}
                  className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-full bg-black/50 p-2 border-2 border-yellow-500 shadow-xl mb-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h2 className="text-white text-sm md:text-xl font-medium mb-3 truncate max-w-[120px] md:max-w-[200px]">
                  {room.team_home}
                </h2>
                <div className="flex justify-center items-center gap-2 md:gap-4 text-white">
                  <button
                    onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  </button>
                  <span className="text-4xl md:text-6xl font-bold text-white w-14 md:w-20 text-center">{golesLocal}</span>
                  <button
                    onClick={() => setGolesLocal(golesLocal + 1)}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-yellow-500/30 flex items-center justify-center mx-auto">
                  <span className="text-yellow-500 text-base md:text-xl font-bold">{t.prediction.vs}</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <img
                  src={room.away_team_logo || '/default-logo.png'}
                  alt={room.team_away}
                  className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-full bg-black/50 p-2 border-2 border-yellow-500 shadow-xl mb-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h2 className="text-white text-sm md:text-xl font-medium mb-3 truncate max-w-[120px] md:max-w-[200px]">
                  {room.team_away}
                </h2>
                <div className="flex justify-center items-center gap-2 md:gap-4 text-white">
                  <button
                    onClick={() => setGolesVisitante(Math.max(0, golesVisitante - 1))}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  </button>
                  <span className="text-4xl md:text-6xl font-bold text-white w-14 md:w-20 text-center">{golesVisitante}</span>
                  <button
                    onClick={() => setGolesVisitante(golesVisitante + 1)}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-yellow-500/20 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{fechaPartido}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {t.prediction.prizePool}: R$ {Number(room.total_pool).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {t.prediction.entryFee}: R$ {Number(room.entry_fee).toFixed(2)}
                  </span>
                </div>
              </div>
              {room.bar?.bar_name && (
                <div className="text-center mt-4 text-gray-500 text-sm">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {room.bar.bar_name}
                </div>
              )}
            </div>

            {(isMatchClosed || isMatchFinished) && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {isMatchFinished ? t.prediction.matchFinished : t.prediction.matchClosed}
                </p>
              </div>
            )}

            {lastPrediction && lastPrediction.paid && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Última predicción pagada: {lastPrediction.score_home} x {lastPrediction.score_away}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || isMatchClosed || isMatchFinished}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/25"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.prediction.saving}
              </span>
            ) : (
              existingPredictions.length === 0 ? "Guardar y Continuar al Pago" : "Guardar Nueva Predicción"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}