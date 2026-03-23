// app/bar/crear-sala/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Trophy, Coins, Calendar, Clock, Zap } from "lucide-react";

export default function CrearSala() {
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [fechaPartido, setFechaPartido] = useState("");
  const [horaPartido, setHoraPartido] = useState("");
  const [cierrePredictions, setCierrePredictions] = useState("15min");

  const calcularPozo = () => {
    const valor = parseFloat(valorPrediccion) || 0;
    const estimadoJugadores = 50;
    const total = valor * estimadoJugadores;
    return {
      total: total.toFixed(2),
      premios: (total * 0.7).toFixed(2),
      bar: (total * 0.2).toFixed(2),
      plataforma: (total * 0.1).toFixed(2),
    };
  };

  const pozo = calcularPozo();

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          
          {/* Tarjeta principal */}
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              <div className="border-b border-yellow-500/20 px-8 pt-8 pb-4">
                <h1 className="text-2xl font-light tracking-tight text-white">
                  CREAR <span className="text-yellow-500 font-medium">SALA</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
              </div>

              <div className="p-8 space-y-8">
                {/* Selección de partido */}
                <div className="space-y-3">
                  <label className="block text-xs text-yellow-500 tracking-wider">PARTIDO</label>
                  <select className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60">
                    <option>Flamengo vs Vasco - Brasileirão Série A</option>
                    <option>Corinthians vs Palmeiras - Brasileirão Série A</option>
                    <option>Brasil vs Argentina - Eliminatorias</option>
                  </select>
                </div>

                {/* Fecha y hora */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-xs text-yellow-500 tracking-wider">FECHA</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="date"
                        value={fechaPartido}
                        onChange={(e) => setFechaPartido(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs text-yellow-500 tracking-wider">HORA</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="time"
                        value={horaPartido}
                        onChange={(e) => setHoraPartido(e.target.value)}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Cierre de predicciones */}
                <div className="space-y-3">
                  <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="cierre"
                        value="inicio"
                        checked={cierrePredictions === "inicio"}
                        onChange={() => setCierrePredictions("inicio")}
                        className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                      />
                      <span className="text-gray-400 text-sm">Al inicio del partido</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="cierre"
                        value="15min"
                        checked={cierrePredictions === "15min"}
                        onChange={() => setCierrePredictions("15min")}
                        className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                      />
                      <span className="text-gray-400 text-sm">15 minutos antes (recomendado)</span>
                    </label>
                  </div>
                </div>

                {/* Tipo de sala */}
                <div className="space-y-3">
                  <label className="block text-xs text-yellow-500 tracking-wider">TIPO DE SALA</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setTipoSala("practice")}
                      className={`p-4 rounded-lg border transition-all ${
                        tipoSala === "practice"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-white font-medium mb-1">Modo Práctica</div>
                        <div className="text-gray-500 text-xs">Sin dinero real</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setTipoSala("paid")}
                      className={`p-4 rounded-lg border transition-all ${
                        tipoSala === "paid"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-white font-medium mb-1">Modo Pago</div>
                        <div className="text-gray-500 text-xs">Premios reales</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Valor de predicción (solo modo pago) */}
                {tipoSala === "paid" && (
                  <div className="space-y-3">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      VALOR POR PREDICCIÓN (R$)
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="number"
                        value={valorPrediccion}
                        onChange={(e) => setValorPrediccion(e.target.value)}
                        min="1"
                        max="50"
                        step="1"
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                    <p className="text-gray-600 text-xs">Recomendado: R$ 2 a R$ 10</p>
                  </div>
                )}

                {/* Resumen del pozo */}
                {tipoSala === "paid" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-white text-sm font-medium tracking-wide">RESUMEN ESTIMADO (50 jugadores)</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total recaudado:</span>
                        <span className="text-white">R$ {pozo.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Premios (70%):</span>
                        <span className="text-yellow-500">R$ {pozo.premios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tu comisión (20%):</span>
                        <span className="text-green-500">R$ {pozo.bar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plataforma (10%):</span>
                        <span className="text-gray-500">R$ {pozo.plataforma}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-4 pt-4">
                  <Link href="/bar/dashboard" className="flex-1">
                    <button className="w-full border border-yellow-500/30 text-gray-400 py-3 rounded-lg text-sm tracking-wide hover:border-yellow-500/50 transition-all">
                      CANCELAR
                    </button>
                  </Link>
                  <button className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all">
                    <span className="relative z-10">CREAR SALA</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}