"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";

export default function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Leer código de la URL
  useEffect(() => {
    const codeFromUrl = searchParams?.get("code");
    if (codeFromUrl) {
      setCodigoSala(codeFromUrl.toUpperCase());
      procesarCodigo(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const procesarCodigo = async (codigo: string) => {
    if (codigo.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      // ✅ CORRECTO: Llamar al backend con la URL completa
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${codigo}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Sala no encontrada");
      }
      
      sessionStorage.setItem("currentRoomCode", codigo);
      sessionStorage.setItem("currentRoomId", data.roomId);
      
      if (!token || !userData) {
        router.push(`/login?code=${codigo}`);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "player") {
        setError("Solo los jugadores pueden unirse a las salas");
        setLoading(false);
        return;
      }

      router.push(`/jugador/prediccion/${data.roomId}`);
      
    } catch (err: any) {
      console.error("Error en procesarCodigo:", err);
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
    setError("Error al acceder a la cámara. Verifica los permisos.");
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
              <h1 className="text-2xl font-light tracking-tight text-white">
                ENTRAR A <span className="text-yellow-500 font-medium">SALA</span>
              </h1>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="w-12 h-[1px] bg-yellow-500/30 mt-3"></div>
          </div>

          <div className="p-8 space-y-8">
            {!showScanner ? (
              <button 
                onClick={() => setShowScanner(true)}
                className="group relative w-full py-12 rounded-xl border border-yellow-500/30 bg-black hover:border-yellow-500/60 transition-all duration-300 overflow-hidden"
              >
                <div className="relative flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-500/60 transition-all">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span className="text-yellow-500 text-sm tracking-wide font-light">
                    ESCANEAR QR
                  </span>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-yellow-500/30 bg-black">
                  <Scanner
                    onScan={handleQRResult}
                    onError={handleScannerError}
                    scanDelay={500}
                    constraints={{ facingMode: "environment" }}
                    styles={{ container: { width: "100%", aspectRatio: "1/1" } }}
                  />
                </div>
                <button
                  onClick={() => setShowScanner(false)}
                  className="w-full text-red-500 text-sm py-2 hover:text-red-400 transition-colors"
                >
                  Cancelar escaneo
                </button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-yellow-500/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-4 text-gray-600 tracking-wider">O</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-gray-500 tracking-wider">CÓDIGO DE LA SALA</label>
              <input
                type="text"
                value={codigoSala}
                onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                placeholder="EJ: FX27"
                maxLength={6}
                className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-center text-lg tracking-wider focus:outline-none focus:border-yellow-500/60 transition-all placeholder:text-gray-800"
              />
              <p className="text-gray-700 text-xs text-center">Ingresa el código de 4-6 caracteres</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button 
              onClick={handleIngresar}
              disabled={codigoSala.length < 3 || loading}
              className={`group relative w-full py-3 rounded-lg font-medium tracking-wide transition-all overflow-hidden ${
                codigoSala.length >= 3 && !loading
                  ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                  : "bg-gray-900 text-gray-600 cursor-not-allowed"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    INGRESANDO...
                  </>
                ) : (
                  <>
                    INGRESAR A LA SALA
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </span>
              {codigoSala.length >= 3 && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}