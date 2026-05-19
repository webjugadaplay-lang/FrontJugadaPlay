"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, Plus, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  season: number;
}

export default function LeaguesManager() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/");
      return;
    }
    
    fetchLeagues();
  }, [router]);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/available-leagues`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeagues(data.data);
        setFilteredLeagues(data.data);
      }
    } catch (error) {
      console.error("Error cargando ligas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredLeagues(leagues);
    } else {
      const filtered = leagues.filter(league =>
        league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        league.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeagues(filtered);
    }
  }, [searchTerm, leagues]);

  const toggleLeague = (leagueId: number) => {
    setSelectedLeagues(prev =>
      prev.includes(leagueId)
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  const addSelectedLeagues = async () => {
    if (selectedLeagues.length === 0) return;
    
    setAdding(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem("token");
      const leaguesToAdd = leagues.filter(league => selectedLeagues.includes(league.id));
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add-leagues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ leagues: leaguesToAdd })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setSelectedLeagues([]);
      } else {
        setMessage({ type: "error", text: data.message || "Error al agregar ligas" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexión con el servidor" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard">
            <button className="text-yellow-500 hover:text-yellow-400 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-2xl text-yellow-500 font-light">Gestión de Ligas</h1>
        </div>

        {/* Buscador */}
        <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-5 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar liga por nombre o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-yellow-500/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/60"
              />
            </div>
            <button
              onClick={fetchLeagues}
              className="flex items-center gap-2 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-sm hover:border-yellow-500/50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Mensaje */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Listado de ligas */}
        {loading ? (
          <div className="text-gray-400 text-center py-12">Cargando ligas disponibles...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredLeagues.map((league) => (
                <div
                  key={league.id}
                  onClick={() => toggleLeague(league.id)}
                  className={`bg-black/30 border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedLeagues.includes(league.id)
                      ? 'border-yellow-500/60 bg-yellow-500/5'
                      : 'border-yellow-500/20 hover:border-yellow-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {league.logo && <img src={league.logo} alt={league.name} className="w-8 h-8 object-contain" />}
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{league.name}</h3>
                      <p className="text-gray-500 text-xs">{league.country} • Temporada {league.season}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border ${
                      selectedLeagues.includes(league.id)
                        ? 'bg-yellow-500 border-yellow-500 flex items-center justify-center'
                        : 'border-gray-500'
                    }`}>
                      {selectedLeagues.includes(league.id) && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLeagues.length === 0 && (
              <div className="text-gray-400 text-center py-12">No se encontraron ligas</div>
            )}

            {/* Botón de agregar */}
            {selectedLeagues.length > 0 && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={addSelectedLeagues}
                  disabled={adding}
                  className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-400 transition-all disabled:opacity-50"
                >
                  {adding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar {selectedLeagues.length} liga(s)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}