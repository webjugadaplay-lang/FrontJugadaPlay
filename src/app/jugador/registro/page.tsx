// app/jugador/registro/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { translations, type Locale } from "@/messages";
import { detectInitialLocale } from "@/lib/i18n";
import { 
  ArrowLeft, Mail, Lock, Eye, EyeOff, 
  User, Phone, CheckCircle, Award, ChevronDown, IdCard
} from "lucide-react";

// Configuración de países
const countries = [
  { 
    code: "BR", 
    name: "Brasil", 
    dialCode: "+55", 
    phoneMask: "(##) #####-####",
    phonePlaceholder: "(11) 91234-5678",
    documentName: "CPF",
    documentPlaceholder: "000.000.000-00",
    documentLength: 11
  },
  { 
    code: "CO", 
    name: "Colombia", 
    dialCode: "+57", 
    phoneMask: "(###) ###-####",
    phonePlaceholder: "(300) 123-4567",
    documentName: "Cédula",
    documentPlaceholder: "1234567890",
    documentLength: 10
  },
  { 
    code: "MX", 
    name: "México", 
    dialCode: "+52", 
    phoneMask: "(##) ####-####",
    phonePlaceholder: "(55) 1234-5678",
    documentName: "CURP / INE",
    documentPlaceholder: "ABC123456XYZABC12",
    documentLength: 18
  }
];

// Función para formatear teléfono (SOLO para mostrar en pantalla)
const formatPhoneForDisplay = (value: string, country: typeof countries[0]): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  
  let formatted = '';
  let numberIndex = 0;
  
  for (let i = 0; i < country.phoneMask.length && numberIndex < numbers.length; i++) {
    if (country.phoneMask[i] === '#') {
      formatted += numbers[numberIndex];
      numberIndex++;
    } else {
      formatted += country.phoneMask[i];
    }
  }
  
  return formatted;
};

// Función para formatear documento (SOLO para mostrar en pantalla)
const formatDocumentForDisplay = (value: string, country: typeof countries[0]): string => {
  if (country.code === "BR") {
    // Formato CPF para pantalla: 000.000.000-00
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    let formatted = '';
    let numberIndex = 0;
    const mask = "000.000.000-00";
    
    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
      if (mask[i] === '0') {
        formatted += numbers[numberIndex];
        numberIndex++;
      } else {
        formatted += mask[i];
      }
    }
    return formatted;
  } else if (country.code === "CO") {
    // Colombia: solo números
    return value.replace(/\D/g, '');
  } else if (country.code === "MX") {
    // México: mayúsculas, sin espacios
    return value.toUpperCase().replace(/\s/g, '');
  }
  return value;
};

// Función para limpiar SOLO números (para enviar al backend)
const cleanToNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Función para capitalizar nombres
const capitalizeName = (value: string): string => {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function RegistroJugador() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    documento: "",
    telefone: "",
    password: "",
  });

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = translations[locale];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      // SOLO para mostrar en pantalla
      const formatted = formatPhoneForDisplay(value, selectedCountry);
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'documento') {
      // SOLO para mostrar en pantalla
      const formatted = formatDocumentForDisplay(value, selectedCountry);
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'nombre') {
      const capitalized = capitalizeName(value);
      setFormData({ ...formData, [name]: capitalized });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCountryChange = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    
    // Reformatear teléfono en pantalla con nuevo país
    if (formData.telefone) {
      const cleanPhone = cleanToNumbers(formData.telefone);
      const reformatted = formatPhoneForDisplay(cleanPhone, country);
      setFormData(prev => ({ ...prev, telefone: reformatted }));
    }
    
    // Reformatear documento en pantalla con nuevo país
    if (formData.documento) {
      const reformatted = formatDocumentForDisplay(formData.documento, country);
      setFormData(prev => ({ ...prev, documento: reformatted }));
    }
  };

  const validateDocument = (): boolean => {
    if (!formData.documento) {
      setError(`Por favor, ingrese su ${selectedCountry.documentName}`);
      return false;
    }
    
    if (selectedCountry.code === "BR") {
      const cleanDoc = cleanToNumbers(formData.documento);
      if (cleanDoc.length !== 11) {
        setError(`CPF inválido. Debe tener 11 números. Ejemplo: 12345678900`);
        return false;
      }
      return true;
    } else if (selectedCountry.code === "CO") {
      const cleanDoc = cleanToNumbers(formData.documento);
      if (cleanDoc.length < 7 || cleanDoc.length > 10) {
        setError(`Cédula inválida. Debe tener entre 7 y 10 números. Ejemplo: 1234567890`);
        return false;
      }
      return true;
    } else if (selectedCountry.code === "MX") {
      const cleanDoc = formData.documento.toUpperCase().replace(/\s/g, '');
      if (cleanDoc.length < 10 || cleanDoc.length > 18) {
        setError(`Identificación inválida. Debe tener entre 10 y 18 caracteres.`);
        return false;
      }
      return true;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!aceptarTerminos) {
      setError(t.register.termsError);
      return;
    }
    
    if (!validateDocument()) {
      return;
    }
    
    // ==============================================
    // LIMPIEZA DE DATOS PARA ENVIAR AL BACKEND
    // ==============================================
    
    // 1. LIMPIAR TELÉFONO: eliminar paréntesis, espacios, guiones
    const cleanPhone = cleanToNumbers(formData.telefone);
    // Ejemplo: "(300) 425-4878" → "3004254878"
    
    if (cleanPhone.length === 0) {
      setError("Por favor, ingrese un número de teléfono válido");
      return;
    }
    
    // 2. LIMPIAR DOCUMENTO según el país
    let cleanDocument = "";
    if (selectedCountry.code === "BR") {
      // Brasil: solo números (eliminar puntos y guiones)
      cleanDocument = cleanToNumbers(formData.documento);
      // Ejemplo: "123.456.789-00" → "12345678900"
    } else if (selectedCountry.code === "CO") {
      // Colombia: solo números
      cleanDocument = cleanToNumbers(formData.documento);
      // Ejemplo: "1234567890" → "1234567890"
    } else if (selectedCountry.code === "MX") {
      // México: mayúsculas, sin espacios
      cleanDocument = formData.documento.toUpperCase().replace(/\s/g, '');
      // Ejemplo: "abc123456xyz" → "ABC123456XYZ"
    }
    
    setLoading(true);

    try {
      // Construir el objeto que se envía al backend
      const requestBody = {
        email: formData.email,
        password: formData.password,
        role: "player",
        name: formData.nombre,
        phone: cleanPhone,              // 👈 SOLO NÚMEROS: "3004254878"
        phoneCountry: selectedCountry.code,
        playerNickname: formData.nombre,
        documentType: selectedCountry.documentName,
        documentNumber: cleanDocument,  // 👈 SOLO NÚMEROS o MAYÚSCULAS
        countryCode: selectedCountry.code,
      };

      console.log("=== DATOS ENVIADOS AL BACKEND ===");
      console.log("Teléfono limpio:", cleanPhone);
      console.log("Documento limpio:", cleanDocument);
      console.log("Body completo:", requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.register.registerError);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/jugador/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLocaleReady) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">
              <label
                htmlFor="locale-select"
                className="text-gray-400 text-xs md:text-sm tracking-wide"
              >
                {t.header.language}
              </label>
              <select
                id="locale-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>
            
            <form onSubmit={handleSubmit} className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden">
              
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    {t.register.title}{" "}
                    <span className="text-yellow-500 font-medium">{t.register.player}</span>
                  </h1>
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-3">
                  {t.register.playerSubtitle}
                </p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.fullName} *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder={t.register.fullNamePlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.email} *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t.register.emailPlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                  </div>
                </div>

                {/* Selector de País */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">País *</label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-black border border-yellow-500/30 rounded-lg hover:border-yellow-500/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-medium">{selectedCountry.name}</span>
                        <span className="text-yellow-500 text-xs">{selectedCountry.dialCode}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-yellow-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-black border border-yellow-500/30 rounded-lg shadow-xl z-50 overflow-hidden">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountryChange(country)}
                            className={`w-full px-4 py-2 text-left hover:bg-yellow-500/10 transition-colors flex items-center justify-between ${
                              selectedCountry.code === country.code ? 'bg-yellow-500/20 text-yellow-500' : 'text-white'
                            }`}
                          >
                            <span>{country.name}</span>
                            <span className="text-xs text-gray-500">{country.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Documento de identidad */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">
                    {selectedCountry.documentName} (Identificación) *
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="text"
                      name="documento"
                      value={formData.documento}
                      onChange={handleChange}
                      required
                      placeholder={selectedCountry.documentPlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all font-mono text-sm"
                    />
                  </div>
                  <p className="text-gray-600 text-xs">
                    {selectedCountry.code === "BR" && "Ejemplo: 123.456.789-00"}
                    {selectedCountry.code === "CO" && "Ejemplo: 1234567890"}
                    {selectedCountry.code === "MX" && "Ejemplo: ABC123456XYZABC12"}
                  </p>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.phone} *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      placeholder={selectedCountry.phonePlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all font-mono text-sm"
                    />
                  </div>
                  <p className="text-gray-600 text-xs">
                    {selectedCountry.code === "CO" && "Ejemplo: (300) 425-4878"}
                    {selectedCountry.code === "BR" && "Ejemplo: (11) 91234-5678"}
                    {selectedCountry.code === "MX" && "Ejemplo: (55) 1234-5678"}
                  </p>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label className="block text-xs text-yellow-500 tracking-wider">{t.register.password} *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder={t.register.passwordPlaceholder}
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs">{t.register.passwordMinLength}</p>
                </div>

                {/* Términos */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptarTerminos}
                    onChange={(e) => setAceptarTerminos(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30 rounded"
                  />
                  <span className="text-gray-500 text-xs">
                    {t.register.acceptTerms}{" "}
                    <span className="text-yellow-500">{t.register.termsAndConditions}</span>{" "}
                    {t.register.of} JugadaPlay
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Beneficios */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500 text-xs font-medium">DEMUESTRA QUIÉN MANDA</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>✓ Reta a tus amigos en tu bar favorito</p>
                    <p>✓ Conviértete en el rey del pronóstico</p>
                    <p>✓ Gana premios en tu bar</p>
                    <p>✓ Sin comisiones ocultas</p>
                  </div>
                </div>

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all overflow-hidden ${
                    !loading && aceptarTerminos
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                      : "bg-gray-900 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {loading ? t.register.registeringPlayer : t.register.registerPlayerButton}
                  </span>
                  {!loading && aceptarTerminos && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  {t.register.alreadyHaveAccountPlayer}{" "}
                  <Link href="/login" className="text-yellow-500 hover:text-yellow-400">
                    {t.register.loginPlayer}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}