import { PartialDictionary } from './types';

/** Japanese translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const ja: PartialDictionary = {
  common: {
    back: '戻る',
    cancel: 'キャンセル',
    close: '閉じる',
    confirm: '確認',
    continue: '続ける',
    done: '完了',
    save: '保存',
    saveChanges: '変更を保存',
    next: '次へ',
    skip: 'スキップ',
    retry: '再試行',
    delete: '削除',
    edit: '編集',
    add: '追加',
    remove: '削除',
    ok: 'OK',
    yes: 'はい',
    no: 'いいえ',
    loading: '読み込み中…',
  },
  errors: {
    generic: '問題が発生しました。もう一度お試しください。',
    network: 'サーバーに接続できません。接続を確認して再試行してください。',
    bad_request: 'リクエストを処理できませんでした。',
    unauthorized: 'セッションの有効期限が切れました。再度ログインしてください。',
    forbidden: 'この操作を行う権限がありません。',
    not_found: 'お探しのものが見つかりませんでした。',
    validation: '入力された情報の一部が無効です。',
    server: 'サーバー側で問題が発生しました。しばらくしてから再試行してください。',
    cancelled: 'リクエストはキャンセルされました。',
    unknown: '予期しないエラーが発生しました。',
  },
  validation: {
    required: 'この項目は必須です。',
    fieldRequired: '{{field}}は必須です。',
    invalidEmail: '有効なメールアドレスを入力してください。',
    passwordTooShort: 'パスワードは8文字以上にしてください。',
    passwordsDontMatch: 'パスワードが一致しません。',
  },
  language: {
    selectTitle: '言語を選択',
    selectSubtitle: '後で設定から変更できます。',
    continueCta: '続ける',
  },
  splash: {
    tagline: '断食・栄養・アクティビティ・瞑想',
  },
  onboarding: {
    stepProgress: 'ステップ {{step}}/{{total}}',
    welcome: {
      tagline: 'あなたの健康、美しく整う。',
      begin: 'はじめる',
    },
  },
};
