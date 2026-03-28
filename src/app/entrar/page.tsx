// app/entrar/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ScanLine, Crown, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import jsQR from "jsqr";

export default function EntrarSala() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [codigoSala, setCodigoSala] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Leer código de la URL (cuando viene del QR)
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCodigoSala(codeFromUrl.toUpperCase());
      // Auto-ingresar si hay código en la URL
      handleIngresar(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleIngresar = async (code?: string) => {
    const salaCode = code || codigoSala;
    if (salaCode.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verificar si el usuario está logueado
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (!token || !userData) {
        // No está logueado - guardar código en sessionStorage y redirigir a login
        sessionStorage.setItem("pendingRoomCode", salaCode);
        router.push("/login?redirect=entrar");
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "player") {
        setError("Solo los jugadores pueden unirse a las salas");
        setLoading(false);
        return;
      }

      // Buscar la sala por código
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${salaCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Sala no encontrada");
      }
      
      // Redirigir a la página de predicción de la sala
      router.push(`/jugador/prediccion/${data.roomId}`);
      
    } catch (err: any) {
      setError(err.message || "Error al ingresar a la sala");
      setLoading(false);
    }
  };

  // Función para iniciar el escáner QR
  const startScanner = async () => {
    setScannerActive(true);
    setError("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRCode();
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      setScannerActive(false);
    }
  };

  // Función para escanear QR
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        
        if (code) {
          clearInterval(scanInterval);
          // Detener la cámara
          const stream = video.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setScannerActive(false);
          setCodigoSala(code.data.toUpperCase());
          // Auto-ingresar
          handleIngresar(code.data.toUpperCase());
        }
      }
    }, 500);
    
    return () => clearInterval(scanInterval);
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header minimalista */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <Crown className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span className="text-sm font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
            <button className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
              ¿NECESITAS AYUDA?
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          
          {/* Tarjeta principal */}
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
                
                {/* Escáner QR activo */}
                {scannerActive && (
                  <div className="space-y-3">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full rounded-lg border border-yellow-500/30"
                        autoPlay
                        playsInline
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none"></div>
                    </div>
                    <button
                      onClick={stopScanner}
                      className="w-full text-red-500 text-sm py-2 hover:text-red-400 transition-colors"
                    >
                      Cancelar escaneo
                    </button>
                  </div>
                )}

                {/* Botón de escanear QR */}
                {!scannerActive && (
                  <button 
                    onClick={startScanner}
                    className="group relative w-full py-12 rounded-xl border border-yellow-500/30 bg-black hover:border-yellow-500/60 transition-all duration-300 overflow-hidden"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <div className={`absolute inset-0 bg-yellow-500/5 transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full border border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-500/60 transition-all">
                        <ScanLine className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                      </div>
                      <span className="text-yellow-500 text-sm tracking-wide font-light group-hover:tracking-wider transition-all">
                        ESCANEAR QR
                      </span>
                    </div>
                  </button>
                )}

                {/* Separador */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-yellow-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-4 text-gray-600 tracking-wider">O</span>
                  </div>
                </div>

                {/* Input manual */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-500 tracking-wider">
                    CÓDIGO DE LA SALA
                  </label>
                  <input
                    type="text"
                    value={codigoSala}
                    onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                    placeholder="EJ: FX27"
                    maxLength={6}
                    className="w-full bg-black border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-center text-lg tracking-wider focus:outline-none focus:border-yellow-500/60 transition-all placeholder:text-gray-800"
                  />
                  <p className="text-gray-700 text-xs text-center">
                    Ingresa el código de 4-6 caracteres
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Botón de ingresar */}
                <button 
                  onClick={() => handleIngresar()}
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

          {/* Link para volver */}
          <Link 
            href="/" 
            className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-sm hover:text-yellow-500 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide">VOLVER AL INICIO</span>
          </Link>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-yellow-500/10 py-4 px-6 bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-gray-700 text-xs tracking-wide">© 2026 JUGADAPLAY</p>
        </div>
      </footer>
    </main>
  );
}