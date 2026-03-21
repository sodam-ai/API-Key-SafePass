/** Provider-specific brand colors for visual distinction */
const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  // AI
  OpenAI:          { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", dot: "#10b981" },
  Anthropic:       { bg: "bg-amber-950/30",   border: "border-amber-800/40",   text: "text-amber-400",   dot: "#f59e0b" },
  "Google AI (Gemini)": { bg: "bg-blue-950/30", border: "border-blue-800/40", text: "text-blue-400", dot: "#3b82f6" },
  "Google Vertex AI": { bg: "bg-blue-950/30", border: "border-blue-800/40", text: "text-blue-400", dot: "#3b82f6" },
  Groq:            { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  "Mistral AI":    { bg: "bg-violet-950/30",  border: "border-violet-800/40",  text: "text-violet-400",  dot: "#8b5cf6" },
  Cohere:          { bg: "bg-pink-950/30",    border: "border-pink-800/40",    text: "text-pink-400",    dot: "#ec4899" },
  Perplexity:      { bg: "bg-cyan-950/30",    border: "border-cyan-800/40",    text: "text-cyan-400",    dot: "#06b6d4" },
  "Together AI":   { bg: "bg-indigo-950/30",  border: "border-indigo-800/40",  text: "text-indigo-400",  dot: "#6366f1" },
  "Fireworks AI":  { bg: "bg-red-950/30",     border: "border-red-800/40",     text: "text-red-400",     dot: "#ef4444" },
  DeepSeek:        { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  "xAI (Grok)":    { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  Replicate:       { bg: "bg-rose-950/30",    border: "border-rose-800/40",    text: "text-rose-400",    dot: "#f43f5e" },
  HuggingFace:     { bg: "bg-yellow-950/30",  border: "border-yellow-800/40",  text: "text-yellow-400",  dot: "#eab308" },
  "Stability AI":  { bg: "bg-purple-950/30",  border: "border-purple-800/40",  text: "text-purple-400",  dot: "#a855f7" },
  ElevenLabs:      { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  AssemblyAI:      { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  Pinecone:        { bg: "bg-teal-950/30",    border: "border-teal-800/40",    text: "text-teal-400",    dot: "#14b8a6" },
  OpenRouter:      { bg: "bg-violet-950/30",  border: "border-violet-800/40",  text: "text-violet-400",  dot: "#8b5cf6" },
  "AI21 Labs":     { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  Cerebras:        { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  "Naver Clova":   { bg: "bg-green-950/30",   border: "border-green-800/40",   text: "text-green-400",   dot: "#22c55e" },
  "Kakao (Karlo)": { bg: "bg-yellow-950/30",  border: "border-yellow-800/40",  text: "text-yellow-400",  dot: "#eab308" },
  "Fal.ai":        { bg: "bg-purple-950/30",  border: "border-purple-800/40",  text: "text-purple-400",  dot: "#a855f7" },
  RunwayML:        { bg: "bg-cyan-950/30",    border: "border-cyan-800/40",    text: "text-cyan-400",    dot: "#06b6d4" },
  Midjourney:      { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  "Voyage AI":     { bg: "bg-teal-950/30",    border: "border-teal-800/40",    text: "text-teal-400",    dot: "#14b8a6" },
  // Cloud
  AWS:             { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  "Google Cloud":  { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  Azure:           { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  Vercel:          { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  Supabase:        { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", dot: "#10b981" },
  Firebase:        { bg: "bg-amber-950/30",   border: "border-amber-800/40",   text: "text-amber-400",   dot: "#f59e0b" },
  Cloudflare:      { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  Neon:            { bg: "bg-green-950/30",   border: "border-green-800/40",   text: "text-green-400",   dot: "#22c55e" },
  Upstash:         { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", dot: "#10b981" },
  // Dev
  GitHub:          { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  GitLab:          { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  dot: "#f97316" },
  Notion:          { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
  // Payment
  Stripe:          { bg: "bg-indigo-950/30",  border: "border-indigo-800/40",  text: "text-indigo-400",  dot: "#6366f1" },
  "Toss Payments": { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    dot: "#3b82f6" },
  // Comm
  Slack:           { bg: "bg-purple-950/30",  border: "border-purple-800/40",  text: "text-purple-400",  dot: "#a855f7" },
  Discord:         { bg: "bg-indigo-950/30",  border: "border-indigo-800/40",  text: "text-indigo-400",  dot: "#6366f1" },
  Telegram:        { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  SendGrid:        { bg: "bg-sky-950/30",     border: "border-sky-800/40",     text: "text-sky-400",     dot: "#0ea5e9" },
  Resend:          { bg: "bg-zinc-800/50",    border: "border-zinc-700/60",    text: "text-zinc-300",    dot: "#a1a1aa" },
};

const DEFAULT_COLOR = { bg: "bg-zinc-800/40", border: "border-zinc-700/50", text: "text-zinc-400", dot: "#71717a" };

export function getProviderColor(provider: string | null) {
  if (!provider) return DEFAULT_COLOR;
  return PROVIDER_COLORS[provider] || DEFAULT_COLOR;
}
