// app/bar/sala/[id]/page.tsx
"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Coins, Copy, Check, RefreshCw, QrCode, Clock } from "lucide-react";
import QRCode from "qrcode";
import { translations, type Locale } from "@/messages";

// Constantes fuera del componente
const LOCALE_STORAGE_KEY = "jugadaplay_locale";
const DEFAULT_LOCALE: Locale = "pt-BR";

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
  
  const t = translations[locale];

  // Inicializar idioma una sola vez
  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocale(initialLocale);
  }, []);

  // Guardar idioma cuando cambie
  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  // Datos derivados con useMemo para evitar recálculos
  const codigoSala = useMemo(() => 
    roomData?.room?.code || salaId.substring(0, 6).toUpperCase(), 
    [roomData?.room?.code, salaId]
  );
  
  const joinUrl = useMemo(() => 
    `${process.env.NEXT_PUBLIC_FRONTEND_URL}/bar/sala/${salaId}`,
    [salaId]
  );

  const participantCount = roomData?.participants?.length || 0;
  const totalRecaudado = useMemo(() => 
    participantCount * (roomData?.room?.entry_fee || 0),
    [participantCount, roomData?.room?.entry_fee]
  );

  // Formatear fechas una sola vez
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

  // Cargar datos
  const fetchRoomDetails = useCallback(async () => {
    if (!salaId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      console.log("los datos traidos de room son:",data)
      
      if (response.ok && data.success) {
        setRoomData(data.data);
      } else {
        setError(data.message || "Error al cargar la sala");
      }
    } catch (error) {
      console.error("Error cargando sala:", error);
      setError("Error al cargar los datos de la sala");
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  // Generar QR solo cuando joinUrl esté disponible y no sea loading
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

  // Cargar datos al montar
  useEffect(() => {
    if (salaId) fetchRoomDetails();
  }, [salaId, fetchRoomDetails]);

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
      } else {
        alert(data.message || "Error al cerrar predicciones");
      }
    } catch (error) {
      console.error("Error cerrando predicciones:", error);
      alert("Error al cerrar predicciones");
    }
  }, [salaId, fetchRoomDetails]);

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
                <div className="text-2xl font-light text-white">R$ {room.total_pool}</div>
                <div className="text-xs text-gray-500">POZO ACTUAL</div>
                <div className="text-xs text-yellow-500/70 mt-1">{participantCount} participantes</div>
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
                    onClick={fetchRoomDetails} 
                    className="hover:bg-yellow-500/10 p-1 rounded transition-all"
                    aria-label="Actualizar"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500 hover:text-yellow-500 transition-colors" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
                {participantCount > 0 ? (
                  participants.map((p, idx) => (
                    <div key={p.id} className="px-6 py-3 flex justify-between items-center">
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

            {/* Resumen del pozo */}
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-white font-light tracking-wide mb-4">RESUMEN</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total participantes:</span>
                  <span className="text-white">{participantCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total recaudado:</span>
                  <span className="text-white">R$ {}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor entrada:</span>
                  <span className="text-yellow-500">R$ {room.entry_fee}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                  <span className="text-gray-500">Ganador único lleva:</span>
                  <span className="text-yellow-500">R$ {room.total_pool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tu comisión (20%):</span>
                  <span className="text-green-500">R$ {}</span>
                </div>
              </div>
              {room.status === 'active' && (
                <button
                  onClick={handleClosePredictions}
                  className="w-full mt-6 border border-yellow-500/30 text-yellow-500 py-2 text-sm rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all"
                >
                  CERRAR PREDICCIONES
                </button>
              )}
              {room.status === 'closed' && (
                <p className="w-full mt-6 text-center text-yellow-500/70 text-sm">
                  Predicciones cerradas
                </p>
              )}
              {room.status === 'finished' && (
                <p className="w-full mt-6 text-center text-yellow-500/70 text-sm">
                  Partido finalizado
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}