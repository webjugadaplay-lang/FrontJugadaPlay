// app/jugador/prediccion/[salaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Trophy, Coins, AlertCircle, ChevronRight, Plus, Minus, Loader2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  team_home: string;
  team_away: string;
  match_date: string;
  prediction_close_time: string;
  entry_fee: number;
  total_pool: number;
  status: string;
  bar: {
    name: string;
    bar_name: string;
  };
}

interface ExistingPrediction {
  id: string;
  score_home: number;
  score_away: number;
}

export default function PredecirMarcador({ params }: { params: { salaId: string } }) {
  const router = useRouter();
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [existingPrediction, setExistingPrediction] = useState<ExistingPrediction | null>(null);

  // Cargar datos de la sala y predicción existente
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Obtener detalles de la sala
        const roomResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${params.salaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roomData = await roomResponse.json();
        
        if (!roomResponse.ok) {
          throw new Error(roomData.message || "Error al cargar la sala");
        }
        
        setRoom(roomData.data);
        
        // Obtener predicción existente del jugador para esta sala
        const predResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${params.salaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const predData = await predResponse.json();
        
        if (predResponse.ok && predData.success && predData.data) {
          setExistingPrediction(predData.data);
          setGolesLocal(predData.data.score_home);
          setGolesVisitante(predData.data.score_away);
        }
        
      } catch (err: any) {
        console.error("Error cargando datos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.salaId, router]);

  const handleSubmit = async () => {
    if (!aceptarTerminos && !existingPrediction) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: params.salaId,
          score_home: golesLocal,
          score_away: golesVisitante,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Error al guardar la predicción");
      }
      
      // Redirigir al pago si es la primera vez, o al dashboard si ya había predicción
      if (!existingPrediction) {
        router.push(`/jugador/pago/${params.salaId}`);
      } else {
        router.push("/jugador/dashboard");
      }
      
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error || "Sala no encontrada"}</p>
          <Link href="/entrar" className="text-yellow-500 mt-4 inline-block">
            Volver a buscar salas
          </Link>
        </div>
      </main>
    );
  }

  const fechaPartido = new Date(room.match_date).toLocaleString();
  const cierreFecha = new Date(room.prediction_close_time).toLocaleString();
  const barName = room.bar?.bar_name || room.bar?.name || "Bar no especificado";
  const premioEstimado = room.total_pool;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/entrar" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
            <span className="text-xs text-gray-500">SALA: {room.id.substring(0, 6).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              {/* Info del partido - DATOS REALES */}
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="text-center">
                  <h2 className="text-xl font-light text-white">
                    {room.team_home} <span className="text-yellow-500">vs</span> {room.team_away}
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">{fechaPartido} | {barName}</p>
                  <p className="text-gray-600 text-xs mt-1">Cierre de predicciones: {cierreFecha}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Selector de marcador */}
                <div>
                  <label className="block text-xs text-yellow-500 tracking-wider text-center mb-4">
                    PREDECÍ EL MARCADOR
                  </label>
                  
                  <div className="flex items-center justify-between gap-4">
                    {/* Equipo Local */}
                    <div className="flex-1 text-center">
                      <div className="text-white text-sm font-medium mb-3">{room.team_home}</div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                          disabled={saving}
                        >
                          <Minus className="w-4 h-4 text-yellow-500" />
                        </button>
                        <span className="text-3xl font-light text-white w-12 text-center">{golesLocal}</span>
                        <button
                          onClick={() => setGolesLocal(golesLocal + 1)}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                          disabled={saving}
                        >
                          <Plus className="w-4 h-4 text-yellow-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-yellow-500 text-xl font-light">x</div>
                    
                    {/* Equipo Visitante */}
                    <div className="flex-1 text-center">
                      <div className="text-white text-sm font-medium mb-3">{room.team_away}</div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setGolesVisitante(Math.max(0, golesVisitante - 1))}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                          disabled={saving}
                        >
                          <Minus className="w-4 h-4 text-yellow-500" />
                        </button>
                        <span className="text-3xl font-light text-white w-12 text-center">{golesVisitante}</span>
                        <button
                          onClick={() => setGolesVisitante(golesVisitante + 1)}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                          disabled={saving}
                        >
                          <Plus className="w-4 h-4 text-yellow-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valor y resumen */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">Valor de la predicción:</span>
                    <span className="text-yellow-500 font-medium">R$ {room.entry_fee},00</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-yellow-500/20">
                    <span className="text-gray-400 text-sm">Tu premio si ganas:</span>
                    <span className="text-yellow-500 font-medium">R$ {premioEstimado},00</span>
                  </div>
                  <p className="text-gray-600 text-xs text-center mt-3">
                    *Si eres el único ganador
                  </p>
                </div>

                {/* Términos y condiciones (solo si es nueva predicción) */}
                {!existingPrediction && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceptarTerminos}
                      onChange={(e) => setAceptarTerminos(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30 rounded"
                    />
                    <span className="text-gray-500 text-xs">
                      Acepto los <span className="text-yellow-500">términos y condiciones</span> de JugadaPlay
                    </span>
                  </label>
                )}

                {/* Alerta */}
                <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-500 text-xs">
                    Las predicciones se cierran {new Date(room.prediction_close_time) < new Date() ? "cerradas" : `el ${cierreFecha}`}. 
                    {new Date(room.prediction_close_time) > new Date() ? " No podrás modificarla después de ese momento." : " Ya no puedes modificar tu predicción."}
                  </p>
                </div>

                {/* Botón confirmar */}
                <button
                  onClick={handleSubmit}
                  disabled={saving || (!existingPrediction && !aceptarTerminos) || new Date(room.prediction_close_time) < new Date()}
                  className={`group relative w-full py-3 rounded-lg font-medium tracking-wide transition-all overflow-hidden ${
                    (existingPrediction || aceptarTerminos) && !saving && new Date(room.prediction_close_time) > new Date()
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                      : "bg-gray-900 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {existingPrediction ? "ACTUALIZANDO..." : "GUARDANDO..."}
                      </>
                    ) : (
                      <>
                        {existingPrediction ? "ACTUALIZAR PREDICCIÓN" : "CONFIRMAR PREDICCIÓN"}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                  {(existingPrediction || aceptarTerminos) && !saving && new Date(room.prediction_close_time) > new Date() && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}