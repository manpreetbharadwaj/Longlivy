import { PartialDictionary } from './types';

/** Bengali translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const bn: PartialDictionary = {
  common: {
    back: 'ফিরে যান',
    cancel: 'বাতিল করুন',
    close: 'বন্ধ করুন',
    confirm: 'নিশ্চিত করুন',
    continue: 'চালিয়ে যান',
    done: 'সম্পন্ন',
    save: 'সংরক্ষণ করুন',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    next: 'পরবর্তী',
    skip: 'বাদ দিন',
    retry: 'আবার চেষ্টা করুন',
    delete: 'মুছুন',
    edit: 'সম্পাদনা করুন',
    add: 'যোগ করুন',
    remove: 'সরান',
    ok: 'ঠিক আছে',
    yes: 'হ্যাঁ',
    no: 'না',
    loading: 'লোড হচ্ছে…',
  },
  errors: {
    generic: 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।',
    network: 'সার্ভারে পৌঁছানো যায়নি। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    bad_request: 'অনুরোধটি প্রক্রিয়া করা যায়নি।',
    unauthorized: 'আপনার সেশনের মেয়াদ শেষ হয়ে গেছে। আবার লগ ইন করুন।',
    forbidden: 'এটি করার অনুমতি আপনার নেই।',
    not_found: 'আপনি যা খুঁজছিলেন তা আমরা খুঁজে পাইনি।',
    validation: 'প্রদত্ত কিছু তথ্য অবৈধ।',
    server: 'আমাদের পক্ষ থেকে কিছু ভুল হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
    cancelled: 'অনুরোধটি বাতিল করা হয়েছে।',
    unknown: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
  },
  validation: {
    required: 'এই ক্ষেত্রটি আবশ্যক।',
    fieldRequired: '{{field}} আবশ্যক।',
    invalidEmail: 'একটি বৈধ ইমেল ঠিকানা লিখুন।',
    passwordTooShort: 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।',
    passwordsDontMatch: 'পাসওয়ার্ড মিলছে না।',
  },
  language: {
    selectTitle: 'আপনার ভাষা বেছে নিন',
    selectSubtitle: 'আপনি এটি পরে সেটিংসে পরিবর্তন করতে পারেন।',
    continueCta: 'চালিয়ে যান',
  },
  splash: {
    tagline: 'রোজা · পুষ্টি · কার্যকলাপ · ধ্যান',
  },
  onboarding: {
    stepProgress: 'ধাপ {{step}} / {{total}}',
    welcome: {
      tagline: 'আপনার স্বাস্থ্য, সুন্দর ভারসাম্যে।',
      begin: 'শুরু করুন',
    },
  },
};
