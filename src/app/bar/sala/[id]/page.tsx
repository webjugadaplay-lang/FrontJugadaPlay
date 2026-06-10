// app/bar/sala/[id]/page.tsx
"use client";

import { useState, useEffect, use, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Coins, Copy, Check, RefreshCw, QrCode, Clock, TrendingUp, Percent } from "lucide-react";
import QRCode from "qrcode";
import { translations, type Locale } from "@/messages";

// Constantes
const LOCALE_STORAGE_KEY = "jugadaplay_locale";
const DEFAULT_LOCALE: Locale = "pt-BR";
const POLLING_INTERVAL = 3000; // Actualizar cada 3 segundos

// Función para detectar idioma inicial
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === "pt-BR" || saved === "es") return saved;
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("pt")) return "pt-BR";
  
  return DEFAULT_LOCALE;
}

interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  venue: string;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  total_points: number;
  joined_at: string;
}

interface RoomData {
  room: {
    id: string;
    code: string;
    name: string;
    entry_fee: number;
    total_pool: number;
    total_collected: number;
    bar_commission: number;
    platform_commission: number;
    status: string;
    prediction_close_time: string;
    current_participants: number;
    max_participants: number;
  };
  fixture: Fixture | null;
  participants: Participant[];
}

export default function SalaActiva({ params }: { params: Promise<{ id: string }> }) {
  const { id: salaId } = use(params);
  const router = useRouter();
  
  // Estados
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Refs para polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  const t = translations[locale];

  // Inicializar idioma
  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocale(initialLocale);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Guardar idioma
  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  // Datos derivados con useMemo
  const codigoSala = useMemo(() => 
    roomData?.room?.code || salaId.substring(0, 6).toUpperCase(), 
    [roomData?.room?.code, salaId]
  );
  
  const joinUrl = useMemo(() => 
    `${process.env.NEXT_PUBLIC_FRONTEND_URL}/bar/sala/${salaId}`,
    [salaId]
  );

  const participantCount = roomData?.participants?.length || 0;
  
  // Usar datos directos de la BD en lugar de calcular
  const totalRecaudado = roomData?.room?.total_collected || 0;
  const comisionBar = roomData?.room?.bar_commission || 0;
  const comisionPlatform = roomData?.room?.platform_commission || 0;
  const pozoGanador = roomData?.room?.total_pool || 0;

  // Formatear fechas
  const formattedDates = useMemo(() => {
    if (!roomData?.fixture || !roomData?.room) return null;
    
    const matchDate = new Date(roomData.fixture.match_date);
    const closeDate = new Date(roomData.room.prediction_close_time);
    const localeStr = locale === 'es' ? 'es-ES' : 'pt-BR';
    
    return {
      match: matchDate.toLocaleString(localeStr),
      close: closeDate.toLocaleString(localeStr)
    };
  }, [roomData?.fixture?.match_date, roomData?.room?.prediction_close_time, locale]);

  // Cargar datos desde el backend
  const fetchRoomDetails = useCallback(async (showRefreshIndicator = false) => {
    if (!salaId) return;
    
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && isMountedRef.current) {
        setRoomData(data.data);
        setLastUpdated(new Date());
        setError("");
      } else if (isMountedRef.current) {
        setError(data.message || "Error al cargar la sala");
      }
    } catch (error) {
      console.error("Error cargando sala:", error);
      if (isMountedRef.current) {
        setError("Error al cargar los datos de la sala");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [salaId]);

  // Configurar polling para actualización automática
  useEffect(() => {
    if (!salaId) return;
    
    // Carga inicial
    fetchRoomDetails();
    
    // Configurar polling periódico
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && roomData?.room?.status === 'active') {
        fetchRoomDetails(true);
      } else if (roomData?.room?.status !== 'active' && pollingIntervalRef.current) {
        // Detener polling si la sala ya no está activa
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, POLLING_INTERVAL);
    
    // Limpiar polling al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [salaId, fetchRoomDetails, roomData?.room?.status]);

  // Generar QR
  useEffect(() => {
    if (!joinUrl || joinUrl.includes("LOADING") || !salaId) return;
    
    QRCode.toDataURL(joinUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#EAB308', light: '#000000' }
    }, (err, url) => {
      if (!err) setQrCodeUrl(url);
    });
  }, [joinUrl, salaId]);

  // Handlers
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(codigoSala);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codigoSala]);

  const handleClosePredictions = useCallback(async () => {
    if (!salaId) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}/close`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchRoomDetails();
        // Detener polling si la sala ya no está activa
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        alert(data.message || "Error al cerrar predicciones");
      }
    } catch (error) {
      console.error("Error cerrando predicciones:", error);
      alert("Error al cerrar predicciones");
    }
  }, [salaId, fetchRoomDetails]);

  const handleManualRefresh = useCallback(() => {
    fetchRoomDetails(true);
  }, [fetchRoomDetails]);

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">{t.common.loading}</div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500">{error || "Sala no encontrada"}</div>
      </div>
    );
  }

  const { room, fixture, participants } = roomData;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Image
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                width={140}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              {/* Indicador de actualización en vivo */}
              {isRefreshing && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-500">Actualizando...</span>
                </div>
              )}
              {!isRefreshing && room.status === 'active' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-xs text-yellow-500/70">En vivo</span>
                </div>
              )}
              <span className="text-xs text-gray-500">ID: {salaId.substring(0, 8)}</span>
              <span className="text-sm text-yellow-500 tracking-wide">SALA: {codigoSala}</span>
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
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Info del partido */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              {room.name}
            </h1>
            {fixture && formattedDates && (
              <p className="text-gray-500 text-sm mt-2">
                {fixture.venue && <span>{fixture.venue} | </span>}
                {formattedDates.match}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              <p className="text-yellow-500/70 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Cierre: {formattedDates?.close}
              </p>
              <p className="text-yellow-500 text-xs flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Entrada: R$ {room.entry_fee}
              </p>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          {/* QR y código */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-32 h-32 bg-black rounded-xl flex items-center justify-center border border-yellow-500/30 overflow-hidden">
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-yellow-500/50" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-gray-400 text-sm">Código de acceso:</span>
                  <span className="text-2xl font-mono text-yellow-500 tracking-wider">{codigoSala}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-yellow-500/10 rounded transition-all"
                    aria-label="Copiar código"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-yellow-500" />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Escanea el QR o comparte el código para que los jugadores se unan
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 transition-all duration-300">
                  R$ {pozoGanador.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">POZO ACTUAL</div>
                <div className="text-xs text-yellow-500/70 mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  {participantCount} participantes
                </div>
              </div>
            </div>
          </div>

          {/* Ranking y jugadores */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Lista de jugadores */}
            <div className="md:col-span-2 bg-black/30 border border-yellow-500/20 rounded-xl overflow-hidden">
              <div className="border-b border-yellow-500/20 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-light tracking-wide">
                    PARTICIPANTES <span className="text-yellow-500">({participantCount})</span>
                  </h3>
                  <button 
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="hover:bg-yellow-500/10 p-1 rounded transition-all disabled:opacity-50"
                    aria-label="Actualizar"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-500 hover:text-yellow-500 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
                {participantCount > 0 ? (
                  participants.map((p, idx) => (
                    <div key={p.id} className="px-6 py-3 flex justify-between items-center hover:bg-yellow-500/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500 text-sm font-mono">#{idx + 1}</span>
                        <span className="text-white text-sm">{p.user_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-500 font-mono text-sm">{p.total_points} pts</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(p.joined_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Aún no hay participantes
                  </div>
                )}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-white font-light tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RESUMEN FINANCIERO
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total participantes:</span>
                  <span className="text-white font-mono">{participantCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor entrada:</span>
                  <span className="text-yellow-500">R$ {room.entry_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                  <span className="text-gray-500">Total recaudado:</span>
                  <span className="text-white font-bold">R$ {totalRecaudado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Pozo ganador (70%):
                  </span>
                  <span className="text-yellow-500 font-bold">R$ {pozoGanador.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Comisión bar (20%):
                  </span>
                  <span className="text-green-500">R$ {comisionBar.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-yellow-500/20">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Comisión plataforma (10%):
                  </span>
                  <span className="text-blue-500">R$ {comisionPlatform.toFixed(2)}</span>
                </div>
                
                {/* Distribución visual */}
                <div className="pt-3">
                  <div className="text-xs text-gray-500 mb-2">Distribución del total recaudado:</div>
                  <div className="h-2 rounded-full overflow-hidden flex">
                    <div className="bg-yellow-500 h-full" style={{ width: '70%' }} title="70% Pozo ganador" />
                    <div className="bg-green-500 h-full" style={{ width: '20%' }} title="20% Comisión bar" />
                    <div className="bg-blue-500 h-full" style={{ width: '10%' }} title="10% Comisión plataforma" />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-yellow-500">70% Pozo</span>
                    <span className="text-green-500">20% Bar</span>
                    <span className="text-blue-500">10% Plataforma</span>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción según estado */}
              {room.status === 'active' && (
                <button
                  onClick={handleClosePredictions}
                  className="w-full mt-6 border border-yellow-500/30 text-yellow-500 py-2 text-sm rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all"
                >
                  CERRAR PREDICCIONES
                </button>
              )}
              {room.status === 'closed' && (
                <div className="w-full mt-6 text-center">
                  <p className="text-yellow-500/70 text-sm">
                    ⏰ Predicciones cerradas
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    Esperando resultado del partido
                  </p>
                </div>
              )}
              {room.status === 'finished' && (
                <div className="w-full mt-6 text-center">
                  <p className="text-yellow-500 text-sm">
                    🏆 Partido finalizado
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    R$ {pozoGanador.toFixed(2)} para el ganador
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}