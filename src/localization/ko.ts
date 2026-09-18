import { PartialDictionary } from './types';

/** Korean translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const ko: PartialDictionary = {
  common: {
    back: '뒤로',
    cancel: '취소',
    close: '닫기',
    confirm: '확인',
    continue: '계속',
    done: '완료',
    save: '저장',
    saveChanges: '변경 사항 저장',
    next: '다음',
    skip: '건너뛰기',
    retry: '다시 시도',
    delete: '삭제',
    edit: '편집',
    add: '추가',
    remove: '제거',
    ok: '확인',
    yes: '예',
    no: '아니요',
    loading: '로딩 중…',
  },
  errors: {
    generic: '문제가 발생했습니다. 다시 시도해 주세요.',
    network: '서버에 연결할 수 없습니다. 연결 상태를 확인하고 다시 시도해 주세요.',
    bad_request: '요청을 처리할 수 없습니다.',
    unauthorized: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    forbidden: '이 작업을 수행할 권한이 없습니다.',
    not_found: '찾고 계신 내용을 찾을 수 없습니다.',
    validation: '입력하신 정보 중 일부가 유효하지 않습니다.',
    server: '서버 측에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    cancelled: '요청이 취소되었습니다.',
    unknown: '예기치 않은 오류가 발생했습니다.',
  },
  validation: {
    required: '이 항목은 필수입니다.',
    fieldRequired: '{{field}} 항목은 필수입니다.',
    invalidEmail: '유효한 이메일 주소를 입력해 주세요.',
    passwordTooShort: '비밀번호는 8자 이상이어야 합니다.',
    passwordsDontMatch: '비밀번호가 일치하지 않습니다.',
  },
  language: {
    selectTitle: '언어를 선택하세요',
    selectSubtitle: '나중에 설정에서 변경할 수 있습니다.',
    continueCta: '계속',
  },
  splash: {
    tagline: '단식 · 영양 · 활동 · 명상',
  },
  onboarding: {
    stepProgress: '{{total}}단계 중 {{step}}단계',
    welcome: {
      tagline: '당신의 건강, 아름답게 조화롭게.',
      begin: '시작하기',
    },
  },
};
