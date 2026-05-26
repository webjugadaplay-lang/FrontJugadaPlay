//app/entrar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, Key, Camera, X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function EntrarSalaPage() {
    const router = useRouter();
    const [codigoSala, setCodigoSala] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [modoQR, setModoQR] = useState(false);
    const [scanning, setScanning] = useState(false);
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

    // Función mejorada para extraer el ID de la sala (soporta UUID)
    const extractRoomIdFromUrl = (url: string): string | null => {
        console.log("Extrayendo ID de URL:", url);

        try {
            // Patrón para UUID (ej: 9830e0b5-0253-44f5-b3e6-fa5e692a707b)
            const uuidPattern = /\/bar\/sala\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
            const uuidMatch = url.match(uuidPattern);
            if (uuidMatch && uuidMatch[1]) {
                console.log("ID UUID encontrado:", uuidMatch[1]);
                return uuidMatch[1];
            }

            // Patrón para números simples
            const numberPattern = /\/bar\/sala\/(\d+)/;
            const numberMatch = url.match(numberPattern);
            if (numberMatch && numberMatch[1]) {
                console.log("ID numérico encontrado:", numberMatch[1]);
                return numberMatch[1];
            }

            // Otros patrones posibles
            const patterns = [
                /\/sala\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
                /\/jugador\/prediccion\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
                /roomId=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
                /id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    console.log("ID encontrado con patrón alternativo:", match[1]);
                    return match[1];
                }
            }

            // Si es directamente un UUID
            const directUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (directUuidPattern.test(url)) {
                console.log("Es un UUID directo:", url);
                return url;
            }

            console.log("No se pudo extraer ID de:", url);
            return null;
        } catch (error) {
            console.error("Error extrayendo ID:", error);
            return null;
        }
    };

    // Reemplaza la función procesarSalaId con esto
    const procesarSalaId = async (roomId: string) => {
        console.log("Redirigiendo a predicción para sala:", roomId);
        router.push(`/jugador/prediccion/${roomId}`);
    };

    // Manejador para el scanner
    const handleScan = (detectedCodes: any[]) => {
        console.log("QR escaneado - detectedCodes:", detectedCodes);

        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0]?.rawValue;
            console.log("Texto escaneado:", scannedText);

            if (scannedText) {
                const roomId = extractRoomIdFromUrl(scannedText);
                console.log("ID extraído:", roomId);

                if (!roomId) {
                    setError("QR no válido. No se pudo identificar la sala.");
                    return;
                }

                // Detener el scanner antes de procesar
                setScanning(false);
                setModoQR(false);
                procesarSalaId(roomId);
            } else {
                setError("No se pudo leer el código QR");
            }
        }
    };

    const handleError = (error: any) => {
        console.error("Error del scanner:", error);
        if (error?.message?.includes("Permission")) {
            setError("Permiso de cámara denegado. Por favor, permite el acceso a la cámara.");
        } else if (error?.message?.includes("NotFound")) {
            setError("No se encontró ninguna cámara en tu dispositivo.");
        } else {
            setError("Error al acceder a la cámara. Verifica los permisos.");
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
                                    onClick={() => {
                                        setScanning(false);
                                        setModoQR(false);
                                        setError("");
                                    }}
                                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!scanning ? (
                                <button
                                    onClick={() => setScanning(true)}
                                    className="w-full py-3 border border-yellow-500/50 text-yellow-500 rounded-lg hover:bg-yellow-500/10 transition-all font-medium"
                                >
                                    Iniciar cámara
                                </button>
                            ) : (
                                <>
                                    <div className="w-full overflow-hidden rounded-lg">
                                        <Scanner
                                            onScan={handleScan}
                                            onError={handleError}
                                            constraints={{
                                                facingMode: "environment",
                                            }}
                                            scanDelay={500}
                                        />
                                    </div>
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