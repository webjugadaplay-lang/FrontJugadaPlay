//app/entrar/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, Key, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function EntrarSalaPage() {
  const router = useRouter();
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modoQR, setModoQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticación
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
    // Limpiar scanner al desmontar
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.log("Error al detener scanner:", err));
      }
    };
  }, []);

  // Función para extraer el ID de la sala desde una URL
  const extractRoomIdFromUrl = (url: string): string | null => {
    try {
      // Si es solo un ID (ej: "123"), devolverlo directamente
      if (/^\d+$/.test(url)) {
        return url;
      }

      // Intentar extraer ID de URL como /bar/sala/123 o /sala/123
      const patterns = [
        /\/bar\/sala\/(\d+)/,
        /\/sala\/(\d+)/,
        /\/jugador\/prediccion\/(\d+)/,
        /roomId=(\d+)/,
        /id=(\d+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // Si la URL tiene parámetros, intentar extraer
      if (url.includes('?')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const roomId = urlParams.get('roomId') || urlParams.get('id');
        if (roomId) return roomId;
      }

      return null;
    } catch (error) {
      console.error("Error extrayendo ID de URL:", error);
      return null;
    }
  };

  const iniciarScanner = async () => {
    setScanning(true);
    setError("");

    const scannerElement = document.getElementById("qr-reader");
    if (!scannerElement) {
      setError("Error: No se encontró el elemento del scanner");
      setScanning(false);
      return;
    }

    // Limpiar el elemento antes de crear un nuevo scanner
    scannerElement.innerHTML = "";

    try {
      // Primero verificar si el navegador soporta cámara
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Tu navegador no soporta acceso a la cámara");
        setScanning(false);
        return;
      }

      // Solicitar permisos de cámara primero
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Detener temporalmente

      // Crear instancia del scanner
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      
      // Configuración para forzar cámara trasera
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: { exact: "environment" } // Forzar cámara trasera exactamente
        }
      };

      console.log("Iniciando scanner con configuración:", config);

      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Usar cámara trasera
        config,
        async (decodedText) => {
          console.log("QR escaneado:", decodedText);
          
          // Detener scanner automáticamente después de escanear
          if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          
          // Extraer el ID de la sala de la URL escaneada
          const roomId = extractRoomIdFromUrl(decodedText);
          
          if (!roomId) {
            setError("QR no válido. No se pudo identificar la sala.");
            setScanning(false);
            setLoading(false);
            return;
          }
          
          console.log("ID de sala extraído:", roomId);
          await procesarSalaId(roomId);
        },
        (errorMessage) => {
          // No mostramos errores de escaneo continuo para no molestar
          console.log("Escaneando...", errorMessage);
        }
      );
      
      console.log("Scanner iniciado correctamente");
      
    } catch (err: any) {
      console.error("Error al iniciar scanner:", err);
      
      // Manejar errores específicos
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError("Permiso de cámara denegado. Por favor, permite el acceso a la cámara.");
      } else if (err.name === 'NotFoundError' || err.message?.includes('not found')) {
        setError("No se encontró una cámara trasera en tu dispositivo.");
      } else if (err.name === 'NotReadableError') {
        setError("La cámara está siendo usada por otra aplicación.");
      } else if (err.message?.includes('facingMode')) {
        // Si falla con facingMode exact, intentar sin exact
        try {
          console.log("Intentando con facingMode normal...");
          if (html5QrCodeRef.current) {
            await html5QrCodeRef.current.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              async (decodedText) => {
                // Mismo callback de éxito
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                  await html5QrCodeRef.current.stop();
                }
                const roomId = extractRoomIdFromUrl(decodedText);
                if (!roomId) {
                  setError("QR no válido. No se pudo identificar la sala.");
                  setScanning(false);
                  return;
                }
                await procesarSalaId(roomId);
              },
              (errorMessage) => {
                console.log("Escaneando...", errorMessage);
              }
            );
          }
        } catch (fallbackErr) {
          setError("No se pudo acceder a la cámara trasera. Verifica los permisos.");
        }
      } else {
        setError("Error al iniciar la cámara: " + (err.message || "Desconocido"));
      }
      
      setScanning(false);
    }
  };

  const detenerScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log("Scanner detenido correctamente");
      } catch (err) {
        console.log("Error al detener scanner:", err);
      }
    }
    html5QrCodeRef.current = null;
    setScanning(false);
    setModoQR(false);
    
    // Limpiar el contenedor
    const scannerElement = document.getElementById("qr-reader");
    if (scannerElement) {
      scannerElement.innerHTML = "";
    }
  };

  const procesarSalaId = async (roomId: string) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Primero verificar si la sala existe obteniendo sus datos
      const roomResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const roomData = await roomResponse.json();

      if (!roomResponse.ok) {
        throw new Error(roomData.message || "La sala no existe o no está disponible");
      }

      if (roomData.success && roomData.data) {
        const sala = roomData.data;
        
        // Verificar si la sala está activa
        if (sala.status !== 'active') {
          setError("Esta sala ya no está disponible para nuevas predicciones");
          setLoading(false);
          return;
        }

        // Verificar si el jugador ya tiene una predicción en esta sala
        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/player/prediction/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Si la predicción existe (status 200), significa que ya tiene una predicción
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.success && checkData.data) {
            setError("Ya tienes una predicción activa en esta sala");
            setLoading(false);
            return;
          }
        }

        // Redirigir a la página de predicción
        await detenerScanner();
        router.push(`/jugador/prediccion/${roomId}`);
      } else {
        throw new Error("Sala no encontrada");
      }
    } catch (err: any) {
      console.error("Error al verificar sala:", err);
      setError(err.message || "Error al verificar la sala");
    } finally {
      setLoading(false);
    }
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

      // Buscar sala por código
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${encodeURIComponent(codigoSala.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "La sala no existe o no está disponible");
      }

      if (data.success && data.roomId) {
        await procesarSalaId(data.roomId);
      } else {
        throw new Error("Sala no encontrada");
      }
    } catch (err: any) {
      console.error("Error al verificar sala:", err);
      setError(err.message || "Error al verificar el código de sala");
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/jugador/dashboard" className="flex items-center gap-3 group">
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

      {/* Contenido principal */}
      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Título */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              UNIRME A UNA <span className="text-yellow-500 font-medium">SALA</span>
            </h1>
            <div className="w-12 h-[1px] bg-yellow-500/30 mx-auto mt-3"></div>
            <p className="text-gray-500 text-sm mt-4">
              Ingresa el código de la sala o escanea el código QR
            </p>
          </div>

          {/* Selector de modo */}
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

          {/* Modo QR */}
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
                  <div id="qr-reader" className="w-full"></div>
                  <p className="text-gray-500 text-xs text-center mt-4">
                    Coloca el código QR dentro del recuadro para escanearlo automáticamente
                  </p>
                </>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center mt-4">{error}</p>
              )}
            </div>
          )}

          {/* Formulario código manual */}
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

              <div className="mt-6 pt-6 border-t border-yellow-500/20">
                <p className="text-gray-500 text-xs text-center">
                  ¿No tienes un código? Pídele a tu organizador el código de la sala o el QR
                </p>
              </div>
            </div>
          )}

          {/* Botón volver al dashboard */}
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