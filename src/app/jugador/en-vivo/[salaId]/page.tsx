// app/jugador/en-vivo/[salaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Trophy, Users, Target, TrendingUp, Clock } from "lucide-react";

export default function EnVivo({ params }: { params: { salaId: string } }) {
  const [minuto, setMinuto] = useState(25);
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);

  const prediccionUsuario = "2 x 1";
  const posicionActual = 5;
  const totalJugadores = 32;
  const pozoActual = 160;

  const ranking = [
    { nombre: "João Pedro", prediccion: "2 x 1", acierto: "⚽⚽" },
    { nombre: "Maria Silva", prediccion: "1 x 0", acierto: "⚽" },
    { nombre: "Carlos Andrade", prediccion: "2 x 0", acierto: "" },
    { nombre: "Ana Paula", prediccion: "1 x 1", acierto: "" },
    { nombre: "TÚ", prediccion: "2 x 1", acierto: "", esUsuario: true },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMinuto((prev) => (prev < 90 ? prev + 1 : prev));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-white text-sm">JUGADA<span className="text-yellow-500">PLAY</span></span>
            </div>
            <span className="text-xs text-yellow-500">EN VIVO</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          
          {/* Marcador en vivo */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-2xl p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="text-2xl font-light text-white">FLAMENGO</span>
              <span className="text-3xl font-bold text-yellow-500">{golesLocal}</span>
              <span className="text-2xl text-gray-500">-</span>
              <span className="text-3xl font-bold text-yellow-500">{golesVisitante}</span>
              <span className="text-2xl font-light text-white">VASCO</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">{minuto}' • 1° tiempo</span>
            </div>
          </div>

          {/* Tu predicción */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-xs tracking-wide">TU PREDICCIÓN</p>
                <p className="text-3xl font-light text-yellow-500">{prediccionUsuario}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">POSICIÓN ACTUAL</p>
                <p className="text-2xl font-light text-white">{posicionActual}° <span className="text-sm text-gray-500">de {totalJugadores}</span></p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">PREMIO POTENCIAL</p>
                <p className="text-xl font-medium text-yellow-500">R$ {pozoActual},00</p>
              </div>
            </div>
          </div>

          {/* Escenarios */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              POSIBLES GANADORES
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Si termina 2 x 1:</span>
                <span className="text-yellow-500">TÚ (R$ {pozoActual},00)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Si termina 1 x 0:</span>
                <span className="text-white">3 jugadores (R$ 37,33 c/u)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Si termina 2 x 0:</span>
                <span className="text-white">1 jugador (R$ {pozoActual},00)</span>
              </div>
            </div>
          </div>

          {/* Ranking en vivo */}
          <div className="bg-black/30 border border-yellow-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-yellow-500/20 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-sm font-light tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                RANKING EN VIVO
              </h3>
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="divide-y divide-yellow-500/10">
              {ranking.map((item, idx) => (
                <div
                  key={idx}
                  className={`px-6 py-3 flex justify-between items-center ${
                    item.esUsuario ? "bg-yellow-500/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono w-8 ${idx === 0 ? "text-yellow-500" : "text-gray-500"}`}>
                      {idx + 1}°
                    </span>
                    <span className={`text-sm ${item.esUsuario ? "text-yellow-500" : "text-white"}`}>
                      {item.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-mono">{item.prediccion}</span>
                    <span className="text-yellow-500 text-sm">{item.acierto}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-yellow-500/20 px-6 py-4">
              <button className="w-full text-center text-yellow-500 text-sm hover:text-yellow-400 transition-colors">
                VER RANKING COMPLETO
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}