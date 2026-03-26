"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Coins, Calendar, Clock, Zap,
  Search, Loader2, ChevronRight, Globe, MapPin, Trophy,
  X
} from "lucide-react";

interface Continent {
  name: string;
  code: string;
}

interface Country {
  name: string;
  code: string;
  flag: string;
}

interface League {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
}

interface Team {
  api_team_id: number;
  name: string;
  code: string;
  logo_url: string;
  country: string;
}

interface Fixture {
  api_fixture_id: number;
  api_league_id: number;
  league_name: string;
  team_home_id: number;
  team_home_name: string;
  team_away_id: number;
  team_away_name: string;
  match_date: string;
  status: string;
}

// Continentes disponibles
const CONTINENTS: Continent[] = [
  { name: "🌎 Sudamérica", code: "South America" },
  { name: "🌍 Europa", code: "Europe" },
  { name: "🌏 Asia", code: "Asia" },
  { name: "🌎 Norteamérica", code: "North America" },
  { name: "🌍 África", code: "Africa" },
  { name: "🌏 Oceanía", code: "Oceania" },
  { name: "🏆 Mundial (Selecciones)", code: "World" },
];

export default function CrearSala() {
  const router = useRouter();
  const [tipoSala, setTipoSala] = useState<"practice" | "paid">("paid");
  const [valorPrediccion, setValorPrediccion] = useState("5");
  const [cierrePredictions, setCierrePredictions] = useState("15min");
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  
  // Estados para búsqueda de equipos
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  
  // Estados de carga
  const [searching, setSearching] = useState(false);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  
  // Paso actual del flujo
  const [step, setStep] = useState<"continent" | "country" | "league" | "team" | "fixtures">("continent");

  // Obtener países por continente
  const fetchCountries = async (continent: string) => {
    setLoadingCountries(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/countries?continent=${continent}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error("Error cargando países:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Obtener ligas por país
  const fetchLeagues = async (country: string) => {
    setLoadingLeagues(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues?country=${encodeURIComponent(country)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        // Filtrar solo ligas de tipo "League" (no cups)
        const filtered = data.data.filter((l: League) => l.type === "League");
        setLeagues(filtered);
      }
    } catch (error) {
      console.error("Error cargando ligas:", error);
    } finally {
      setLoadingLeagues(false);
    }
  };

  // Buscar equipos
  const searchTeams = async () => {
    if (searchTerm.length < 2) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/search-teams?q=${encodeURIComponent(searchTerm)}`;
      
      // Si hay liga seleccionada, filtrar por ella
      if (selectedLeague) {
        url += `&league=${selectedLeague.id}`;
      }
      
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
        setStep("team");
      }
    } catch (error) {
      console.error("Error buscando equipos:", error);
    } finally {
      setSearching(false);
    }
  };

  // Buscar partidos de un equipo
  const fetchTeamFixtures = async (teamId: number) => {
    setLoadingFixtures(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/team-fixtures?teamId=${teamId}&next=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setFixtures(data.data);
        setStep("fixtures");
      }
    } catch (error) {
      console.error("Error buscando partidos:", error);
    } finally {
      setLoadingFixtures(false);
    }
  };

  // Seleccionar continente
  const handleSelectContinent = (continent: Continent) => {
    setSelectedContinent(continent);
    if (continent.code === "World") {
      // Para Mundial, no hay países, ir directamente a ligas
      setStep("league");
      // Aquí deberías cargar las ligas mundiales (FIFA World Cup)
    } else {
      fetchCountries(continent.code);
      setStep("country");
    }
  };

  // Seleccionar país
  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    fetchLeagues(country.name);
    setStep("league");
  };

  // Seleccionar liga
  const handleSelectLeague = (league: League) => {
    setSelectedLeague(league);
    setStep("team");
    setSearchTerm("");
    setSearchResults([]);
  };

  // Seleccionar equipo
  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamFixtures(team.api_team_id);
  };

  // Seleccionar partido
  const handleSelectFixture = (fixture: Fixture) => {
    setSelectedFixture(fixture);
  };

  // Reiniciar flujo
  const resetFlow = () => {
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSelectedLeague(null);
    setSelectedTeam(null);
    setSelectedFixture(null);
    setCountries([]);
    setLeagues([]);
    setSearchResults([]);
    setFixtures([]);
    setSearchTerm("");
    setStep("continent");
  };

  // Crear sala
  const handleCreateRoom = async () => {
    if (!selectedFixture) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const matchDate = new Date(selectedFixture.match_date);
      const closeTime = new Date(matchDate);
      if (cierrePredictions === "15min") {
        closeTime.setMinutes(closeTime.getMinutes() - 15);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bar/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${selectedFixture.team_home_name} vs ${selectedFixture.team_away_name}`,
          sport: "Fútbol",
          team_home: selectedFixture.team_home_name,
          team_away: selectedFixture.team_away_name,
          match_date: matchDate.toISOString(),
          prediction_close_time: closeTime.toISOString(),
          entry_fee: parseFloat(valorPrediccion),
          api_fixture_id: selectedFixture.api_fixture_id,
          api_league_id: selectedFixture.api_league_id,
          api_league_name: selectedFixture.league_name,
          api_team_home_id: selectedFixture.team_home_id,
          api_team_away_id: selectedFixture.team_away_id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push("/bar/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error("Error creando sala:", error);
      alert(error.message || "Error al crear sala");
    } finally {
      setLoading(false);
    }
  };

  const calcularPozo = () => {
    const valor = parseFloat(valorPrediccion) || 0;
    const estimadoJugadores = 50;
    const total = valor * estimadoJugadores;
    return {
      total: total.toFixed(2),
      premios: (total * 0.7).toFixed(2),
      bar: (total * 0.2).toFixed(2),
      plataforma: (total * 0.1).toFixed(2),
    };
  };

  const pozo = calcularPozo();

  // Mostrar progreso
  const getStepTitle = () => {
    switch (step) {
      case "continent": return "Seleccionar Continente";
      case "country": return "Seleccionar País";
      case "league": return "Seleccionar Campeonato";
      case "team": return "Buscar Equipo";
      case "fixtures": return "Seleccionar Partido";
      default: return "Crear Sala";
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/bar/dashboard" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              <div className="border-b border-yellow-500/20 px-8 pt-8 pb-4">
                <h1 className="text-2xl font-light tracking-tight text-white">
                  CREAR <span className="text-yellow-500 font-medium">SALA</span>
                </h1>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                
                {/* Indicador de progreso */}
                <div className="flex items-center gap-2 mt-4 text-xs">
                  <span className="text-yellow-500">{getStepTitle()}</span>
                  {selectedFixture && (
                    <span className="text-gray-500">→ Configurar sala</span>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-8">
                
                {/* PASO 1: SELECCIONAR CONTINENTE */}
                {step === "continent" && (
                  <div className="space-y-4">
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      CONTINENTE
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CONTINENTS.map((continent) => (
                        <button
                          key={continent.code}
                          onClick={() => handleSelectContinent(continent)}
                          className="p-4 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all text-left"
                        >
                          <span className="text-white text-sm">{continent.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PASO 2: SELECCIONAR PAÍS */}
                {step === "country" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setStep("continent")}
                        className="text-yellow-500 text-sm hover:text-yellow-400 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a continentes
                      </button>
                    </div>
                    
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4" />
                      PAÍS
                    </label>
                    
                    {loadingCountries ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => handleSelectCountry(country)}
                            className="p-3 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all text-left flex items-center gap-2"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="text-white text-sm">{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 3: SELECCIONAR CAMPEONATO */}
                {step === "league" && selectedCountry && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setStep("country")}
                        className="text-yellow-500 text-sm hover:text-yellow-400 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a países
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-gray-400 text-sm">{selectedCountry.name}</span>
                      </div>
                    </div>
                    
                    <label className="block text-xs text-yellow-500 tracking-wider flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4" />
                      CAMPEONATO
                    </label>
                    
                    {loadingLeagues ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {leagues.map((league) => (
                          <button
                            key={league.id}
                            onClick={() => handleSelectLeague(league)}
                            className="w-full p-3 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all text-left flex items-center gap-3"
                          >
                            {league.logo && (
                              <img src={league.logo} alt={league.name} className="w-6 h-6 object-contain" />
                            )}
                            <div>
                              <span className="text-white text-sm">{league.name}</span>
                              <span className="text-gray-500 text-xs ml-2">{league.country}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-yellow-500 ml-auto" />
                          </button>
                        ))}
                        {leagues.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-8">
                            No hay campeonatos disponibles en este país
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 4: BUSCAR EQUIPO */}
                {step === "team" && selectedLeague && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setStep("league")}
                        className="text-yellow-500 text-sm hover:text-yellow-400 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a campeonatos
                      </button>
                      <div className="flex items-center gap-2">
                        {selectedLeague.logo && (
                          <img src={selectedLeague.logo} alt={selectedLeague.name} className="w-5 h-5" />
                        )}
                        <span className="text-gray-400 text-xs">{selectedLeague.name}</span>
                      </div>
                    </div>

                    <label className="block text-xs text-yellow-500 tracking-wider">BUSCAR EQUIPO</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchTeams()}
                          placeholder={`Buscar equipo en ${selectedLeague.name}...`}
                          className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                        />
                      </div>
                      <button
                        onClick={searchTeams}
                        disabled={searchTerm.length < 2 || searching}
                        className="bg-yellow-500 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-all disabled:opacity-50"
                      >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-gray-500 text-xs">Selecciona un equipo:</p>
                        {searchResults.map((team) => (
                          <button
                            key={team.api_team_id}
                            onClick={() => handleSelectTeam(team)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all text-left"
                          >
                            {team.logo_url && (
                              <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain" />
                            )}
                            <div>
                              <span className="text-white font-medium">{team.name}</span>
                              <span className="text-gray-500 text-xs ml-2">{team.country}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-yellow-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.length === 0 && searchTerm.length >= 2 && !searching && (
                      <p className="text-gray-500 text-sm text-center py-4">No se encontraron equipos en este campeonato</p>
                    )}
                  </div>
                )}

                {/* PASO 5: SELECCIONAR PARTIDO */}
                {step === "fixtures" && selectedTeam && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          setStep("team");
                          setSelectedTeam(null);
                          setFixtures([]);
                          setSelectedFixture(null);
                        }}
                        className="text-yellow-500 text-sm hover:text-yellow-400 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a equipos
                      </button>
                      <div className="flex items-center gap-2">
                        {selectedTeam.logo_url && (
                          <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="w-6 h-6" />
                        )}
                        <span className="text-white text-sm">{selectedTeam.name}</span>
                      </div>
                    </div>

                    <label className="block text-xs text-yellow-500 tracking-wider mb-3">PRÓXIMOS PARTIDOS</label>
                    
                    {loadingFixtures ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                      </div>
                    ) : fixtures.length > 0 ? (
                      <div className="space-y-3">
                        {fixtures.map((fixture) => (
                          <button
                            key={fixture.api_fixture_id}
                            onClick={() => handleSelectFixture(fixture)}
                            className={`w-full p-4 rounded-lg border transition-all text-left ${
                              selectedFixture?.api_fixture_id === fixture.api_fixture_id
                                ? "border-yellow-500 bg-yellow-500/10"
                                : "border-yellow-500/20 hover:border-yellow-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-500">{fixture.league_name}</span>
                                  <span className="text-xs text-yellow-500">
                                    {new Date(fixture.match_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                  <span className="text-white font-medium">{fixture.team_home_name}</span>
                                  <span className="text-yellow-500 text-sm">vs</span>
                                  <span className="text-white font-medium">{fixture.team_away_name}</span>
                                </div>
                                <div className="text-center mt-2">
                                  <span className="text-gray-500 text-xs">
                                    {new Date(fixture.match_date).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              {selectedFixture?.api_fixture_id === fixture.api_fixture_id && (
                                <div className="ml-4">
                                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-black"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">No hay próximos partidos programados para este equipo</p>
                    )}
                  </div>
                )}

                {/* CONFIGURACIÓN DE LA SALA */}
                {selectedFixture && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block text-xs text-yellow-500 tracking-wider">FECHA</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                          <input
                            type="text"
                            value={new Date(selectedFixture.match_date).toLocaleDateString()}
                            disabled
                            className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-gray-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs text-yellow-500 tracking-wider">HORA</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                          <input
                            type="text"
                            value={new Date(selectedFixture.match_date).toLocaleTimeString()}
                            disabled
                            className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs text-yellow-500 tracking-wider">CIERRE DE PREDICCIONES</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="cierre"
                            value="inicio"
                            checked={cierrePredictions === "inicio"}
                            onChange={() => setCierrePredictions("inicio")}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                          />
                          <span className="text-gray-400 text-sm">Al inicio del partido</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="cierre"
                            value="15min"
                            checked={cierrePredictions === "15min"}
                            onChange={() => setCierrePredictions("15min")}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                          />
                          <span className="text-gray-400 text-sm">15 minutos antes (recomendado)</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs text-yellow-500 tracking-wider">TIPO DE SALA</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setTipoSala("practice")}
                          className={`p-4 rounded-lg border transition-all ${
                            tipoSala === "practice"
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-yellow-500/20 hover:border-yellow-500/40"
                          }`}
                        >
                          <div className="text-left">
                            <div className="text-white font-medium mb-1">Modo Práctica</div>
                            <div className="text-gray-500 text-xs">Sin dinero real</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoSala("paid")}
                          className={`p-4 rounded-lg border transition-all ${
                            tipoSala === "paid"
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-yellow-500/20 hover:border-yellow-500/40"
                          }`}
                        >
                          <div className="text-left">
                            <div className="text-white font-medium mb-1">Modo Pago</div>
                            <div className="text-gray-500 text-xs">Premios reales</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {tipoSala === "paid" && (
                      <div className="space-y-3">
                        <label className="block text-xs text-yellow-500 tracking-wider">
                          VALOR POR PREDICCIÓN (R$)
                        </label>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                          <input
                            type="number"
                            value={valorPrediccion}
                            onChange={(e) => setValorPrediccion(e.target.value)}
                            min="1"
                            max="50"
                            step="1"
                            className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
                          />
                        </div>
                        <p className="text-gray-600 text-xs">Recomendado: R$ 2 a R$ 10</p>
                      </div>
                    )}

                    {tipoSala === "paid" && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <h3 className="text-white text-sm font-medium tracking-wide">RESUMEN ESTIMADO (50 jugadores)</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total recaudado:</span>
                            <span className="text-white">R$ {pozo.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Premios (70%):</span>
                            <span className="text-yellow-500">R$ {pozo.premios}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tu comisión (20%):</span>
                            <span className="text-green-500">R$ {pozo.bar}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Plataforma (10%):</span>
                            <span className="text-gray-500">R$ {pozo.plataforma}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={resetFlow}
                        className="flex-1 border border-yellow-500/30 text-gray-400 py-3 rounded-lg text-sm tracking-wide hover:border-yellow-500/50 transition-all"
                      >
                        CANCELAR
                      </button>
                      <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="group relative flex-1 overflow-hidden bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium tracking-wide hover:bg-yellow-400 transition-all disabled:opacity-50"
                      >
                        <span className="relative z-10">
                          {loading ? "CREANDO..." : "CREAR SALA"}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}