"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";

export default function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const executedRef = useRef(false); // ✅ evita doble ejecución

  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Leer código de la URL (CORREGIDO)
  useEffect(() => {
    const codeFromUrl = searchParams?.get("code");

    if (codeFromUrl && !executedRef.current) {
      executedRef.current = true;

      const upperCode = codeFromUrl.toUpperCase();
      setCodigoSala(upperCode);
      procesarCodigo(upperCode);
    }
  }, [searchParams]);

  const procesarCodigo = async (codigo: string) => {
    if (!codigo || codigo.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      console.log("🔍 Enviando código al backend:", codigo);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${codigo}`
      );

      const data = await response.json();

      console.log("📦 Respuesta del backend:", data);

      if (!response.ok) {
        throw new Error(data.message || "Sala no encontrada");
      }

      // ✅ validación crítica
      if (!data.roomId) {
        throw new Error("No se pudo obtener el ID de la sala");
      }

      console.log("✅ Sala encontrada, roomId:", data.roomId);

      sessionStorage.setItem("currentRoomCode", codigo);
      sessionStorage.setItem("currentRoomId", data.roomId);

      if (!token || !userData) {
        console.log("❌ Usuario no logueado");
        router.push(`/login?code=${codigo}`);
        return;
      }

      const user = JSON.parse(userData);

      if (user.role !== "player") {
        setError("Solo los jugadores pueden unirse a las salas");
        setLoading(false);
        return;
      }

      console.log("✅ Redirigiendo con ID:", data.roomId);

      // ✅ protección extra
      router.push(`/jugador/prediccion/${data.roomId}`);

    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al ingresar a la sala");
      setLoading(false);
    }
  };

  const handleQRResult = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      setShowScanner(false);

      const scannedCode = result.toUpperCase();
      setCodigoSala(scannedCode);
      procesarCodigo(scannedCode);
    }
  };

  const handleScannerError = (err: unknown) => {
    console.error("Error escaneando QR:", err);
    setError("Error al acceder a la cámara.");
    setShowScanner(false);
  };

  const handleIngresar = () => {
    if (codigoSala.length >= 3) {
      procesarCodigo(codigoSala);
    } else {
      setError("El código debe tener al menos 3 caracteres");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="relative">
        <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl animate-pulse"></div>

        <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
          <div className="border-b border-yellow-500/20 px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl text-white">
                ENTRAR A <span className="text-yellow-500">SALA</span>
              </h1>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
          </div>

          <div className="p-8 space-y-6">

            <input
              type="text"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              placeholder="EJ: FX27"
              className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-center"
            />

            {error && (
              <div className="text-red-500 text-center text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleIngresar}
              disabled={loading}
              className="w-full py-3 bg-yellow-500 text-black rounded-lg"
            >
              {loading ? "INGRESANDO..." : "INGRESAR"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}