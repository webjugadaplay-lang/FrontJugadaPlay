// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Crown, Sparkles, Star, Zap } from "lucide-react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efecto para el header al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-black">
      {/* Header Minimalista con efecto glass */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo Minimalista */}
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
              <span className="text-xl font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-gray-400 hover:text-yellow-500 transition-colors text-sm tracking-wide">
                INICIAR SESIÓN
              </button>
              <button className="relative overflow-hidden bg-yellow-500 text-black px-6 py-2 text-sm font-medium tracking-wide rounded-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 group">
                <span className="relative z-10">REGISTRAR BAR</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
            </div>

            {/* Botón menú móvil */}
            <button
              className="md:hidden text-yellow-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menú Móvil */}
          {isMenuOpen && (
            <div className="md:hidden py-6 border-t border-yellow-500/20">
              <div className="flex flex-col space-y-4">
                <button className="text-gray-400 hover:text-yellow-500 py-2 transition-colors text-sm tracking-wide">
                  INICIAR SESIÓN
                </button>
                <button className="bg-yellow-500 text-black px-4 py-2 text-sm font-medium tracking-wide rounded-sm hover:bg-yellow-400 transition-all text-center">
                  REGISTRAR BAR
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Minimalista con brillo */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Efecto de brillo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/95"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Contenido */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge con brillo */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full"></div>
              <div className="relative bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-full px-4 py-1.5">
                <Sparkles className="w-3 h-3 text-yellow-500 inline mr-2" />
                <span className="text-yellow-500 text-xs tracking-wider">PREMIUM SPORTS PREDICTION</span>
              </div>
            </div>
          </div>

          {/* Título con brillo dorado */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 tracking-tight">
            <span className="text-white">LA EMOCIÓN DEL</span>
            <br />
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 blur-xl"></span>
              <span className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent font-medium">
                DEPORTE
              </span>
            </span>
            <br />
            <span className="text-white">EN TU BAR</span>
          </h1>

          {/* Descripción */}
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Predice marcadores. Gana dinero real. La experiencia premium 
            que transforma tu bar en un casino deportivo.
          </p>

          {/* Botones con efecto brillo */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative overflow-hidden bg-yellow-500 text-black px-8 py-3 rounded-sm text-base font-medium tracking-wide transition-all hover:bg-yellow-400 shadow-lg shadow-yellow-500/25">
              <span className="relative z-10 flex items-center justify-center gap-2">
                QUIERO PARA MI BAR
                <Star className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
            </button>
            
            <Link href="/entrar">
              <button className="group relative overflow-hidden border border-yellow-500/50 text-yellow-500 px-8 py-3 rounded-sm text-base font-medium tracking-wide hover:border-yellow-500 hover:text-yellow-400 transition-all">
                <span className="relative z-10">QUIERO JUGAR</span>
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </Link>
          </div>

          {/* Indicador de scroll minimalista */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-[2px] h-12 bg-gradient-to-b from-yellow-500/50 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Sección de Beneficios - Minimalista */}
      <section className="py-24 px-6 bg-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="w-12 h-[1px] bg-yellow-500/50 mx-auto"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              <span className="text-white">¿POR QUÉ </span>
              <span className="text-yellow-500 font-medium">JUGADAPLAY</span>
              <span className="text-white">?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Beneficio 1 */}
            <div className="group text-center">
              <div className="relative mb-6 flex justify-center">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center bg-black group-hover:border-yellow-500/60 transition-all">
                  <Crown className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-white text-lg font-medium mb-2 tracking-wide">PREMIOS REALES</h3>
              <p className="text-gray-500 text-sm font-light leading-relaxed">
                Los jugadores compiten por dinero en efectivo. La emoción del casino con la pasión del deporte.
              </p>
            </div>

            {/* Beneficio 2 */}
            <div className="group text-center">
              <div className="relative mb-6 flex justify-center">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center bg-black group-hover:border-yellow-500/60 transition-all">
                  <Zap className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-white text-lg font-medium mb-2 tracking-wide">+30% CONSUMO</h3>
              <p className="text-gray-500 text-sm font-light leading-relaxed">
                Los bares aumentan sus ventas mientras los clientes disfrutan del juego.
              </p>
            </div>

            {/* Beneficio 3 */}
            <div className="group text-center">
              <div className="relative mb-6 flex justify-center">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center bg-black group-hover:border-yellow-500/60 transition-all">
                  <Star className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-white text-lg font-medium mb-2 tracking-wide">TODOS LOS DEPORTES</h3>
              <p className="text-gray-500 text-sm font-light leading-relaxed">
                Fútbol, baloncesto, tenis, MMA y más. Siempre hay un partido para predecir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas - Minimalista con líneas doradas */}
      <section className="py-20 px-6 border-t border-yellow-500/10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">150+</div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">Bares Activos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">15k+</div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">Jugadores</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">R$45k+</div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">Premios</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">10+</div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">Deportes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-yellow-500/10 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-8 mb-6">
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">TÉRMINOS</span>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">CONTACTO</span>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">@JUGADAPLAY</span>
          </div>
          <p className="text-gray-700 text-xs tracking-wide">© 2026 JUGADAPLAY. TODOS LOS DERECHOS RESERVADOS.</p>
        </div>
      </footer>
    </main>
  );
}