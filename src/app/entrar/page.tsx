// app/entrar/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ScanLine, Crown, Sparkles, ChevronRight } from "lucide-react";

export default function EntrarSala() {
  const [codigoSala, setCodigoSala] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  return (
    <main className="min-h-screen bg-black">
      {/* Header minimalista */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <Crown className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span className="text-sm font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>

            {/* Link de ayuda minimalista */}
            <button className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
              ¿NECESITAS AYUDA?
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          
          {/* Tarjeta principal con efecto glass minimalista */}
          <div className="relative">
            {/* Efecto de brillo de fondo */}
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl animate-pulse"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              {/* Header de la tarjeta */}
              <div className="border-b border-yellow-500/20 px-8 pt-8 pb-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    ENTRAR A <span className="text-yellow-500 font-medium">SALA</span>
                  </h1>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-3"></div>
              </div>

              {/* Contenido */}
              <div className="p-8 space-y-8">
                
                {/* Instrucción minimalista */}
                <p className="text-gray-500 text-sm text-center font-light tracking-wide">
                  ESCANEA EL CÓDIGO QR DEL BAR
                </p>

                {/* Botón de escanear con efecto brillo */}
                <button 
                  className="group relative w-full py-12 rounded-xl border border-yellow-500/30 bg-black hover:border-yellow-500/60 transition-all duration-300 overflow-hidden"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {/* Efecto de brillo */}
                  <div className={`absolute inset-0 bg-yellow-500/5 transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <div className="relative flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-500/60 transition-all">
                      <ScanLine className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </div>
                    <span className="text-yellow-500 text-sm tracking-wide font-light group-hover:tracking-wider transition-all">
                      ESCANEAR QR
                    </span>
                  </div>
                </button>

                {/* Separador minimalista */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-yellow-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-4 text-gray-600 tracking-wider">O</span>
                  </div>
                </div>

                {/* Input manual */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-500 tracking-wider">
                    CÓDIGO DE LA SALA
                  </label>
                  <input
                    type="text"
                    value={codigoSala}
                    onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                    placeholder="EJ: FX27"
                    maxLength={6}
                    className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-center text-lg tracking-wider focus:outline-none focus:border-yellow-500/60 transition-all placeholder:text-gray-800"
                  />
                  <p className="text-gray-700 text-xs text-center">
                    Ingresa el código de 4-6 caracteres
                  </p>
                </div>

                {/* Botón de ingresar con efecto brillo */}
                <button 
                  className={`group relative w-full py-3 rounded-lg font-medium tracking-wide transition-all overflow-hidden ${
                    codigoSala.length >= 3
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                      : "bg-gray-900 text-gray-600 cursor-not-allowed"
                  }`}
                  disabled={codigoSala.length < 3}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    INGRESAR A LA SALA
                    <ChevronRight className="w-4 h-4" />
                  </span>
                  {codigoSala.length >= 3 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Link para volver minimalista */}
          <Link 
            href="/" 
            className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-sm hover:text-yellow-500 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide">VOLVER AL INICIO</span>
          </Link>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-yellow-500/10 py-4 px-6 bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-gray-700 text-xs tracking-wide">© 2026 JUGADAPLAY</p>
        </div>
      </footer>
    </main>
  );
}