// === Korean consonant (초성) search ===

const CHOSUNG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getChosung(char: string): string {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return char;
  return CHOSUNG[Math.floor((code - 0xAC00) / 588)];
}

function getChosungString(str: string): string {
  return [...str].map(getChosung).join("");
}

function isChosung(char: string): boolean {
  return CHOSUNG.includes(char);
}

function isAllChosung(str: string): boolean {
  return [...str].every((c) => isChosung(c));
}

/** 한국어/영문/초성/부분 매치 검색 */
export function smartMatch(text: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();

  // 일반 포함 검색
  if (t.includes(q)) return true;

  // 초성 검색
  if (isAllChosung(q)) {
    if (getChosungString(t).includes(q)) return true;
  }

  return false;
}

/** 여러 필드에서 한국어/초성/부분 매치 검색 */
export function smartMatchAny(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query.trim()) return true;
  return fields.some((f) => f && smartMatch(f, query));
}
