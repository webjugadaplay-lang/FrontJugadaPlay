// app/bar/sala/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Crown, Users, Coins, Trophy, Copy, Check, RefreshCw, QrCode, Clock, Calendar } from "lucide-react";
import QRCode from "qrcode";
import { translations, type Locale } from "@/messages";

// Función para detectar idioma inicial
function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") {
    return savedLocale;
  }
  const browserLanguage = navigator.language || "";
  const normalizedLanguage = browserLanguage.toLowerCase();
  if (normalizedLanguage.startsWith("es")) return "es";
  if (normalizedLanguage.startsWith("pt")) return "pt-BR";
  return "pt-BR";
}

interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  venue: string;
  status: string;
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
  participants: Array<{
    id: string;
    user_id: string;
    user_name: string;
    total_points: number;
    joined_at: string;
  }>;
}

// Next.js 15 - params es una promesa
export default function SalaActiva({ params }: { params: Promise<{ id: string }> }) {
  const { id: salaId } = use(params);

  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const t = translations[locale];
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Detectar idioma
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  const codigoSala = roomData?.room?.code || (salaId ? salaId.substring(0, 6).toUpperCase() : "LOADING");
  const joinUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/entrar?code=${codigoSala}`;

  // Cargar datos de la sala
  useEffect(() => {
    if (salaId) {
      fetchRoomDetails();
    }
  }, [salaId]);

  const fetchRoomDetails = async () => {
    if (!salaId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
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
  };

  // Generar QR
  useEffect(() => {
    if (joinUrl && !joinUrl.includes("LOADING")) {
      QRCode.toDataURL(joinUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
  }, [joinUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codigoSala);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePredictions = async () => {
    if (!salaId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}/close`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchRoomDetails();
      } else {
        alert(data.message || "Error al cerrar predicciones");
      }
    } catch (error) {
      console.error("Error cerrando predicciones:", error);
      alert("Error al cerrar predicciones");
    }
  };

  if (!isLocaleReady || loading) {
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
  const matchDate = fixture ? new Date(fixture.match_date) : new Date();
  const closeDate = new Date(room.prediction_close_time);

  const fechaPartido = matchDate.toLocaleString(locale === 'es' ? 'es-ES' : 'pt-BR');
  const cierreFecha = closeDate.toLocaleString(locale === 'es' ? 'es-ES' : 'pt-BR');

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
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-xs tracking-wide">{t.header.language}</label>
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
            {fixture && (
              <p className="text-gray-500 text-sm mt-2">
                {fixture.venue && <span>{fixture.venue} | </span>}
                {fechaPartido}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              <p className="text-yellow-500/70 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Cierre: {cierreFecha}
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
                <div className="text-xs text-yellow-500/70 mt-1">{participants.length} participantes</div>
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
                    PARTICIPANTES <span className="text-yellow-500">({participants.length})</span>
                  </h3>
                  <button onClick={fetchRoomDetails} className="hover:bg-yellow-500/10 p-1 rounded transition-all">
                    <RefreshCw className="w-4 h-4 text-gray-500 hover:text-yellow-500 transition-colors" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
                {participants.length > 0 ? (
                  participants.map((p, idx) => (
                    <div key={p.id} className="px-6 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500 text-sm font-mono">#{idx + 1}</span>
                        <span className="text-white text-sm">{p.user_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-500 font-mono text-sm">{p.total_points} pts</span>
                        <span className="text-gray-500 text-xs">{new Date(p.joined_at).toLocaleDateString()}</span>
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
                  <span className="text-white">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total recaudado:</span>
                  <span className="text-white">R$ {(participants.length * room.entry_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor entrada:</span>
                  <span className="text-yellow-500">R$ {room.entry_fee}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                  <span className="text-gray-500">Ganador único lleva:</span>
                  <span className="text-yellow-500">R$ {(room.total_pool * 0.7).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tu comisión (20%):</span>
                  <span className="text-green-500">R$ {(room.total_pool * 0.2).toFixed(2)}</span>
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