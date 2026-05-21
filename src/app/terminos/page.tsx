"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { translations, type Locale } from "@/messages";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";

  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") {
    return savedLocale;
  }

  const browserLanguage =
    navigator.language || (navigator.languages && navigator.languages[0]) || "";

  const normalizedLanguage = browserLanguage.toLowerCase();

  if (normalizedLanguage.startsWith("es")) return "es";
  if (normalizedLanguage.startsWith("pt")) return "pt-BR";

  return "pt-BR";
}

export default function TerminosPage() {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const t = translations[locale];

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
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Contenido de Términos y Condiciones actualizado
  const terminosContent = {
    title: locale === "pt-BR" ? "Termos e Condições de Uso" : "Términos y Condiciones de Uso",
    subtitle: locale === "pt-BR" ? "Bem-vindo ao Jugada Play" : "Bienvenido a Jugada Play",
    lastUpdate: locale === "pt-BR" ? "Última atualização: 13 de abril de 2026" : "Última actualización: 13 de abril de 2026",
    welcome: locale === "pt-BR"
      ? "Ao acessar, registrar-se ou utilizar a plataforma, o usuário aceita os presentes Termos e Condições."
      : "Al acceder, registrarse o utilizar la plataforma, el usuario acepta los presentes Términos y Condiciones.",
    sections: locale === "pt-BR" ? [
      {
        title: "1. Objeto do serviço",
        content: "Jugada Play é uma plataforma digital que permite a usuários participar de dinâmicas de predição esportiva organizadas por estabelecimentos afiliados, tais como bares, restaurantes ou locais autorizados.\n\nA plataforma atua exclusivamente como uma ferramenta tecnológica, encarregada do desenvolvimento, manutenção e engenharia do sistema, facilitando a criação de salas, o registro de predições e a gestão tecnológica de resultados e prêmios.\n\nJugada Play não atua como organizador direto das dinâmicas nem como intermediário financeiro entre usuários e estabelecimentos."
      },
      {
        title: "2. Registro e acesso",
        content: "Para utilizar a plataforma, o usuário deverá fornecer informações verdadeiras, completas e atualizadas.\n\nO usuário é responsável pela confidencialidade de sua conta, credenciais de acesso e qualquer atividade realizada a partir dela.\n\nJugada Play poderá suspender contas que apresentem informações falsas, duplicadas ou suspeitas."
      },
      {
        title: "3. Participação em salas",
        content: "As salas poderão ser:\n\n• gratuitas, com fins promocionais ou de entretenimento\n• pagas, sujeitas ao valor definido pelo estabelecimento anfitrião\n\nCada sala terá regras específicas, incluindo:\n\n• horário limite de participação\n• custo de entrada\n• critérios de premiação\n• evento esportivo associado\n\nUma vez enviada a predição e encerrado o tempo de participação, não poderá ser modificada."
      },
      {
        title: "4. Distribuição de valores",
        content: "Em salas pagas, salvo indicação em contrário, a distribuição econômica será:\n\n• 70% destinado ao prêmio dos ganhadores\n• 20% destinado ao estabelecimento anfitrião\n• 10% correspondente à comissão da Jugada Play\n\nOs percentuais poderão variar conforme campanhas, promoções ou acordos comerciais específicos."
      },
      {
        title: "5. Pagamentos e prêmios",
        content: "Os pagamentos realizados pelos usuários poderão ser processados por meios eletrônicos disponíveis em cada país.\n\nO estabelecimento anfitrião será responsável pelo recebimento do dinheiro e pela entrega do prêmio ao usuário ganhador, salvo se a Jugada Play implementar um sistema centralizado de pagamentos.\n\nJugada Play não será responsável por inadimplementos de pagamento atribuíveis exclusivamente ao estabelecimento, sem prejuízo de tomar medidas sobre a conta do mesmo."
      },
      {
        title: "6. Uso permitido",
        content: "O usuário se compromete a não:\n\n• manipular resultados\n• criar contas falsas\n• duplicar identidade ou documentos\n• interferir no funcionamento da plataforma\n• utilizar a plataforma com fins fraudulentos ou ilegais\n\nQualquer conduta suspeita poderá derivar em suspensão imediata."
      },
      {
        title: "7. Responsabilidade sobre resultados esportivos",
        content: "Os resultados mostrados pela plataforma poderão provir de fornecedores externos ou carga manual autorizada.\n\nEm caso de erro evidente, a Jugada Play se reserva o direito de corrigir resultados e recalcular prêmios."
      },
      {
        title: "8. Propriedade intelectual",
        content: "A marca Jugada Play, seu logo, design, software, interface, base de dados e conteúdo são propriedade exclusiva da plataforma.\n\nFica proibida sua reprodução sem autorização prévia."
      },
      {
        title: "9. Limitação legal",
        content: "Jugada Play opera como uma plataforma de entretenimento e dinâmica promocional entre usuários e estabelecimentos.\n\nCada estabelecimento é responsável por cumprir a normativa local aplicável no que diz respeito a promoções, concursos, tributação e manejo de dinheiro.\n\nA responsabilidade pelo pagamento de prêmios aos usuários ganhadores recai única e exclusivamente no estabelecimento anfitrião associado.\n\nO usuário aceita que a disponibilidade do serviço pode variar segundo país, região ou legislação."
      },
      {
        title: "10. Modificações",
        content: "Jugada Play poderá atualizar estes termos a qualquer momento. O uso continuado da plataforma implicará aceitação das mudanças."
      },
      {
        title: "11. Contato",
        content: "Para suporte ou reclamações: soporte@jugadaplay.com"
      }
    ] : [
      {
        title: "1. Objeto del servicio",
        content: "Jugada Play es una plataforma digital que permite a usuarios participar en dinámicas de predicción deportiva organizadas por establecimientos afiliados, tales como bares, restaurantes o locales autorizados.\n\nLa plataforma actúa exclusivamente como una herramienta tecnológica, encargada del desarrollo, mantenimiento e ingeniería del sistema, facilitando la creación de salas, el registro de predicciones y la gestión tecnológica de resultados y premios.\n\nJugada Play no actúa como organizador directo de las dinámicas ni como intermediario financiero entre usuarios y establecimientos."
      },
      {
        title: "2. Registro y acceso",
        content: "Para utilizar la plataforma, el usuario deberá proporcionar información veraz, completa y actualizada.\n\nEl usuario es responsable de la confidencialidad de su cuenta, credenciales de acceso y cualquier actividad realizada desde la misma.\n\nJugada Play podrá suspender cuentas que presenten información falsa, duplicada o sospechosa."
      },
      {
        title: "3. Participación en salas",
        content: "Las salas podrán ser:\n\n• gratuitas, con fines promocionales o de entretenimiento\n• pagas, sujetas al valor definido por el establecimiento anfitrión\n\nCada sala tendrá reglas específicas, incluyendo:\n\n• hora límite de participación\n• costo de ingreso\n• criterios de premiación\n• evento deportivo asociado\n\nUna vez enviada la predicción y cerrado el tiempo de participación, no podrá ser modificada."
      },
      {
        title: "4. Distribución de valores",
        content: "En salas pagas, salvo que se indique lo contrario, la distribución económica será:\n\n• 70% destinado al premio de los ganadores\n• 20% destinado al establecimiento anfitrión\n• 10% correspondiente a la comisión de Jugada Play\n\nLos porcentajes podrán variar según campañas, promociones o acuerdos comerciales específicos."
      },
      {
        title: "5. Pagos y premios",
        content: "Los pagos realizados por los usuarios podrán procesarse por medios electrónicos disponibles en cada país.\n\nEl establecimiento anfitrión será responsable de la recepción del dinero y de la entrega del premio al usuario ganador, salvo que Jugada Play implemente un sistema centralizado de pagos.\n\nJugada Play no será responsable por incumplimientos de pago atribuibles exclusivamente al establecimiento, sin perjuicio de tomar medidas sobre la cuenta del mismo."
      },
      {
        title: "6. Uso permitido",
        content: "El usuario se compromete a no:\n\n• manipular resultados\n• crear cuentas falsas\n• duplicar identidad o documentos\n• interferir con el funcionamiento de la plataforma\n• utilizar la plataforma con fines fraudulentos o ilegales\n\nCualquier conducta sospechosa podrá derivar en suspensión inmediata."
      },
      {
        title: "7. Responsabilidad sobre resultados deportivos",
        content: "Los resultados mostrados por la plataforma podrán provenir de proveedores externos o carga manual autorizada.\n\nEn caso de error evidente, Jugada Play se reserva el derecho de corregir resultados y recalcular premios."
      },
      {
        title: "8. Propiedad intelectual",
        content: "La marca Jugada Play, su logo, diseño, software, interfaz, base de datos y contenido son propiedad exclusiva de la plataforma.\n\nQueda prohibida su reproducción sin autorización previa."
      },
      {
        title: "9. Limitación legal",
        content: "Jugada Play opera como una plataforma de entretenimiento y dinámica promocional entre usuarios y establecimientos.\n\nCada establecimiento es responsable de cumplir la normativa local aplicable respecto a promociones, concursos, tributación y manejo de dinero.\n\nLa responsabilidad del pago de premios a los usuarios ganadores recae única y exclusivamente en el establecimiento anfitrión asociado.\n\nEl usuario acepta que la disponibilidad del servicio puede variar según país, región o legislación."
      },
      {
        title: "10. Modificaciones",
        content: "Jugada Play podrá actualizar estos términos en cualquier momento. El uso continuado de la plataforma implicará aceptación de los cambios."
      },
      {
        title: "11. Contacto",
        content: "Para soporte o reclamaciones: soporte@jugadaplay.com"
      }
    ]
  };

  return (
    <main className="min-h-screen bg-black">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-black/95 backdrop-blur-md border-b border-yellow-500/20"
          : "bg-transparent"
          }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20 gap-4">
            <Link href="/" className="flex items-center">
              <img
                src="/logo-jugadaplay.svg"
                alt="Jugada Play"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
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
                className="bg-black/80 border border-yellow-500/30 text-yellow-500 text-xs md:text-sm px-3 py-2 rounded-sm outline-none cursor-pointer hover:border-yellow-500/50 transition-colors"
              >
                <option value="pt-BR">PT</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/95"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 container mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">{locale === "pt-BR" ? "Voltar ao início" : "Volver al inicio"}</span>
          </Link>

          <div className="mb-6 flex justify-start">
            <span className="text-yellow-500 text-xs md:text-sm tracking-[0.25em] uppercase font-light">
              {locale === "pt-BR" ? "DOCUMENTO LEGAL" : "DOCUMENTO LEGAL"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent font-medium">
              {terminosContent.title}
            </span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mb-4 font-light">
            {terminosContent.subtitle}
          </p>

          <p className="text-gray-400 text-sm md:text-base border-l-2 border-yellow-500/50 pl-4 mt-4">
            {terminosContent.welcome}
          </p>

          <p className="text-gray-500 text-xs mt-4">
            {terminosContent.lastUpdate}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-10 md:py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-yellow-500/10 rounded-lg p-6 md:p-10">
            <div className="prose prose-invert prose-yellow max-w-none">
              {terminosContent.sections.map((section, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h2 className="text-xl md:text-2xl font-medium text-yellow-500 mb-4">
                    {section.title}
                  </h2>
                  <div className="text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
                    {section.content}
                  </div>
                  {index < terminosContent.sections.length - 1 && (
                    <div className="border-b border-yellow-500/10 mt-6"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-500/10 py-12 px-6 mt-10">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-8 mb-6">
            <Link
              href="/terminos"
              className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors"
            >
              {t.footer.terms}
            </Link>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">
              {t.footer.contact}
            </span>
            <span className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 cursor-pointer transition-colors">
              @JUGADAPLAY
            </span>
          </div>
          <p className="text-gray-700 text-xs tracking-wide">
            {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}