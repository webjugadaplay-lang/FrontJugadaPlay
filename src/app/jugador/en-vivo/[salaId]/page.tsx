// app/jugador/en-vivo/[salaId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import io, { Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Crown,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";

interface LiveRoomData {
  id: string;
  team_home: string;
  team_away: string;
  match_date: string;
  status: string;
  total_pool: number | string;
  current_score_home: number;
  current_score_away: number;
  entry_fee: number | string;
  bar?: {
    id?: string;
    name?: string;
    bar_name?: string;
  } | null;
  userPrediction: {
    score_home: number;
    score_away: number;
  } | null;
  ranking: Array<{
    userId: string;
    name: string;
    prediction: string;
    isUser: boolean;
    position?: number;
    emoji?: string;
    status?: string;
  }>;
}

export default function EnVivo() {
  const router = useRouter();
  const params = useParams();
  const salaId = params?.salaId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveData, setLiveData] = useState<LiveRoomData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  // 🔥 CONFIGURAR WEBSOCKET - Solo para conexión y presencia
  useEffect(() => {
    if (!salaId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    console.log("🔌 Conectando a WebSocket...");

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
      socket.emit('join-live-room', salaId);
      console.log(`📡 Unido a sala: live-room-${salaId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos`);
      setIsConnected(true);
      socket.emit('join-live-room', salaId);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-live-room', salaId);
        socketRef.current.disconnect();
      }
    };
  }, [salaId, router]);

  const fetchInitialData = async () => {
    if (!salaId || salaId === 'undefined' || salaId === 'null') {
      console.error("❌ salaId inválido:", salaId);
      setError("ID de sala inválido o no proporcionado");
      setLoading(false);
      return;
    }

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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/player/live-room/${salaId}?_t=${Date.now()}`;
      console.log("📡 Cargando datos iniciales:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar la sala en vivo");
      }

      if (!data.success || !data.data) {
        throw new Error("No se pudo cargar la información en vivo");
      }

      console.log("✅ Datos iniciales cargados:", {
        score: `${data.data.current_score_home} x ${data.data.current_score_away}`,
        players: data.data.ranking?.length
      });

      setLiveData(data.data);
      setLastUpdate(new Date());
      setError("");

    } catch (err: any) {
      console.error("❌ Error cargando sala en vivo:", err);
      setError(err.message || "Error al cargar la sala en vivo");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/player/live-room/${salaId}?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setLiveData(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error en refresh manual:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [salaId]);

  // ... resto del render (sin GoalNotification ni notificaciones de gol)
}