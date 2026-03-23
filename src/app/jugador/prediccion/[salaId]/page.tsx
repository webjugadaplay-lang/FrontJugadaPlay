// app/jugador/prediccion/[salaId]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Trophy, Coins, AlertCircle, ChevronRight, Plus, Minus } from "lucide-react";

export default function PredecirMarcador({ params }: { params: { salaId: string } }) {
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);

  const valorPrediccion = 5;
  const pozoActual = 160;
  const premioEstimado = pozoActual;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/entrar" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
            </Link>
            <span className="text-xs text-gray-500">SALA: {params.salaId}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              {/* Info del partido */}
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="text-center">
                  <h2 className="text-xl font-light text-white">
                    FLAMENGO <span className="text-yellow-500">vs</span> VASCO
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">Hoy 20:30 | El Goloso FC</p>
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
                      <div className="text-white text-sm font-medium mb-3">FLAMENGO</div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                        >
                          <Minus className="w-4 h-4 text-yellow-500" />
                        </button>
                        <span className="text-3xl font-light text-white w-12 text-center">{golesLocal}</span>
                        <button
                          onClick={() => setGolesLocal(golesLocal + 1)}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                        >
                          <Plus className="w-4 h-4 text-yellow-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-yellow-500 text-xl font-light">x</div>
                    
                    {/* Equipo Visitante */}
                    <div className="flex-1 text-center">
                      <div className="text-white text-sm font-medium mb-3">VASCO</div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setGolesVisitante(Math.max(0, golesVisitante - 1))}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
                        >
                          <Minus className="w-4 h-4 text-yellow-500" />
                        </button>
                        <span className="text-3xl font-light text-white w-12 text-center">{golesVisitante}</span>
                        <button
                          onClick={() => setGolesVisitante(golesVisitante + 1)}
                          className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all"
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
                    <span className="text-yellow-500 font-medium">R$ {valorPrediccion},00</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-yellow-500/20">
                    <span className="text-gray-400 text-sm">Tu premio si ganas:</span>
                    <span className="text-yellow-500 font-medium">R$ {premioEstimado},00</span>
                  </div>
                  <p className="text-gray-600 text-xs text-center mt-3">
                    *Si eres el único ganador
                  </p>
                </div>

                {/* Términos y condiciones */}
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

                {/* Alerta */}
                <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-500 text-xs">
                    Las predicciones se cierran 15 minutos antes del partido. No podrás modificarla después.
                  </p>
                </div>

                {/* Botón confirmar */}
                <Link href={`/jugador/pago/${params.salaId}`}>
                  <button
                    disabled={!aceptarTerminos}
                    className={`group relative w-full py-3 rounded-lg font-medium tracking-wide transition-all overflow-hidden ${
                      aceptarTerminos
                        ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                        : "bg-gray-900 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      CONFIRMAR PREDICCIÓN
                      <ChevronRight className="w-4 h-4" />
                    </span>
                    {aceptarTerminos && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                    )}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}