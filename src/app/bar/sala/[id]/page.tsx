// app/bar/sala/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Users, Coins, Trophy, Copy, Check, RefreshCw, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface Room {
  id: string;
  partido: string;
  fecha: string;
  cierre: string;
  entrada: number;
  pozo: number;
  status: string;
  predicciones: Prediction[];
}

interface Prediction {
  id: string;
  jugador: string;
  prediccion: string;
  pagada: boolean;
}

export default function SalaActiva({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [closingPredictions, setClosingPredictions] = useState(false);

  const salaId = params.id;

  // Generar código de sala (primeros 6 caracteres del ID)
  const codigoSala = salaId.substring(0, 6).toUpperCase();

  // URL para que los jugadores se unan a la sala
  const joinUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/entrar?code=${codigoSala}`;

  // Cargar datos de la sala
  useEffect(() => {
    fetchRoomDetails();
  }, [salaId]);

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRoom(data.data);
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
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#EAB308',
          light: '#000000'
        }
      }, (err, url) => {
        if (err) {
          console.error("Error generando QR:", err);
        } else {
          setQrCodeUrl(url);
        }
      });
    }
  }, [joinUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codigoSala);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePredictions = async () => {
    setClosingPredictions(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/${salaId}/close`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchRoomDetails(); // Recargar datos
      } else {
        alert(data.message || "Error al cerrar predicciones");
      }
    } catch (error) {
      console.error("Error cerrando predicciones:", error);
      alert("Error al cerrar predicciones");
    } finally {
      setClosingPredictions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando sala...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500">{error || "Sala no encontrada"}</div>
      </div>
    );
  }

  const fechaPartido = new Date(room.fecha).toLocaleString();
  const cierreFecha = new Date(room.cierre).toLocaleString();

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">ID: {salaId.substring(0, 8)}</span>
              <span className="text-sm text-yellow-500 tracking-wide">SALA: {codigoSala}</span>
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
              {room.partido}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {fechaPartido} | Cierre: {cierreFecha}
            </p>
            <p className="text-yellow-500 text-xs mt-1">
              Entrada: R$ {room.entrada} por predicción
            </p>
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
                <p className="text-yellow-500/70 text-xs mt-1">
                  Link directo: {joinUrl}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">R$ {room.pozo}</div>
                <div className="text-xs text-gray-500">POZO ACTUAL</div>
                <div className="text-xs text-yellow-500/70 mt-1">{room.predicciones.length} predicciones</div>
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
                    JUGADORES <span className="text-yellow-500">({room.predicciones.length})</span>
                  </h3>
                  <button onClick={fetchRoomDetails} className="hover:bg-yellow-500/10 p-1 rounded transition-all">
                    <RefreshCw className="w-4 h-4 text-gray-500 hover:text-yellow-500 transition-colors" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-yellow-500/10 max-h-[400px] overflow-y-auto">
                {room.predicciones.length > 0 ? (
                  room.predicciones.map((p, idx) => (
                    <div key={p.id} className="px-6 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500 text-sm font-mono">#{idx + 1}</span>
                        <span className="text-white text-sm">{p.jugador}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-500 font-mono text-sm">{p.prediccion}</span>
                        {p.pagada ? (
                          <span className="text-green-500 text-xs">Pagada</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Pendiente</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Aún no hay predicciones
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del pozo */}
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-white font-light tracking-wide mb-4">RESUMEN</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total jugadores:</span>
                  <span className="text-white">{room.predicciones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total recaudado:</span>
                  <span className="text-white">R$ {(room.predicciones.filter(p => p.pagada).length * room.entrada).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor entrada:</span>
                  <span className="text-yellow-500">R$ {room.entrada}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                  <span className="text-gray-500">Ganador único lleva:</span>
                  <span className="text-yellow-500">R$ {(room.pozo * 0.7).toFixed(2)}</span>
                </div>
              </div>
              {room.status === 'active' && (
                <button
                  onClick={handleClosePredictions}
                  disabled={closingPredictions}
                  className="w-full mt-6 border border-yellow-500/30 text-yellow-500 py-2 text-sm rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all disabled:opacity-50"
                >
                  {closingPredictions ? "CERRANDO..." : "CERRAR PREDICCIONES"}
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