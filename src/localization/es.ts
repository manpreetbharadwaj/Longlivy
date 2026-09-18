import { PartialDictionary } from './types';

/**
 * Spanish translations — partial by design (see `PartialDictionary`).
 * Covers the shared `common`/`errors`/`validation` namespaces plus the
 * first-launch language screen, splash tagline and Welcome screen, since
 * those are the surfaces a fresh install sees before any other screen.
 * Everything else falls back to English until translated.
 */
export const es: PartialDictionary = {
  common: {
    back: 'Atrás',
    cancel: 'Cancelar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    continue: 'Continuar',
    done: 'Hecho',
    save: 'Guardar',
    saveChanges: 'Guardar cambios',
    next: 'Siguiente',
    skip: 'Omitir',
    retry: 'Reintentar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    remove: 'Quitar',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    loading: 'Cargando…',
  },
  errors: {
    generic: 'Algo salió mal. Inténtalo de nuevo.',
    network: 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
    bad_request: 'No se pudo procesar la solicitud.',
    unauthorized: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
    forbidden: 'No tienes permiso para hacer eso.',
    not_found: 'No encontramos lo que buscabas.',
    validation: 'Parte de la información proporcionada no es válida.',
    server: 'Algo salió mal en nuestro servidor. Inténtalo de nuevo en unos minutos.',
    cancelled: 'Se canceló la solicitud.',
    unknown: 'Ocurrió un error inesperado.',
  },
  validation: {
    required: 'Este campo es obligatorio.',
    fieldRequired: '{{field}} es obligatorio.',
    invalidEmail: 'Introduce una dirección de correo válida.',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    passwordsDontMatch: 'Las contraseñas no coinciden.',
  },
  language: {
    selectTitle: 'Elige tu idioma',
    selectSubtitle: 'Puedes cambiarlo más tarde en Ajustes.',
    continueCta: 'Continuar',
  },
  splash: {
    tagline: 'Ayuno · Nutrición · Actividad · Meditación',
  },
  onboarding: {
    stepProgress: 'Paso {{step}} de {{total}}',
    welcome: {
      tagline: 'Tu salud, en perfecta armonía.',
      begin: 'Empezar',
    },
  },
};
