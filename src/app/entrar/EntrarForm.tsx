"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Sparkles, Loader2 } from "lucide-react";

export default function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const executedRef = useRef(false);

  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams?.get("code");

    if (codeFromUrl && !executedRef.current) {
      executedRef.current = true;

      const upperCode = codeFromUrl.trim().toUpperCase();
      setCodigoSala(upperCode);
      procesarCodigo(upperCode);
    }
  }, [searchParams]);

  const procesarCodigo = async (codigo: string) => {
    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio || codigoLimpio.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      console.log("🔍 Enviando código al backend:", codigoLimpio);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${encodeURIComponent(codigoLimpio)}`
      );

      const data = await response.json();

      console.log("📦 Respuesta del backend:", data);

      if (!response.ok) {
        throw new Error(data.message || "Sala no encontrada");
      }

      if (!data.roomId) {
        throw new Error("No se pudo obtener el ID de la sala");
      }

      console.log("✅ Sala encontrada, roomId:", data.roomId);

      sessionStorage.setItem("currentRoomCode", codigoLimpio);
      sessionStorage.setItem("currentRoomId", data.roomId);

      if (!token || !userData) {
        console.log("❌ Usuario no logueado");
        router.push(`/login?code=${codigoLimpio}`);
        return;
      }

      const user = JSON.parse(userData);

      if (user.role !== "player") {
        throw new Error("Solo los jugadores pueden unirse a las salas");
      }

      console.log("✅ Redirigiendo con ID:", data.roomId);
      router.push(`/jugador/prediccion/${data.roomId}`);
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al ingresar a la sala");
    } finally {
      setLoading(false);
    }
  };

  const handleQRResult = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0]?.rawValue;

      if (!result) return;

      setShowScanner(false);

      const scannedCode = result.trim().toUpperCase();
      setCodigoSala(scannedCode);
      procesarCodigo(scannedCode);
    }
  };

  const handleScannerError = (err: unknown) => {
    console.error("Error escaneando QR:", err);
    setError("Error al acceder a la cámara");
    setShowScanner(false);
  };

  const handleIngresar = () => {
    if (loading) return;
    procesarCodigo(codigoSala);
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
              onChange={(e) => {
                setCodigoSala(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              placeholder="EJ: FX27"
              className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-center"
            />

            {error && (
              <div className="text-red-500 text-center text-sm">{error}</div>
            )}

            <button
              onClick={handleIngresar}
              disabled={loading}
              className="w-full py-3 bg-yellow-500 text-black rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "INGRESANDO..." : "INGRESAR"}
            </button>

            <button
              onClick={() => setShowScanner(!showScanner)}
              type="button"
              className="w-full py-3 border border-yellow-500/30 text-yellow-500 rounded-lg"
            >
              {showScanner ? "Cerrar escáner" : "Escanear QR"}
            </button>

            {showScanner && (
              <div className="rounded-lg overflow-hidden border border-yellow-500/20">
                <Scanner
                  onScan={handleQRResult}
                  onError={handleScannerError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}