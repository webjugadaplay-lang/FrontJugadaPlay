"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, Sparkles, ChevronRight, Loader2 } from "lucide-react";

let jsQR: any;

export default function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [codigoSala, setCodigoSala] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Importar jsQR dinámicamente
  useEffect(() => {
    import("jsqr").then((module) => {
      jsQR = module.default;
    });
  }, []);

  // Leer código de la URL cuando se carga la página (desde QR o link directo)
  useEffect(() => {
    const codeFromUrl = searchParams?.get("code");
    if (codeFromUrl) {
      console.log("📱 Código recibido desde URL:", codeFromUrl);
      setCodigoSala(codeFromUrl.toUpperCase());
      procesarCodigo(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const procesarCodigo = async (codigo: string) => {
    console.log("🔍 Procesando código:", codigo);
    
    if (codigo.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      console.log("🔍 Buscando sala en backend con código:", codigo);
      
      // Buscar la sala en el backend (ruta pública, no requiere token)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/find-by-code?code=${codigo}`);
      const data = await response.json();
      
      console.log("📦 Respuesta del backend:", data);
      
      if (!response.ok) {
        throw new Error(data.message || "Sala no encontrada");
      }
      
      console.log("✅ Sala encontrada:", data.roomId);
      
      // Guardar el código en sessionStorage para después
      sessionStorage.setItem("currentRoomCode", codigo);
      sessionStorage.setItem("currentRoomId", data.roomId);
      
      // Verificar si el usuario está logueado
      if (!token || !userData) {
        console.log("❌ Usuario no logueado - redirigiendo a login con código:", codigo);
        router.push(`/login?code=${codigo}`);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "player") {
        setError("Solo los jugadores pueden unirse a las salas");
        setLoading(false);
        return;
      }

      console.log("✅ Usuario logueado - redirigiendo a predicción:", data.roomId);
      router.push(`/jugador/prediccion/${data.roomId}`);
      
    } catch (err: any) {
      console.error("❌ Error al procesar código:", err.message);
      setError(err.message || "Error al ingresar a la sala");
      setLoading(false);
    }
  };

  const handleIngresar = () => {
    if (codigoSala.length >= 3) {
      procesarCodigo(codigoSala);
    } else {
      setError("El código debe tener al menos 3 caracteres");
    }
  };

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

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !jsQR) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        
        if (code) {
          console.log("📷 QR escaneado:", code.data);
          
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          const stream = video.srcObject as MediaStream;
          if (stream) stream.getTracks().forEach(track => track.stop());
          setScannerActive(false);
          
          const scannedCode = code.data;
          setCodigoSala(scannedCode.toUpperCase());
          procesarCodigo(scannedCode.toUpperCase());
        }
      }
    };
    
    scanIntervalRef.current = setInterval(scan, 500);
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

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