// app/bar/sala/[id]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Users, Coins, Trophy, Copy, Check, RefreshCw } from "lucide-react";

export default function SalaActiva({ params }: { params: { id: string } }) {
  const [copied, setCopied] = useState(false);
  const codigoSala = "FX27";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codigoSala);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jugadores = [
    { nombre: "João Pedro", prediccion: "2 x 1", estrellas: 3 },
    { nombre: "Maria Silva", prediccion: "1 x 0", estrellas: 2 },
    { nombre: "Carlos Andrade", prediccion: "2 x 0", estrellas: 1 },
    { nombre: "Ana Paula", prediccion: "1 x 1", estrellas: 0 },
    { nombre: "Roberto", prediccion: "0 x 2", estrellas: 0 },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
            </Link>
            <span className="text-sm text-yellow-500 tracking-wide">SALA: {codigoSala}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          
          {/* Info del partido */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              FLAMENGO <span className="text-yellow-500">vs</span> VASCO
            </h1>
            <p className="text-gray-500 text-sm mt-2">Hoy 20:30 | Cierre en 15 minutos</p>
          </div>

          {/* QR y código */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-32 h-32 bg-white/5 rounded-xl flex items-center justify-center border border-yellow-500/30">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-lg flex items-center justify-center">
                  <span className="text-yellow-500 text-xs">[QR]</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-gray-400 text-sm">Código:</span>
                  <span className="text-2xl font-mono text-yellow-500 tracking-wider">{codigoSala}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-yellow-500/10 rounded transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-yellow-500" />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">Escanea para participar - R$ 5,00 por predicción</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">R$ 160,00</div>
                <div className="text-xs text-gray-500">POZO ACTUAL</div>
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
                    JUGADORES <span className="text-yellow-500">({jugadores.length})</span>
                  </h3>
                  <RefreshCw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-yellow-500 transition-colors" />
                </div>
              </div>
              <div className="divide-y divide-yellow-500/10">
                {jugadores.map((j, idx) => (
                  <div key={idx} className="px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-500 text-sm font-mono">#{idx + 1}</span>
                      <span className="text-white text-sm">{j.nombre}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-yellow-500 font-mono text-sm">{j.prediccion}</span>
                      <div className="flex gap-0.5">
                        {[...Array(j.estrellas)].map((_, i) => (
                          <Trophy key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del pozo */}
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-white font-light tracking-wide mb-4">RESUMEN</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total jugadores:</span>
                  <span className="text-white">{jugadores.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total recaudado:</span>
                  <span className="text-white">R$ 160,00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                  <span className="text-gray-500">Ganador único lleva:</span>
                  <span className="text-yellow-500">R$ 112,00</span>
                </div>
              </div>
              <button className="w-full mt-6 border border-yellow-500/30 text-yellow-500 py-2 text-sm rounded-lg hover:border-yellow-500/50 transition-all">
                CERRAR PREDICCIONES
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}