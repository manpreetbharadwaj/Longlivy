import { PartialDictionary } from './types';

/** Portuguese (European) translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const pt: PartialDictionary = {
  common: {
    back: 'Voltar',
    cancel: 'Cancelar',
    close: 'Fechar',
    confirm: 'Confirmar',
    continue: 'Continuar',
    done: 'Concluído',
    save: 'Guardar',
    saveChanges: 'Guardar alterações',
    next: 'Seguinte',
    skip: 'Saltar',
    retry: 'Tentar novamente',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Adicionar',
    remove: 'Remover',
    ok: 'OK',
    yes: 'Sim',
    no: 'Não',
    loading: 'A carregar…',
  },
  errors: {
    generic: 'Ocorreu um erro. Tenta novamente.',
    network: 'Não foi possível contactar o servidor. Verifica a tua ligação e tenta novamente.',
    bad_request: 'Não foi possível processar o pedido.',
    unauthorized: 'A tua sessão expirou. Inicia sessão novamente.',
    forbidden: 'Não tens permissão para fazer isso.',
    not_found: 'Não encontrámos o que procuravas.',
    validation: 'Algumas informações fornecidas não são válidas.',
    server: 'Ocorreu um erro do nosso lado. Tenta novamente em breve.',
    cancelled: 'O pedido foi cancelado.',
    unknown: 'Ocorreu um erro inesperado.',
  },
  validation: {
    required: 'Este campo é obrigatório.',
    fieldRequired: '{{field}} é obrigatório.',
    invalidEmail: 'Introduz um endereço de email válido.',
    passwordTooShort: 'A palavra-passe deve ter pelo menos 8 caracteres.',
    passwordsDontMatch: 'As palavras-passe não coincidem.',
  },
  language: {
    selectTitle: 'Escolhe o teu idioma',
    selectSubtitle: 'Podes alterar isto mais tarde nas Definições.',
    continueCta: 'Continuar',
  },
  splash: {
    tagline: 'Jejum · Nutrição · Atividade · Meditação',
  },
  onboarding: {
    stepProgress: 'Passo {{step}} de {{total}}',
    welcome: {
      tagline: 'A tua saúde, em perfeita harmonia.',
      begin: 'Começar',
    },
  },
};
