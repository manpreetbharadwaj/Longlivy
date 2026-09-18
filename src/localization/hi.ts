import { PartialDictionary } from './types';

/** Hindi translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const hi: PartialDictionary = {
  common: {
    back: 'वापस',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    confirm: 'पुष्टि करें',
    continue: 'जारी रखें',
    done: 'हो गया',
    save: 'सहेजें',
    saveChanges: 'बदलाव सहेजें',
    next: 'अगला',
    skip: 'छोड़ें',
    retry: 'फिर कोशिश करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    add: 'जोड़ें',
    remove: 'हटाएं',
    ok: 'ठीक है',
    yes: 'हां',
    no: 'नहीं',
    loading: 'लोड हो रहा है…',
  },
  errors: {
    generic: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    network: 'सर्वर तक नहीं पहुंच सके। अपना कनेक्शन जांचें और फिर से कोशिश करें।',
    bad_request: 'अनुरोध संसाधित नहीं किया जा सका।',
    unauthorized: 'आपका सत्र समाप्त हो गया है। कृपया फिर से लॉग इन करें।',
    forbidden: 'आपको ऐसा करने की अनुमति नहीं है।',
    not_found: 'आप जो खोज रहे थे वह हमें नहीं मिला।',
    validation: 'दी गई कुछ जानकारी अमान्य है।',
    server: 'हमारी तरफ से कुछ गड़बड़ हो गई। कृपया थोड़ी देर में फिर कोशिश करें।',
    cancelled: 'अनुरोध रद्द कर दिया गया।',
    unknown: 'एक अप्रत्याशित त्रुटि हुई।',
  },
  validation: {
    required: 'यह फ़ील्ड आवश्यक है।',
    fieldRequired: '{{field}} आवश्यक है।',
    invalidEmail: 'एक मान्य ईमेल पता दर्ज करें।',
    passwordTooShort: 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए।',
    passwordsDontMatch: 'पासवर्ड मेल नहीं खाते।',
  },
  language: {
    selectTitle: 'अपनी भाषा चुनें',
    selectSubtitle: 'आप इसे बाद में सेटिंग्स में बदल सकते हैं।',
    continueCta: 'जारी रखें',
  },
  splash: {
    tagline: 'उपवास · पोषण · गतिविधि · ध्यान',
  },
  onboarding: {
    stepProgress: 'चरण {{step}} / {{total}}',
    welcome: {
      tagline: 'आपका स्वास्थ्य, सुंदर संतुलन में।',
      begin: 'शुरू करें',
    },
  },
};
