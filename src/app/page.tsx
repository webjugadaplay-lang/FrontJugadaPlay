"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { translations, type Locale } from "@/messages";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";

  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") {
    return savedLocale;
  }

  const browserLanguage =
    navigator.language || (navigator.languages && navigator.languages[0]) || "";

  const normalizedLanguage = browserLanguage.toLowerCase();

  if (normalizedLanguage.startsWith("es")) return "es";
  if (normalizedLanguage.startsWith("pt")) return "pt-BR";

  return "pt-BR";
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({
    baresActivos: 0,
    jugadores: 0,
    premios: 0,
    deportes: 10,
  });
  const [loading, setLoading] = useState(true);

  const t = translations[locale];

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stats`,
          { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Error en API");

        const data = await response.json();

        if (data?.success) {
          setStats({
            baresActivos: Number(data.data.baresActivos) || 0,
            jugadores: Number(data.data.jugadores) || 0,
            premios: Number(data.data.premios) || 0,
            deportes: Number(data.data.deportes) || 10,
          });
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);

        setStats({
          baresActivos: 0,
          jugadores: 0,
          premios: 0,
          deportes: 10,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formattedPrizes = loading
    ? "..."
    : stats.premios.toLocaleString(locale === "pt-BR" ? "pt-BR" : "es-CO");

  return (
    <main className="min-h-screen bg-black">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20 gap-4">
            <Link href="/" className="flex items-center">
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">
              <label
                htmlFor="locale-select"
                className="text-gray-400 text-xs md:text-sm tracking-wide"
              >
                {t.header.language}
              </label>
              <select
                id="locale-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <section className="relative min-h-[80vh] md:min-h-screen flex items-start md:items-center justify-center px-6 pt-28 md:pt-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/95"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <span className="text-yellow-500 text-xs md:text-sm tracking-[0.25em] uppercase font-light">
              {t.hero.badge}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 tracking-tight">
            <span className="text-white">{t.hero.title1}</span>
            <br />
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 blur-xl"></span>
              <span className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent font-medium">
                {t.hero.title2}
              </span>
            </span>
            <br />
            <span className="text-white">{t.hero.title3}</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bar/registro">
              <button className="group relative overflow-hidden bg-yellow-500 text-black px-8 py-3 rounded-sm text-base font-medium tracking-wide transition-all hover:bg-yellow-400 shadow-lg shadow-yellow-500/25">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t.hero.ctaBar}
                  <Star className="w-4 h-4" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
              </button>
            </Link>

            <Link href="/login">
              <button className="group relative overflow-hidden border border-yellow-500/50 text-yellow-500 px-8 py-3 rounded-sm text-base font-medium tracking-wide hover:border-yellow-500 hover:text-yellow-400 transition-all">
                <span className="relative z-10">{t.hero.ctaLogin}</span>
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </Link>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-[2px] h-12 bg-gradient-to-b from-yellow-500/50 to-transparent"></div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-20 px-6 border-t border-yellow-500/10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">
                {loading ? "..." : stats.baresActivos}
              </div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">
                {t.stats.activeBars}
              </div>
            </div>

            <div>
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">
                {loading ? "..." : stats.jugadores}
              </div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">
                {t.stats.players}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 text-center">
              <div className="text-3xl md:text-4xl font-light text-yellow-500 mb-1">
                {t.currencyPrefix}
                {formattedPrizes}
              </div>
              <div className="text-gray-600 text-xs tracking-wider uppercase">
                {t.stats.prizes}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-yellow-500/10 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-8 mb-6">
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">
              {t.footer.terms}
            </span>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">
              {t.footer.contact}
            </span>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">
              @JUGADAPLAY
            </span>
          </div>
          <p className="text-gray-700 text-xs tracking-wide">
            {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}