//jugador/prediccion/[salaId]
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle
} from "lucide-react";
import { translations, type Locale } from "@/messages";

interface Room {
  id: string;
  name: string;
  team_home: string;
  team_away: string;
  match_date: string;
  prediction_close_time: string;
  entry_fee: number | string;
  total_pool: number | string;
  status: string;
  room_code?: string;
  bar: {
    id?: string;
    name: string;
    bar_name: string;
  };
}

interface Prediction {
  id: string;
  score_home: number;
  score_away: number;
  paid: boolean;
  created_at: string;
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") return savedLocale;
  const browserLanguage = navigator.language || "";
  if (browserLanguage.toLowerCase().startsWith("es")) return "es";
  if (browserLanguage.toLowerCase().startsWith("pt")) return "pt-BR";
  return "pt-BR";
}

export default function PredecirMarcador() {
  const router = useRouter();
  const params = useParams<{ salaId: string }>();
  const salaId = params?.salaId;

  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [scrolled, setScrolled] = useState(false);

  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [existingPredictions, setExistingPredictions] = useState<Prediction[]>([]);
  const [lastPrediction, setLastPrediction] = useState<Prediction | null>(null);

  const t = translations[locale];

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
  }, []);

  useEffect(() => {
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Función para cargar las predicciones existentes
  const fetchExistingPredictions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/predictions/${salaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.success && data.data) {
        console.log(`📦 Encontradas ${data.data.length} predicciones previas`);
        setExistingPredictions(data.data);
        
        // Obtener la predicción más reciente
        if (data.data.length > 0) {
          const mostRecent = data.data[0]; // Ya vienen ordenadas por createdAt DESC
          setLastPrediction(mostRecent);
          setGolesLocal(mostRecent.score_home);
          setGolesVisitante(mostRecent.score_away);
        } else {
          setLastPrediction(null);
          setGolesLocal(0);
          setGolesVisitante(0);
        }
      } else {
        console.log("No hay predicciones previas para esta sala");
        setExistingPredictions([]);
        setLastPrediction(null);
        setGolesLocal(0);
        setGolesVisitante(0);
      }
    } catch (error) {
      console.error("Error al buscar predicciones:", error);
      setExistingPredictions([]);
      setLastPrediction(null);
    }
  };

  useEffect(() => {
    if (!salaId) {
      setError(t.prediction.invalidId);
      setLoading(false);
      return;
    }

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

        // Cargar datos de la sala
        const roomUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${salaId}`;
        const roomResponse = await fetch(roomUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const roomData = await roomResponse.json();

        if (!roomResponse.ok || !roomData.success) {
          throw new Error(roomData.message || t.prediction.notFound);
        }

        setRoom(roomData.data);

        // Cargar predicciones existentes
        await fetchExistingPredictions();

      } catch (err: any) {
        console.error(err);
        setError(err.message || t.prediction.error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [salaId, router, t]);

  const handleSubmit = async () => {
    if (!salaId) {
      setError(t.prediction.invalidId);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            room_id: salaId,
            score_home: golesLocal,
            score_away: golesVisitante,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar");
      }

      // Recargar las predicciones para mostrar la nueva
      await fetchExistingPredictions();

      // Si es la primera predicción (no había ninguna antes), redirigir a pago
      if (existingPredictions.length === 0) {
        router.push(`/jugador/pago/${salaId}`);
      } else {
        // Si ya tenía predicciones, mostrar mensaje de éxito y quedarse
        alert("¡Predicción guardada exitosamente!");
        setSaving(false);
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
      <main className="min-h-screen bg-black">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20" : "bg-transparent"}`}>
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20 gap-4">
              <Link href="/entrar" className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm hidden md:inline">{t.prediction.back}</span>
              </Link>
              <Link href="/" className="flex items-center">
                <img src="/logo-jugadaplay.svg" alt="Jugada Play" className="h-10 md:h-12 object-contain" />
              </Link>
              <div className="w-20"></div>
            </div>
          </div>
        </header>
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || t.prediction.notFound}</p>
            <Link href="/entrar" className="text-yellow-500 hover:text-yellow-400 transition-colors">
              {t.prediction.back}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fechaPartido = new Date(room.match_date).toLocaleString(locale === "pt-BR" ? "pt-BR" : "es-CO");
  const isMatchClosed = new Date(room.prediction_close_time) < new Date();
  const isMatchFinished = room.status === "finished" || room.status === "closed";

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20" : "bg-transparent"}`}>
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

      {/* Contenido principal */}
      <div className="pt-28 pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">

          {/* Título de la sección */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              {t.prediction.title}{" "}
              <span className="text-yellow-500 font-medium">{t.prediction.subtitle}</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mx-auto mt-3"></div>
          </div>

          {/* Mostrar contador de predicciones */}
          {existingPredictions.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
              <p className="text-yellow-500 text-sm">
                Ya has hecho {existingPredictions.length} predicción{existingPredictions.length !== 1 ? 'es' : ''} para este partido.
                {existingPredictions.length === 1 ? ' Esta es tu primera predicción.' : ' ¡Puedes hacer otra!'}
              </p>
            </div>
          )}

          {/* Tarjeta del partido */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-6 md:p-8 mb-8">
            {/* Equipos y marcador */}
            <div className="grid grid-cols-3 gap-4 items-center mb-8">
              {/* Local */}
              <div className="text-center">
                <h2 className="text-white text-xl md:text-2xl font-medium mb-4">{room.team_home}</h2>
                <div className="flex justify-center items-center gap-4 text-white">
                  <button
                    onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5 text-yellow-500" />
                  </button>
                  <span className="text-5xl md:text-6xl font-bold text-white w-20 text-center">{golesLocal}</span>
                  <button
                    onClick={() => setGolesLocal(golesLocal + 1)}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 text-yellow-500" />
                  </button>
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-yellow-500/30 flex items-center justify-center mx-auto">
                  <span className="text-yellow-500 text-xl font-bold">{t.prediction.vs}</span>
                </div>
              </div>

              {/* Visitante */}
              <div className="text-center">
                <h2 className="text-white text-xl md:text-2xl font-medium mb-4">{room.team_away}</h2>
                <div className="flex justify-center items-center gap-4 text-white">
                  <button
                    onClick={() => setGolesVisitante(Math.max(0, golesVisitante - 1))}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5 text-yellow-500" />
                  </button>
                  <span className="text-5xl md:text-6xl font-bold text-white w-20 text-center">{golesVisitante}</span>
                  <button
                    onClick={() => setGolesVisitante(golesVisitante + 1)}
                    disabled={isMatchClosed || isMatchFinished}
                    className="w-10 h-10 rounded-full border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 text-yellow-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Información del partido */}
            <div className="border-t border-yellow-500/20 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{fechaPartido}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {t.prediction.prizePool}: R$ {Number(room.total_pool).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {t.prediction.entryFee}: R$ {Number(room.entry_fee).toFixed(2)}
                  </span>
                </div>
              </div>
              {room.bar?.bar_name && (
                <div className="text-center mt-4 text-gray-500 text-sm">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {room.bar.bar_name}
                </div>
              )}
            </div>

            {/* Advertencias */}
            {(isMatchClosed || isMatchFinished) && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {isMatchFinished ? t.prediction.matchFinished : t.prediction.matchClosed}
                </p>
              </div>
            )}

            {lastPrediction && lastPrediction.paid && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Última predicción pagada: {lastPrediction.score_home} x {lastPrediction.score_away}
                </p>
              </div>
            )}
          </div>

          {/* Botón de confirmación */}
          <button
            onClick={handleSubmit}
            disabled={saving || isMatchClosed || isMatchFinished}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/25"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.prediction.saving}
              </span>
            ) : (
              existingPredictions.length === 0 ? "Guardar y Continuar al Pago" : "Guardar Nueva Predicción"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}