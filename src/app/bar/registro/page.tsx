"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { translations, type Locale } from "@/messages";
import { detectInitialLocale } from "@/lib/i18n";

import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  MapPin,
  User,
  CheckCircle,
  ChevronDown,
  IdCard,
} from "lucide-react";

// Configuración de países UNIFICADA
const countries = [
  {
    code: "BR",
    name: "Brasil",
    dialCode: "+55",
    phoneMask: "(##) #####-####",
    phonePlaceholder: "(11) 91234-5678",
    barDocumentName: "CNPJ",
    barDocumentMask: "00.000.000/0000-00",
    barDocumentPlaceholder: "00.000.000/0000-00",
    barDocumentLength: 14,
    hasAlternativeDocument: true,
    alternativeDocumentName: "CPF",
    alternativeDocumentMask: "000.000.000-00",
    alternativeDocumentPlaceholder: "000.000.000-00",
    alternativeDocumentLength: 11,
  },
  {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    phoneMask: "(###) ###-####",
    phonePlaceholder: "(300) 123-4567",
    barDocumentName: "NIT",
    barDocumentMask: "#######-#",
    barDocumentPlaceholder: "1234567-8",
    barDocumentLength: 10,
    hasAlternativeDocument: true,
    alternativeDocumentName: "Cédula",
    alternativeDocumentMask: "##########",
    alternativeDocumentPlaceholder: "1234567890",
    alternativeDocumentLength: 10,
  },
  {
    code: "MX",
    name: "México",
    dialCode: "+52",
    phoneMask: "(##) ####-####",
    phonePlaceholder: "(55) 1234-5678",
    barDocumentName: "RFC Persona Moral",
    barDocumentMask: "##########",
    barDocumentPlaceholder: "ABC123456XYZ",
    barDocumentLength: 12,
    barDocumentMinLength: 12,
    hasAlternativeDocument: true,
    alternativeDocumentName: "RFC Persona Física",
    alternativeDocumentMask: "##########",
    alternativeDocumentPlaceholder: "ABCD123456XYZ",
    alternativeDocumentLength: 13,
    alternativeDocumentMinLength: 13,
    hasThirdDocument: true,
    thirdDocumentName: "CURP",
    thirdDocumentMask: "##########",
    thirdDocumentPlaceholder: "ABCD123456EFGHIJ18",
    thirdDocumentLength: 18,
  }
];

// Función para aplicar formato al número de teléfono
const formatPhoneNumber = (value: string, country: typeof countries[0]): string => {
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

// Función para formatear NIT colombiano automáticamente
const formatNIT = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';

  if (numbers.length <= 9) {
    return numbers;
  } else {
    const firstPart = numbers.slice(0, 9);
    const secondPart = numbers.slice(9, 10);
    return `${firstPart}-${secondPart}`;
  }
};

// Función para formatear RFC mexicano (mayúsculas automáticas)
const formatRFC = (value: string): string => {
  let cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanValue.length > 13) {
    cleanValue = cleanValue.slice(0, 13);
  }
  return cleanValue;
};

// Función para formatear CURP mexicana
const formatCURP = (value: string): string => {
  let cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanValue.length > 18) {
    cleanValue = cleanValue.slice(0, 18);
  }
  return cleanValue;
};

// Función para aplicar formato al documento según país y tipo
const formatDocument = (value: string, country: typeof countries[0], tipoDocumento: string): string => {
  const isAlternative = tipoDocumento === country.alternativeDocumentName;

  // Para NIT de Colombia
  if (country.code === "CO" && !isAlternative) {
    return formatNIT(value);
  }

  // Para CPF/CNPJ de Brasil
  if (country.code === "BR") {
    // Determinar qué máscara usar según el tipo de documento
    let mask;
    if (isAlternative) {
      // CPF
      mask = country.alternativeDocumentMask; // "000.000.000-00"
    } else {
      // CNPJ
      mask = country.barDocumentMask; // "00.000.000/0000-00"
    }

    let cleanValue = value.replace(/[^0-9]/g, '');
    let formatted = '';
    let charIndex = 0;

    for (let i = 0; i < mask.length && charIndex < cleanValue.length; i++) {
      if (mask[i] === '0') {
        formatted += cleanValue[charIndex];
        charIndex++;
      } else {
        formatted += mask[i];
      }
    }
    return formatted;
  }

  // Para Cédula de Colombia
  if (country.code === "CO" && isAlternative) {
    return value.replace(/[^0-9]/g, '').slice(0, 10);
  }

  // Para RFC de México
  if (country.code === "MX" && !isAlternative) {
    return formatRFC(value);
  }

  // Para CURP de México
  if (country.code === "MX" && isAlternative) {
    return formatCURP(value);
  }

  return value;
};

// Función para limpiar (solo dígitos)
const cleanNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

export default function RegistroBar() {
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

  // Tipo de documento: principal, alternativo o tercero
  const [tipoDocumento, setTipoDocumento] = useState<"principal" | "alternativo" | "tercero">("principal");

  const [formData, setFormData] = useState({
    nombreBar: "",
    email: "",
    telefone: "",
    endereco: "",
    documento: "",
    responsavel: "",
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

  const getCurrentDocumentName = () => {
    if (tipoDocumento === "alternativo" && selectedCountry.hasAlternativeDocument) {
      return selectedCountry.alternativeDocumentName;
    }
    if (tipoDocumento === "tercero" && (selectedCountry as any).hasThirdDocument) {
      return (selectedCountry as any).thirdDocumentName;
    }
    return selectedCountry.barDocumentName;
  };

  const getCurrentDocumentPlaceholder = () => {
    if (tipoDocumento === "alternativo" && selectedCountry.hasAlternativeDocument) {
      return selectedCountry.alternativeDocumentPlaceholder;
    }
    if (tipoDocumento === "tercero" && (selectedCountry as any).hasThirdDocument) {
      return (selectedCountry as any).thirdDocumentPlaceholder;
    }
    return selectedCountry.barDocumentPlaceholder;
  };

  const getCurrentDocumentLength = () => {
    if (tipoDocumento === "alternativo" && selectedCountry.hasAlternativeDocument) {
      return selectedCountry.alternativeDocumentLength;
    }
    if (tipoDocumento === "tercero" && (selectedCountry as any).hasThirdDocument) {
      return (selectedCountry as any).thirdDocumentLength;
    }
    return selectedCountry.barDocumentLength;
  };

  const getCurrentDocumentMinLength = () => {
    if (tipoDocumento === "alternativo" && selectedCountry.hasAlternativeDocument) {
      return selectedCountry.alternativeDocumentMinLength || selectedCountry.alternativeDocumentLength;
    }
    if (tipoDocumento === "tercero" && (selectedCountry as any).hasThirdDocument) {
      return (selectedCountry as any).thirdDocumentLength;
    }
    return selectedCountry.barDocumentMinLength || selectedCountry.barDocumentLength;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'telefone') {
      const formatted = formatPhoneNumber(value, selectedCountry);
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'documento') {
      const formatted = formatDocument(value, selectedCountry, getCurrentDocumentName());
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCountryChange = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setTipoDocumento("principal");
    setFormData(prev => ({ ...prev, documento: "" }));

    if (formData.telefone) {
      const cleanPhone = cleanNumber(formData.telefone);
      const reformatted = formatPhoneNumber(cleanPhone, country);
      setFormData(prev => ({ ...prev, telefone: reformatted }));
    }
  };

  const validateDocument = (): boolean => {
    if (!formData.documento) {
      setError(`Por favor, ingrese ${getCurrentDocumentName()}`);
      return false;
    }

    const currentDocName = getCurrentDocumentName();

    if (selectedCountry.code === "BR") {
      const cleanDoc = cleanNumber(formData.documento);
      if (currentDocName === "CNPJ" && cleanDoc.length !== 14) {
        setError(`CNPJ inválido. Debe tener 14 números. Ejemplo: 00.000.000/0000-00`);
        return false;
      }
      if (currentDocName === "CPF" && cleanDoc.length !== 11) {
        setError(`CPF inválido. Debe tener 11 números. Ejemplo: 000.000.000-00`);
        return false;
      }
    } else if (selectedCountry.code === "CO") {
      if (currentDocName === "NIT") {
        const cleanDoc = formData.documento.replace(/-/g, '').replace(/\D/g, '');
        if (cleanDoc.length !== 10) {
          setError(`NIT inválido. Debe tener 10 dígitos (ej: 1234567-8)`);
          return false;
        }
      }
      if (currentDocName === "Cédula") {
        const cleanDoc = cleanNumber(formData.documento);
        if (cleanDoc.length < 7 || cleanDoc.length > 10) {
          setError(`Cédula inválida. Debe tener entre 7 y 10 dígitos`);
          return false;
        }
      }
    } else if (selectedCountry.code === "MX") {
      if (currentDocName === "RFC Persona Moral") {
        if (formData.documento.length !== 12) {
          setError(`RFC Persona Moral inválido. Debe tener exactamente 12 caracteres. Ejemplo: ABC123456XYZ`);
          return false;
        }
        const rfcRegex = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(formData.documento.toUpperCase())) {
          setError(`Formato de RFC Persona Moral inválido`);
          return false;
        }
      }
      if (currentDocName === "RFC Persona Física") {
        if (formData.documento.length !== 13) {
          setError(`RFC Persona Física inválido. Debe tener exactamente 13 caracteres. Ejemplo: ABCD123456XYZ`);
          return false;
        }
        const rfcRegex = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(formData.documento.toUpperCase())) {
          setError(`Formato de RFC Persona Física inválido`);
          return false;
        }
      }
      if (currentDocName === "CURP") {
        if (formData.documento.length !== 18) {
          setError(`CURP inválida. Debe tener 18 caracteres`);
          return false;
        }
        const curpRegex = /^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}$/;
        if (!curpRegex.test(formData.documento.toUpperCase())) {
          setError(`Formato de CURP inválido`);
          return false;
        }
      }
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

    // ============ LIMPIAR DATOS ANTES DE ENVIAR ============

    // 1. Limpiar teléfono: solo números
    const cleanPhone = formData.telefone.replace(/\D/g, '');

    // 2. Limpiar documento según el tipo
    let cleanDocument = formData.documento;
    const currentDocName = getCurrentDocumentName();

    if (currentDocName === "NIT") {
      cleanDocument = formData.documento.replace(/-/g, '').replace(/\D/g, '');
    } else if (currentDocName === "Cédula") {
      cleanDocument = formData.documento.replace(/\D/g, '');
    } else if (currentDocName === "RFC Persona Moral" || currentDocName === "RFC Persona Física") {
      cleanDocument = formData.documento.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else if (currentDocName === "CURP") {
      cleanDocument = formData.documento.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else {
      cleanDocument = formData.documento.replace(/\D/g, '');
    }

    // Validar que el teléfono tenga dígitos
    if (cleanPhone.length === 0) {
      setError("Por favor, ingrese un número de teléfono válido");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: "owner",                    // ← CAMBIO: 'bar' → 'owner'
          name: formData.responsavel,       // ← nombre del dueño
          nickname: formData.responsavel,   // ← nickname del dueño
          phone: cleanPhone,
          phoneCountry: selectedCountry.dialCode,  // ← CAMBIO: enviar +55, +57, +52
          barName: formData.nombreBar,
          address: formData.endereco,
          documentType: currentDocName,
          documentNumber: cleanDocument,
          country: selectedCountry.code,    // ← CAMBIO: 'countryCode' → 'country'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.register.registerError);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/bar/dashboard");
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

      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500/5 rounded-2xl blur-xl"></div>

            <form
              onSubmit={handleSubmit}
              className="relative bg-black/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden"
            >
              <div className="border-b border-yellow-500/20 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    {t.register.title}{" "}
                    <span className="text-yellow-500 font-medium">{t.register.bar}</span>
                  </h1>
                </div>
                <div className="w-12 h-[1px] bg-yellow-500/30 mt-2"></div>
                <p className="text-gray-500 text-sm mt-3">
                  {t.register.barSubtitle}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Información del bar */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    {t.register.barInfo}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider">
                        {t.register.barName} *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                        <input
                          type="text"
                          name="nombreBar"
                          value={formData.nombreBar}
                          onChange={handleChange}
                          required
                          placeholder={t.register.barNamePlaceholder}
                          className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                        />
                      </div>
                    </div>

                    {/* Selector de País UNIFICADO */}
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider">
                        País *
                      </label>
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
                                className={`w-full px-4 py-2 text-left hover:bg-yellow-500/10 transition-colors flex items-center justify-between ${selectedCountry.code === country.code ? 'bg-yellow-500/20 text-yellow-500' : 'text-white'
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
                  </div>

                  {/* Tipo de Documento - Con 3 opciones para México */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      Tipo de Documento *
                    </label>
                    <div className="flex flex-wrap gap-4 bg-black border border-yellow-500/30 rounded-lg px-4 py-3">
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                          type="radio"
                          checked={tipoDocumento === "principal"}
                          onChange={() => {
                            setTipoDocumento("principal");
                            setFormData(prev => ({ ...prev, documento: "" }));
                          }}
                          className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                        />
                        {selectedCountry.barDocumentName}
                      </label>

                      {selectedCountry.hasAlternativeDocument && (
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                          <input
                            type="radio"
                            checked={tipoDocumento === "alternativo"}
                            onChange={() => {
                              setTipoDocumento("alternativo");
                              setFormData(prev => ({ ...prev, documento: "" }));
                            }}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                          />
                          {selectedCountry.alternativeDocumentName}
                        </label>
                      )}

                      {(selectedCountry as any).hasThirdDocument && (
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                          <input
                            type="radio"
                            checked={tipoDocumento === "tercero"}
                            onChange={() => {
                              setTipoDocumento("tercero");
                              setFormData(prev => ({ ...prev, documento: "" }));
                            }}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 bg-black border-yellow-500/30"
                          />
                          {(selectedCountry as any).thirdDocumentName}
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Campo de Documento */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs text-yellow-500 tracking-wider">
                      {getCurrentDocumentName()} *
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="text"
                        name="documento"
                        value={formData.documento}
                        onChange={handleChange}
                        required
                        placeholder={getCurrentDocumentPlaceholder()}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60 transition-all font-mono text-sm"
                        maxLength={50}
                      />
                    </div>
                    <p className="text-gray-600 text-xs">
                      {selectedCountry.code === "BR" && (getCurrentDocumentName() === "CNPJ" ? "CNPJ: 14 números (ej: 00.000.000/0000-00)" : "CPF: 11 números (ej: 000.000.000-00)")}
                      {selectedCountry.code === "CO" && (getCurrentDocumentName() === "NIT" ? "NIT: 10 dígitos (se formatea automáticamente: 1234567-8)" : "Cédula: 7-10 dígitos")}
                      {selectedCountry.code === "MX" && getCurrentDocumentName() === "RFC Persona Moral" && "RFC Persona Moral: 12 caracteres (3 letras + 6 números + 3 caracteres)"}
                      {selectedCountry.code === "MX" && getCurrentDocumentName() === "RFC Persona Física" && "RFC Persona Física: 13 caracteres (4 letras + 6 números + 3 caracteres)"}
                      {selectedCountry.code === "MX" && getCurrentDocumentName() === "CURP" && "CURP: 18 caracteres (4 letras + 6 números + 6 letras + 2 números)"}
                    </p>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    {t.register.location}
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        required
                        placeholder={t.register.addressPlaceholder}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <label className="block text-xs text-yellow-500 tracking-wider">
                        {t.register.phone} *
                      </label>
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
                        Formato: {selectedCountry.phoneMask} ({selectedCountry.name})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Responsable */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    {t.register.managerData}
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="text"
                        name="responsavel"
                        value={formData.responsavel}
                        onChange={handleChange}
                        required
                        placeholder={t.register.fullNamePlaceholder}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t.register.emailPlaceholder}
                        className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <h3 className="text-white text-sm font-light tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    {t.register.security}
                  </h3>
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
                      className="w-full bg-black border border-yellow-500/30 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-yellow-500/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">{t.register.passwordMinLength}</p>
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
                    {t.register.and}{" "}
                    <span className="text-yellow-500">{t.register.privacyPolicy}</span>.
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
                  <p className="text-yellow-500 text-xs font-medium mb-2">
                    🎯 {t.register.benefits}
                  </p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>✓ {t.register.benefit1}</p>
                    <p>✓ {t.register.benefit2}</p>
                    <p>✓ {t.register.benefit3}</p>
                  </div>
                </div>

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all overflow-hidden ${!loading && aceptarTerminos
                    ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/25"
                    : "bg-gray-900 text-gray-600 cursor-not-allowed"
                    }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {loading ? t.register.registering : t.register.registerButton}
                  </span>
                  {!loading && aceptarTerminos && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
                  )}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  {t.register.alreadyHaveAccount}{" "}
                  <Link href="/login" className="text-yellow-500 hover:text-yellow-400">
                    {t.register.login}
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