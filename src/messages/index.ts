import es from "./es";
import ptBR from "./pt-BR";

export type Locale = "pt-BR" | "es";

export const translations = {
  "pt-BR": ptBR,
  es,
} as const;