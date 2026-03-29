// app/jugador/prediccion/[salaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  AlertCircle,
  ChevronRight,
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

export default function PredecirMarcador({
  params,
}: {
  params: { salaId: string };
}) {
  const router = useRouter();

  const salaId = params?.salaId; // ✅ FIX CLAVE

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
      console.log("⛔ salaId no disponible aún");
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

        console.log("🚀 Cargando sala:", salaId);

        // ===== ROOM =====
        const roomResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${salaId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const roomData = await roomResponse.json();

        if (!roomResponse.ok) {
          throw new Error(roomData.message || "Error al cargar la sala");
        }

        setRoom(roomData.data);

        // ===== PREDICCIÓN =====
        const predResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${salaId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const predData = await predResponse.json();

        if (predResponse.ok && predData.success && predData.data) {
          setExistingPrediction(predData.data);
          setGolesLocal(predData.data.score_home);
          setGolesVisitante(predData.data.score_away);
        }
      } catch (err: any) {
        console.error("❌ Error cargando datos:", err);
        setError(err.message);
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
        throw new Error(data.message || "Error al guardar la predicción");
      }

      if (!existingPrediction) {
        router.push(`/jugador/pago/${salaId}`);
      } else {
        router.push("/jugador/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </main>
    );
  }

  // ===== ERROR =====
  if (error || !room) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center">
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
        <h2 className="text-white text-center">
          {room.team_home} vs {room.team_away}
        </h2>

        <div className="flex justify-center gap-4 text-white text-2xl">
          <button onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}>
            <Minus />
          </button>

          <span>{golesLocal}</span>

          <span>-</span>

          <span>{golesVisitante}</span>

          <button onClick={() => setGolesVisitante(golesVisitante + 1)}>
            <Plus />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-yellow-500 text-black py-2 rounded"
        >
          {saving ? "Guardando..." : "Confirmar"}
        </button>
      </div>
    </main>
  );
}