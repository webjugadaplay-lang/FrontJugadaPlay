// app/jugador/pago/[salaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Copy, Check, Clock, QrCode, CreditCard, Wallet } from "lucide-react";

export default function PagoPrediccion({ params }: { params: { salaId: string } }) {
  const [metodoPago, setMetodoPago] = useState<"pix" | "tarjeta" | "saldo">("pix");
  const [copied, setCopied] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(300); // 5 minutos en segundos

  const codigoPix = "00020126360014br.gov.bcb.pix0114723456789052020JugadaPlay52040000530398654045.005802BR5915JugadaPlay6009Sao Paulo62070503***6304E2C8";

  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(codigoPix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href={`/jugador/prediccion/${params.salaId}`} className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
            </Link>
            <span className="text-xs text-gray-500">PAGO SEGURO</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <h1 className="text-xl font-light tracking-tight text-white">
                  REALIZAR <span className="text-yellow-500 font-medium">PAGO</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Info de la predicción */}
                <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-xs">FLAMENGO vs VASCO</p>
                      <p className="text-white text-sm mt-1">Tu predicción: 2 x 1</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">TOTAL A PAGAR</p>
                      <p className="text-yellow-500 text-xl font-medium">R$ 5,00</p>
                    </div>
                  </div>
                </div>

                {/* Métodos de pago */}
                <div>
                  <label className="block text-xs text-yellow-500 tracking-wider mb-3">
                    FORMA DE PAGO
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMetodoPago("pix")}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        metodoPago === "pix"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-yellow-500" />
                        <span className="text-white text-sm">PIX</span>
                      </div>
                      {metodoPago === "pix" && <Check className="w-4 h-4 text-yellow-500" />}
                    </button>
                    
                    <button
                      onClick={() => setMetodoPago("tarjeta")}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        metodoPago === "tarjeta"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-yellow-500" />
                        <span className="text-white text-sm">Tarjeta de Crédito</span>
                      </div>
                      {metodoPago === "tarjeta" && <Check className="w-4 h-4 text-yellow-500" />}
                    </button>
                    
                    <button
                      onClick={() => setMetodoPago("saldo")}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        metodoPago === "saldo"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-yellow-500" />
                        <span className="text-white text-sm">Saldo JugadaPlay</span>
                      </div>
                      {metodoPago === "saldo" && <Check className="w-4 h-4 text-yellow-500" />}
                    </button>
                  </div>
                </div>

                {/* Código PIX (si está seleccionado) */}
                {metodoPago === "pix" && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs">CÓDIGO PIX COPIA Y COLA</span>
                      <button
                        onClick={handleCopyPix}
                        className="flex items-center gap-1 text-yellow-500 text-xs hover:text-yellow-400"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "COPIADO" : "COPIAR"}
                      </button>
                    </div>
                    <div className="bg-black rounded-lg p-3">
                      <code className="text-yellow-500 text-xs break-all font-mono">
                        {codigoPix.substring(0, 60)}...
                      </code>
                    </div>
                  </div>
                )}

                {/* Tiempo restante */}
                <div className="flex items-center justify-center gap-2 text-center">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-400 text-sm">Tiempo para pagar:</span>
                  <span className={`text-yellow-500 font-mono ${tiempoRestante < 60 ? "animate-pulse" : ""}`}>
                    {formatTiempo(tiempoRestante)}
                  </span>
                </div>

                {/* Botón confirmar pago */}
                <Link href={`/jugador/en-vivo/${params.salaId}`}>
                  <button className="group relative w-full overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all">
                    <span className="relative z-10">YA PAGUÉ, CONFIRMAR</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
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