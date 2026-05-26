// messages/index.ts
import ptBR from './pt-BR';
import es from './es';

export const translations = {
  'pt-BR': ptBR,
  'es': es
};

export type Locale = 'pt-BR' | 'es';