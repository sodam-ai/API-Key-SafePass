/** Calculate days until expiration. Negative = expired. */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt.split("T")[0]);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Get expiry status color */
export function expiryColor(days: number | null): string {
  if (days === null) return "text-zinc-600";
  if (days < 0) return "text-red-400";
  if (days <= 7) return "text-red-400";
  if (days <= 30) return "text-yellow-400";
  return "text-green-400";
}

/** Get expiry badge bg */
export function expiryBg(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return "bg-red-900/30 border-red-800";
  if (days <= 7) return "bg-red-900/20 border-red-900";
  if (days <= 30) return "bg-yellow-900/20 border-yellow-900";
  return "bg-green-900/20 border-green-900";
}

/** Format expiry text */
export function expiryText(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)}일 만료됨`;
  if (days === 0) return "오늘 만료";
  return `D-${days}`;
}

/** Format relative date */
export function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
}
