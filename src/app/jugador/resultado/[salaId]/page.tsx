// app/jugador/resultado/[salaId]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Trophy, Coins, Share2, Repeat, Award, CheckCircle, PartyPopper } from "lucide-react";

export default function ResultadoFinal({ params }: { params: { salaId: string } }) {
  const [ganador] = useState(true); // Simular que el usuario ganó
  const premio = 56;
  const resultadoReal = "2 x 1";
  const prediccionUsuario = "2 x 1";

  return (
    <main className="min-h-screen bg-black">
      {/* Contenido principal */}
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            {/* Efecto de celebración */}
            <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-2xl animate-pulse"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden text-center">
              
              {/* Icono de celebración */}
              <div className="pt-8 pb-4">
                {ganador ? (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                    <PartyPopper className="w-10 h-10 text-yellow-500" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 border border-gray-700">
                    <Trophy className="w-10 h-10 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Mensaje de resultado */}
              <div className="px-6 pb-4">
                {ganador ? (
                  <>
                    <h1 className="text-3xl font-light text-white mb-2">
                      ¡FELICIDADES!
                    </h1>
                    <p className="text-yellow-500 text-lg font-medium">ERES UN GANADOR</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-light text-white mb-2">
                      ¡TERMINÓ!
                    </h1>
                    <p className="text-gray-500">Sigue participando</p>
                  </>
                )}
              </div>

              {/* Resultado del partido */}
              <div className="bg-yellow-500/5 border-t border-b border-yellow-500/20 py-6">
                <p className="text-gray-400 text-sm mb-2">RESULTADO FINAL</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-white text-lg">FLAMENGO</span>
                  <span className="text-2xl font-bold text-yellow-500">{resultadoReal.split(" x ")[0]}</span>
                  <span className="text-xl text-gray-500">-</span>
                  <span className="text-2xl font-bold text-yellow-500">{resultadoReal.split(" x ")[1]}</span>
                  <span className="text-white text-lg">VASCO</span>
                </div>
                {ganador && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-xs">Acertaste {prediccionUsuario}</span>
                  </div>
                )}
              </div>

              {/* Premio */}
              {ganador && (
                <div className="py-6 px-6">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">TU PREMIO</p>
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-6 h-6 text-yellow-500" />
                      <span className="text-4xl font-bold text-yellow-500">R$ {premio},00</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ganadores */}
              <div className="border-t border-yellow-500/20 px-6 py-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <p className="text-gray-400 text-sm">GANADORES</p>
                </div>
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span className="text-white text-sm">TÚ</span>
                    <span className="text-yellow-500 text-xs">(2 x 1)</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-500 text-sm">João Pedro</span>
                    <span className="text-gray-600 text-xs">(2 x 1)</span>
                  </div>
                </div>
                <p className="text-gray-600 text-xs text-center mt-3">
                  Premio total R$ 112,00 • 2 ganadores
                </p>
              </div>

              {/* Botones de acción */}
              <div className="p-6 pt-0 space-y-3">
                {ganador && (
                  <button className="group relative w-full overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Coins className="w-4 h-4" />
                      RECIBIR PREMIO (PIX)
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  </button>
                )}
                
                <div className="flex gap-3">
                  <button className="flex-1 border border-yellow-500/30 text-yellow-500 py-2 rounded-lg text-sm hover:border-yellow-500/50 transition-all flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    COMPARTIR
                  </button>
                  <Link href="/entrar" className="flex-1">
                    <button className="w-full border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:border-yellow-500/30 hover:text-yellow-500 transition-all flex items-center justify-center gap-2">
                      <Repeat className="w-4 h-4" />
                      VOLVER A JUGAR
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}