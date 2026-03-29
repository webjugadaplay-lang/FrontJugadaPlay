"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  team_home: string;
  team_away: string;
  match_date: string;
  prediction_close_time: string;
  entry_fee: number;
  total_pool: number;
  status: string;
  bar: {
    name: string;
    bar_name: string;
  };
}

interface ExistingPrediction {
  id: string;
  score_home: number;
  score_away: number;
}

async function safeFetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  console.log("FETCH URL:", url);
  console.log("FETCH STATUS:", response.status);
  console.log("FETCH CONTENT-TYPE:", contentType);
  console.log("FETCH RAW:", text);

  if (!contentType.includes("application/json")) {
    throw new Error(`El endpoint no devolvió JSON: ${url}`);
  }

  const data = JSON.parse(text);

  if (!response.ok) {
    throw new Error(data.message || "Error en la petición");
  }

  return data;
}

export default function PredecirMarcador() {
  const router = useRouter();
  const params = useParams<{ salaId: string }>();
  const salaId = params?.salaId;

  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [existingPrediction, setExistingPrediction] =
    useState<ExistingPrediction | null>(null);

  useEffect(() => {
    if (!salaId) {
      console.log("⛔ salaId no disponible");
      setError("ID de sala inválido");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        console.log("🧪 salaId:", salaId);
        console.log("🧪 API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("🧪 token existe:", !!token);
        console.log("🧪 token valor:", token);

        if (!token || !userData) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userData);

        if (user.role !== "player") {
          router.push("/login");
          return;
        }

        // ===== ROOM =====
        const roomUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${salaId}`;
        console.log("🌐 ROOM URL:", roomUrl);

        const roomData = await safeFetchJson(roomUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRoom(roomData.data);

        // ===== PREDICTION =====
        const predUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${salaId}`;
        console.log("🌐 PRED URL:", predUrl);

        const predData = await safeFetchJson(predUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (predData.success && predData.data) {
          setExistingPrediction(predData.data);
          setGolesLocal(predData.data.score_home);
          setGolesVisitante(predData.data.score_away);
          setAceptarTerminos(true);
        }
      } catch (err: any) {
        console.error("❌ Error cargando datos:", err);
        setError(err.message || "Error al cargar la sala");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [salaId, router]);

  const handleSubmit = async () => {
    if (!aceptarTerminos && !existingPrediction) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    if (!salaId) {
      setError("No se encontró el ID de la sala");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Sesión no válida");
      }

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
        throw new Error(data.message || "Error al guardar la predicción");
      }

      if (!existingPrediction) {
        router.push(`/jugador/pago/${salaId}`);
      } else {
        router.push("/jugador/dashboard");
      }
    } catch (err: any) {
      console.error("❌ Error guardando predicción:", err);
      setError(err.message || "Error al guardar la predicción");
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
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center px-4">
          <p>{error || "Sala no encontrada"}</p>
          <Link href="/entrar" className="text-yellow-500 mt-4 inline-block">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const fechaPartido = new Date(room.match_date).toLocaleString();
  const cierreFecha = new Date(room.prediction_close_time).toLocaleString();
  const premioEstimado = room.total_pool;

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 bg-black border-b border-yellow-500/20 p-4">
        <Link href="/entrar" className="flex items-center gap-2 text-white">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </header>

      <div className="pt-24 max-w-md mx-auto p-4 space-y-6">
        <h2 className="text-white text-center text-xl">
          {room.team_home} vs {room.team_away}
        </h2>

        <div className="text-center text-gray-400 text-sm space-y-1">
          <p>{fechaPartido}</p>
          <p>Cierre: {cierreFecha}</p>
          <p>Premio estimado: {premioEstimado}</p>
          <p>Bar: {room.bar?.bar_name || room.bar?.name}</p>
        </div>

        <div className="flex justify-center items-center gap-6 text-white text-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
              className="p-2 border border-yellow-500/30 rounded"
              type="button"
            >
              <Minus />
            </button>
            <span>{golesLocal}</span>
            <button
              onClick={() => setGolesLocal(golesLocal + 1)}
              className="p-2 border border-yellow-500/30 rounded"
              type="button"
            >
              <Plus />
            </button>
          </div>

          <span>-</span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setGolesVisitante(Math.max(0, golesVisitante - 1))}
              className="p-2 border border-yellow-500/30 rounded"
              type="button"
            >
              <Minus />
            </button>
            <span>{golesVisitante}</span>
            <button
              onClick={() => setGolesVisitante(golesVisitante + 1)}
              className="p-2 border border-yellow-500/30 rounded"
              type="button"
            >
              <Plus />
            </button>
          </div>
        </div>

        {!existingPrediction && (
          <label className="flex items-center gap-2 text-white text-sm">
            <input
              type="checkbox"
              checked={aceptarTerminos}
              onChange={(e) => setAceptarTerminos(e.target.checked)}
            />
            Acepto los términos y condiciones
          </label>
        )}

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-yellow-500 text-black py-3 rounded flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving
            ? "Guardando..."
            : existingPrediction
            ? "Actualizar predicción"
            : "Confirmar"}
        </button>
      </div>
    </main>
  );
}