/** Provider-specific brand colors for visual distinction */
const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  OpenAI:     { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", dot: "#10b981" },
  Anthropic:  { bg: "bg-amber-950/30",   border: "border-amber-800/40",   text: "text-amber-400",   dot: "#f59e0b" },
  "Google AI":{ bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  Gemini:     { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  Groq:       { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  Mistral:    { bg: "bg-violet-950/30",  border: "border-violet-800/40",  text: "text-violet-400",  dot: "#8b5cf6" },
  Cohere:     { bg: "bg-pink-950/30",    border: "border-pink-800/40",    text: "text-pink-400",    dot: "#ec4899" },
  Perplexity: { bg: "bg-cyan-950/30",    border: "border-cyan-800/40",    text: "text-cyan-400",    dot: "#06b6d4" },
  Replicate:  { bg: "bg-rose-950/30",    border: "border-rose-800/40",    text: "text-rose-400",    dot: "#f43f5e" },
  HuggingFace:{ bg: "bg-yellow-950/30",  border: "border-yellow-800/40",  text: "text-yellow-400",  dot: "#eab308" },
  Supabase:   { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", dot: "#10b981" },
  Firebase:   { bg: "bg-amber-950/30",   border: "border-amber-800/40",   text: "text-amber-400",   dot: "#f59e0b" },
  Stripe:     { bg: "bg-indigo-950/30",  border: "border-indigo-800/40",  text: "text-indigo-400",  dot: "#6366f1" },
  AWS:        { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  Vercel:     { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  GitHub:     { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  Notion:     { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  Slack:      { bg: "bg-purple-950/30",  border: "border-purple-800/40",  text: "text-purple-400",  dot: "#a855f7" },
  SendGrid:   { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  Resend:     { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
};

const DEFAULT_COLOR = { bg: "bg-zinc-800/40", border: "border-zinc-700/50", text: "text-zinc-400", dot: "#71717a" };

export function getProviderColor(provider: string | null) {
  if (!provider) return DEFAULT_COLOR;
  return PROVIDER_COLORS[provider] || DEFAULT_COLOR;
}
