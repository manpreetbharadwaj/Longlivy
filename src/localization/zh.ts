import { PartialDictionary } from './types';

/** Simplified Chinese translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const zh: PartialDictionary = {
  common: {
    back: '返回',
    cancel: '取消',
    close: '关闭',
    confirm: '确认',
    continue: '继续',
    done: '完成',
    save: '保存',
    saveChanges: '保存更改',
    next: '下一步',
    skip: '跳过',
    retry: '重试',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    remove: '移除',
    ok: '好的',
    yes: '是',
    no: '否',
    loading: '加载中…',
  },
  errors: {
    generic: '出了点问题，请重试。',
    network: '无法连接到服务器，请检查网络连接后重试。',
    bad_request: '无法处理该请求。',
    unauthorized: '您的会话已过期，请重新登录。',
    forbidden: '您没有权限执行此操作。',
    not_found: '未找到您要查找的内容。',
    validation: '提供的部分信息无效。',
    server: '服务器端出现问题，请稍后重试。',
    cancelled: '请求已取消。',
    unknown: '发生了意外错误。',
  },
  validation: {
    required: '此字段为必填项。',
    fieldRequired: '{{field}}为必填项。',
    invalidEmail: '请输入有效的电子邮件地址。',
    passwordTooShort: '密码至少需要8个字符。',
    passwordsDontMatch: '两次输入的密码不一致。',
  },
  language: {
    selectTitle: '选择您的语言',
    selectSubtitle: '您可以稍后在设置中更改。',
    continueCta: '继续',
  },
  splash: {
    tagline: '断食 · 营养 · 活动 · 冥想',
  },
  onboarding: {
    stepProgress: '第 {{step}} 步，共 {{total}} 步',
    welcome: {
      tagline: '您的健康，和谐共生。',
      begin: '开始',
    },
  },
};
