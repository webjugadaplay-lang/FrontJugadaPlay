//app/entrar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, Camera, X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function EntrarSalaPage() {
  const router = useRouter();
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modoQR, setModoQR] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "player") {
      router.push("/login");
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const extractRoomIdFromUrl = (url: string): string | null => {
    const uuidPattern = /\/bar\/sala\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match = url.match(uuidPattern);
    return match ? match[1] : null;
  };

  const procesarSalaId = (roomId: string) => {
    console.log("✅ Redirigiendo a:", `/jugador/prediccion/${roomId}`);
    router.push(`/jugador/prediccion/${roomId}`);
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedText = detectedCodes[0]?.rawValue;
      const roomId = extractRoomIdFromUrl(scannedText);
      
      if (roomId) {
        setModoQR(false);
        procesarSalaId(roomId);
      } else {
        setError("QR no válido");
      }
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    setError("Error al acceder a la cámara. Por favor, verifica los permisos.");
  };

  const procesarCodigoManual = async () => {
    if (!codigoSala.trim()) {
      setError("Ingresa un código");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms/find-by-code?code=${codigoSala.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success && data.roomId) {
        router.push(`/jugador/prediccion/${data.roomId}`);
      } else {
        setError(data.message || "Sala no encontrada o inactiva");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para activar el modo QR y la cámara directamente
  const activarQR = () => {
    setModoQR(true);
    setError("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Verificando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/jugador/dashboard" className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img src="/logo-jugadaplay.svg" alt="Jugada Play" className="h-10 md:h-12 lg:h-14 w-auto object-contain" />
            </Link>
            <span className="text-yellow-500 text-sm">Hola, {user?.name}</span>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light text-white">
              UNIRME A UNA <span className="text-yellow-500 font-medium">SALA</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mx-auto mt-3"></div>
          </div>

          {/* Botón para escanear QR - Ahora activa la cámara directamente */}
          {!modoQR && (
            <div className="mb-8">
              <button 
                onClick={activarQR} 
                className="w-full flex items-center justify-center gap-3 p-6 bg-black/50 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 transition-all group"
              >
                <QrCode className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">Escanear QR</p>
              </button>
            </div>
          )}

          {/* Sección del QR Scanner - Se muestra inmediatamente al presionar el botón */}
          {modoQR && (
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Escanear QR</h3>
                <button 
                  onClick={() => { 
                    setModoQR(false); 
                    setError(""); 
                  }} 
                  className="text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* El scanner se activa automáticamente al montar el componente */}
              <Scanner 
                onScan={handleScan} 
                onError={handleError} 
                constraints={{ facingMode: "environment" }} 
                scanDelay={500} 
              />
              <p className="text-gray-500 text-xs text-center mt-4">
                Coloca el QR frente a la cámara
              </p>
              
              {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            </div>
          )}

          {/* Formulario de código manual - SIEMPRE visible */}
          <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Ingresar código manualmente</h3>
            <form onSubmit={(e) => { e.preventDefault(); procesarCodigoManual(); }}>
              <input 
                type="text" 
                value={codigoSala} 
                onChange={(e) => setCodigoSala(e.target.value.toUpperCase())} 
                placeholder="Ejemplo: ABC123" 
                className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-yellow-500 transition-colors" 
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando..." : "Unirme"}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link href="/jugador/dashboard" className="text-gray-500 hover:text-yellow-500 text-sm transition-colors">
              ← Volver
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}