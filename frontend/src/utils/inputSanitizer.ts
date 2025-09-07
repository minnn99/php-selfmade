/**
 * Input sanitization utilities to prevent injection attacks
 */

// SQLインジェクション対策用の文字をエスケープ
export const escapeSqlChars = (input: string): string => {
  return input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    // eslint-disable-next-line no-control-regex
    .replace(/\x1a/g, '\\Z');
};

// HTMLタグを除去
export const stripHtmlTags = (input: string): string => {
  return input.replace(/<[^>]*>/g, '');
};

// 特殊文字をHTMLエンティティに変換
export const escapeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// 数値のみを許可
export const sanitizeNumeric = (input: string): string => {
  return input.replace(/[^\d]/g, '');
};

// 英数字とハイフン、スペースのみを許可（名前用）
export const sanitizeName = (input: string): string => {
  return input.replace(/[^\p{L}\p{N}\s-]/gu, '');
};

// メールアドレス形式の基本チェック
export const sanitizeEmail = (input: string): string => {
  return input.replace(/[^\w@.-]/g, '').toLowerCase();
};

// フォームデータ全体をサニタイズ
export const sanitizeFormData = (data: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case 'name':
      case 'furigana':
      case 'nickname':
        sanitized[key] = sanitizeName(value);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'phone':
        sanitized[key] = sanitizeNumeric(value);
        break;
      default:
        sanitized[key] = stripHtmlTags(value);
    }
  }
  
  return sanitized;
};