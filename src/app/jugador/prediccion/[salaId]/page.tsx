"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [existingPrediction, setExistingPrediction] =
    useState<ExistingPrediction | null>(null);

  useEffect(() => {
    if (!salaId) {
      setError("ID de sala inválido");
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

        const roomUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${salaId}`;
        const roomResponse = await safeFetchJson(roomUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRoom(roomResponse.data);

        try {
          const predUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${salaId}`;
          const predResponse = await fetch(predUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const predText = await predResponse.text();
          const predContentType =
            predResponse.headers.get("content-type") || "";

          if (predResponse.ok && predContentType.includes("application/json")) {
            const predData = JSON.parse(predText);

            if (predData?.success && predData?.data) {
              setExistingPrediction(predData.data);
              setGolesLocal(Number(predData.data.score_home) || 0);
              setGolesVisitante(Number(predData.data.score_away) || 0);
            }
          }
        } catch {
          console.log("Sin predicción previa");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar la sala");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [salaId, router]);

  const handleSubmit = async () => {
    if (!salaId) {
      setError("No se encontró el ID de la sala");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <Link href="/entrar" className="text-yellow-500">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-500">Sala no encontrada</p>
      </main>
    );
  }

  const fechaPartido = new Date(room.match_date).toLocaleString();

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 bg-black p-4 border-b border-yellow-500/20">
        <Link href="/entrar" className="flex items-center gap-2 text-white">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </header>

      <div className="pt-24 max-w-md mx-auto p-4 space-y-8">
        {/* GRID CON VS */}
        <div className="grid grid-cols-3 gap-4 items-center">
          
          {/* LOCAL */}
          <div className="text-center space-y-4">
            <h2 className="text-white text-xl">{room.team_home}</h2>
            <div className="flex justify-center gap-3 text-white text-2xl">
              <button onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}>
                <Minus />
              </button>
              <span>{golesLocal}</span>
              <button onClick={() => setGolesLocal(golesLocal + 1)}>
                <Plus />
              </button>
            </div>
          </div>

          {/* VS */}
          <div className="text-center text-yellow-500 text-2xl font-bold">
            VS
          </div>

          {/* VISITANTE */}
          <div className="text-center space-y-4">
            <h2 className="text-white text-xl">{room.team_away}</h2>
            <div className="flex justify-center gap-3 text-white text-2xl">
              <button
                onClick={() =>
                  setGolesVisitante(Math.max(0, golesVisitante - 1))
                }
              >
                <Minus />
              </button>
              <span>{golesVisitante}</span>
              <button onClick={() => setGolesVisitante(golesVisitante + 1)}>
                <Plus />
              </button>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="text-center text-gray-400 text-sm">
          <p>{fechaPartido}</p>
          <p>{room.bar?.bar_name || room.bar?.name}</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-yellow-500 text-black py-3 rounded"
        >
          {saving ? "Guardando..." : "Confirmar"}
        </button>
      </div>
    </main>
  );
}