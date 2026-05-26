//app/entrar/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, Key, Camera, X } from "lucide-react";
// @ts-ignore - Instascan no tiene tipos
import Instascan from "instascan";

export default function EntrarSalaPage() {
  const router = useRouter();
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modoQR, setModoQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
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

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.stop) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const extractRoomIdFromUrl = (url: string): string | null => {
    try {
      if (/^\d+$/.test(url)) return url;

      const patterns = [
        /\/bar\/sala\/(\d+)/,
        /\/sala\/(\d+)/,
        /\/jugador\/prediccion\/(\d+)/,
        /roomId=(\d+)/,
        /id=(\d+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }

      if (url.includes("?")) {
        const urlParams = new URLSearchParams(url.split("?")[1]);
        const roomId = urlParams.get("roomId") || urlParams.get("id");
        if (roomId) return roomId;
      }

      return null;
    } catch (error) {
      console.error("Error extrayendo ID:", error);
      return null;
    }
  };

  const procesarSalaId = async (roomId: string) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const roomResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const roomData = await roomResponse.json();

      if (!roomResponse.ok) {
        throw new Error(roomData.message || "La sala no existe");
      }

      if (roomData.success && roomData.data) {
        const sala = roomData.data;

        if (sala.status !== "active") {
          setError("Esta sala ya no está disponible");
          setLoading(false);
          return;
        }

        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (checkResponse.ok) {
          setError("Ya tienes una predicción activa en esta sala");
          setLoading(false);
          return;
        }

        router.push(`/jugador/prediccion/${roomId}`);
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al verificar la sala");
    } finally {
      setLoading(false);
    }
  };

  const iniciarScanner = () => {
    setScanning(true);
    setError("");

    const videoElement = document.getElementById("preview") as HTMLVideoElement;

    if (!videoElement) {
      setError("Error al iniciar la cámara");
      setScanning(false);
      return;
    }

    // Crear scanner con configuración simple
    scannerRef.current = new Instascan.Scanner({
      video: videoElement,
      mirror: false,
    });

    // Listener cuando se escanea un QR
    scannerRef.current.addListener("scan", async (content: string) => {
      console.log("QR escaneado:", content);

      const roomId = extractRoomIdFromUrl(content);

      if (!roomId) {
        setError("QR no válido");
        return;
      }

      // Detener scanner
      if (scannerRef.current && scannerRef.current.stop) {
        scannerRef.current.stop();
      }

      await procesarSalaId(roomId);
    });

    // Obtener cámaras disponibles
    Instascan.Camera.getCameras()
      .then((cameras: any[]) => {
        if (cameras.length === 0) {
          setError("No se encontró ninguna cámara");
          setScanning(false);
          return;
        }

        // Buscar cámara trasera (por nombre)
        let backCamera = cameras.find(
          (camera) =>
            camera.name.toLowerCase().includes("back") ||
            camera.name.toLowerCase().includes("rear") ||
            camera.name.toLowerCase().includes("environment") ||
            camera.name.toLowerCase().includes("trasera")
        );

        // Si no se encuentra, usar la última (suele ser la trasera)
        if (!backCamera && cameras.length > 1) {
          backCamera = cameras[cameras.length - 1];
        }

        const cameraToUse = backCamera || cameras[0];
        console.log("Usando cámara:", cameraToUse.name);

        scannerRef.current.start(cameraToUse);
      })
      .catch((err: Error) => {
        console.error("Error accediendo a la cámara:", err);
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
        setScanning(false);
      });
  };

  const detenerScanner = () => {
    if (scannerRef.current && scannerRef.current.stop) {
      scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
    setModoQR(false);
  };

  const procesarCodigoManual = async () => {
    if (!codigoSala.trim()) {
      setError("Por favor ingresa un código de sala");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${encodeURIComponent(
          codigoSala.trim()
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "La sala no existe");
      }

      if (data.success && data.roomId) {
        await procesarSalaId(data.roomId);
      }
    } catch (err: any) {
      setError(err.message || "Error al verificar el código");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procesarCodigoManual();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Verificando acceso...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link
              href="/jugador/dashboard"
              className="flex items-center gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <span className="text-yellow-500 text-sm tracking-wide">
                Hola, {user?.name || "Jugador"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              UNIRME A UNA{" "}
              <span className="text-yellow-500 font-medium">SALA</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mx-auto mt-3"></div>
            <p className="text-gray-500 text-sm mt-4">
              Ingresa el código de la sala o escanea el código QR
            </p>
          </div>

          {/* Botones de selección */}
          {!modoQR && !scanning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setModoQR(true)}
                className="flex flex-col items-center gap-3 p-6 bg-black/50 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                  <QrCode className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-white font-medium">Escanear QR</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Usa tu cámara para escanear
                  </p>
                </div>
              </button>

              <button
                onClick={() => setModoQR(true)}
                className="flex flex-col items-center gap-3 p-6 bg-black/50 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                  <Key className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-white font-medium">Código manual</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Ingresa el código alfanumérico
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Scanner QR */}
          {(modoQR || scanning) && (
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Camera className="w-5 h-5 text-yellow-500" />
                  {scanning ? "Escaneando..." : "Escanear QR"}
                </h3>
                <button
                  onClick={detenerScanner}
                  className="text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!scanning ? (
                <button
                  onClick={iniciarScanner}
                  className="w-full py-3 border border-yellow-500/50 text-yellow-500 rounded-lg hover:bg-yellow-500/10 transition-all font-medium"
                >
                  Iniciar cámara
                </button>
              ) : (
                <>
                  <video
                    id="preview"
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                    style={{ maxHeight: "400px" }}
                  ></video>
                  <p className="text-gray-500 text-xs text-center mt-4">
                    Coloca el código QR frente a la cámara
                  </p>
                </>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center mt-4">{error}</p>
              )}
            </div>
          )}

          {/* Código manual */}
          {!modoQR && !scanning && (
            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-2">
                    Código de la sala
                  </label>
                  <input
                    type="text"
                    value={codigoSala}
                    onChange={(e) => {
                      setCodigoSala(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="Ej: ABC123"
                    className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors uppercase"
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-2">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !codigoSala.trim()}
                  className="w-full py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verificando..." : "Unirme a la sala"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/jugador/dashboard"
              className="text-gray-500 hover:text-yellow-500 text-sm transition-colors"
            >
              ← Volver a mi dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}