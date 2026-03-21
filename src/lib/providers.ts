export interface ProviderPreset {
  name: string;
  envVarName: string;
  serviceUrl: string;
  keyPrefix?: string;
  category: "ai" | "cloud" | "dev" | "payment" | "comm";
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // === AI 플랫폼 ===
  { name: "OpenAI", envVarName: "OPENAI_API_KEY", serviceUrl: "https://platform.openai.com/api-keys", keyPrefix: "sk-", category: "ai" },
  { name: "Anthropic", envVarName: "ANTHROPIC_API_KEY", serviceUrl: "https://console.anthropic.com/settings/keys", keyPrefix: "sk-ant-", category: "ai" },
  { name: "Google AI (Gemini)", envVarName: "GOOGLE_API_KEY", serviceUrl: "https://aistudio.google.com/apikey", keyPrefix: "AIza", category: "ai" },
  { name: "Google Vertex AI", envVarName: "GOOGLE_VERTEX_API_KEY", serviceUrl: "https://console.cloud.google.com/apis/credentials", category: "ai" },
  { name: "Groq", envVarName: "GROQ_API_KEY", serviceUrl: "https://console.groq.com/keys", keyPrefix: "gsk_", category: "ai" },
  { name: "Mistral AI", envVarName: "MISTRAL_API_KEY", serviceUrl: "https://console.mistral.ai/api-keys", category: "ai" },
  { name: "Cohere", envVarName: "COHERE_API_KEY", serviceUrl: "https://dashboard.cohere.com/api-keys", category: "ai" },
  { name: "Perplexity", envVarName: "PERPLEXITY_API_KEY", serviceUrl: "https://www.perplexity.ai/settings/api", keyPrefix: "pplx-", category: "ai" },
  { name: "Together AI", envVarName: "TOGETHER_API_KEY", serviceUrl: "https://api.together.xyz/settings/api-keys", category: "ai" },
  { name: "Fireworks AI", envVarName: "FIREWORKS_API_KEY", serviceUrl: "https://fireworks.ai/account/api-keys", category: "ai" },
  { name: "DeepSeek", envVarName: "DEEPSEEK_API_KEY", serviceUrl: "https://platform.deepseek.com/api_keys", category: "ai" },
  { name: "xAI (Grok)", envVarName: "XAI_API_KEY", serviceUrl: "https://console.x.ai/team/api-keys", keyPrefix: "xai-", category: "ai" },
  { name: "Replicate", envVarName: "REPLICATE_API_TOKEN", serviceUrl: "https://replicate.com/account/api-tokens", keyPrefix: "r8_", category: "ai" },
  { name: "HuggingFace", envVarName: "HUGGINGFACE_API_KEY", serviceUrl: "https://huggingface.co/settings/tokens", keyPrefix: "hf_", category: "ai" },
  { name: "Stability AI", envVarName: "STABILITY_API_KEY", serviceUrl: "https://platform.stability.ai/account/keys", keyPrefix: "sk-", category: "ai" },
  { name: "ElevenLabs", envVarName: "ELEVENLABS_API_KEY", serviceUrl: "https://elevenlabs.io/app/settings/api-keys", category: "ai" },
  { name: "AssemblyAI", envVarName: "ASSEMBLYAI_API_KEY", serviceUrl: "https://www.assemblyai.com/app/account", category: "ai" },
  { name: "Pinecone", envVarName: "PINECONE_API_KEY", serviceUrl: "https://app.pinecone.io/organizations/-/projects/-/keys", category: "ai" },
  { name: "Weaviate", envVarName: "WEAVIATE_API_KEY", serviceUrl: "https://console.weaviate.cloud/dashboard", category: "ai" },
  { name: "Voyage AI", envVarName: "VOYAGE_API_KEY", serviceUrl: "https://dash.voyageai.com/api-keys", category: "ai" },
  { name: "AI21 Labs", envVarName: "AI21_API_KEY", serviceUrl: "https://studio.ai21.com/account/api-key", category: "ai" },
  { name: "Cerebras", envVarName: "CEREBRAS_API_KEY", serviceUrl: "https://cloud.cerebras.ai/platform", category: "ai" },
  { name: "SambaNova", envVarName: "SAMBANOVA_API_KEY", serviceUrl: "https://cloud.sambanova.ai/apis", category: "ai" },
  { name: "Upstage", envVarName: "UPSTAGE_API_KEY", serviceUrl: "https://console.upstage.ai/api-keys", category: "ai" },
  { name: "Naver Clova", envVarName: "CLOVA_API_KEY", serviceUrl: "https://www.ncloud.com/product/aiService/clovaStudio", category: "ai" },
  { name: "Kakao (Karlo)", envVarName: "KAKAO_API_KEY", serviceUrl: "https://developers.kakao.com/console/app", category: "ai" },
  { name: "OpenRouter", envVarName: "OPENROUTER_API_KEY", serviceUrl: "https://openrouter.ai/keys", category: "ai" },
  { name: "Ollama", envVarName: "OLLAMA_API_KEY", serviceUrl: "https://ollama.com", category: "ai" },
  { name: "LM Studio", envVarName: "LMSTUDIO_API_KEY", serviceUrl: "https://lmstudio.ai", category: "ai" },
  { name: "Midjourney", envVarName: "MIDJOURNEY_API_KEY", serviceUrl: "https://www.midjourney.com/account", category: "ai" },
  { name: "RunwayML", envVarName: "RUNWAY_API_KEY", serviceUrl: "https://app.runwayml.com/settings", category: "ai" },
  { name: "Fal.ai", envVarName: "FAL_KEY", serviceUrl: "https://fal.ai/dashboard/keys", category: "ai" },

  // === 클라우드/인프라 ===
  { name: "AWS", envVarName: "AWS_ACCESS_KEY_ID", serviceUrl: "https://console.aws.amazon.com/iam/home#/security_credentials", keyPrefix: "AKIA", category: "cloud" },
  { name: "Google Cloud", envVarName: "GOOGLE_CLOUD_API_KEY", serviceUrl: "https://console.cloud.google.com/apis/credentials", category: "cloud" },
  { name: "Azure", envVarName: "AZURE_API_KEY", serviceUrl: "https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub", category: "cloud" },
  { name: "Vercel", envVarName: "VERCEL_TOKEN", serviceUrl: "https://vercel.com/account/tokens", category: "cloud" },
  { name: "Supabase", envVarName: "SUPABASE_ANON_KEY", serviceUrl: "https://supabase.com/dashboard/project/_/settings/api", keyPrefix: "eyJ", category: "cloud" },
  { name: "Firebase", envVarName: "FIREBASE_API_KEY", serviceUrl: "https://console.firebase.google.com/project/_/settings/general", category: "cloud" },
  { name: "Cloudflare", envVarName: "CLOUDFLARE_API_TOKEN", serviceUrl: "https://dash.cloudflare.com/profile/api-tokens", category: "cloud" },
  { name: "Netlify", envVarName: "NETLIFY_AUTH_TOKEN", serviceUrl: "https://app.netlify.com/user/applications#personal-access-tokens", category: "cloud" },
  { name: "Railway", envVarName: "RAILWAY_TOKEN", serviceUrl: "https://railway.app/account/tokens", category: "cloud" },
  { name: "Render", envVarName: "RENDER_API_KEY", serviceUrl: "https://dashboard.render.com/u/settings#api-keys", category: "cloud" },
  { name: "DigitalOcean", envVarName: "DIGITALOCEAN_TOKEN", serviceUrl: "https://cloud.digitalocean.com/account/api/tokens", category: "cloud" },
  { name: "Neon", envVarName: "DATABASE_URL", serviceUrl: "https://console.neon.tech", category: "cloud" },
  { name: "PlanetScale", envVarName: "DATABASE_URL", serviceUrl: "https://app.planetscale.com", category: "cloud" },
  { name: "Upstash", envVarName: "UPSTASH_REDIS_REST_TOKEN", serviceUrl: "https://console.upstash.com", category: "cloud" },
  { name: "MongoDB Atlas", envVarName: "MONGODB_URI", serviceUrl: "https://cloud.mongodb.com", category: "cloud" },

  // === 개발 도구 ===
  { name: "GitHub", envVarName: "GITHUB_TOKEN", serviceUrl: "https://github.com/settings/tokens", keyPrefix: "ghp_", category: "dev" },
  { name: "GitLab", envVarName: "GITLAB_TOKEN", serviceUrl: "https://gitlab.com/-/user_settings/personal_access_tokens", keyPrefix: "glpat-", category: "dev" },
  { name: "Notion", envVarName: "NOTION_API_KEY", serviceUrl: "https://www.notion.so/my-integrations", keyPrefix: "ntn_", category: "dev" },
  { name: "Sentry", envVarName: "SENTRY_DSN", serviceUrl: "https://sentry.io/settings/account/api/auth-tokens/", category: "dev" },
  { name: "Postman", envVarName: "POSTMAN_API_KEY", serviceUrl: "https://web.postman.co/settings/me/api-keys", category: "dev" },
  { name: "npm", envVarName: "NPM_TOKEN", serviceUrl: "https://www.npmjs.com/settings/~/tokens", category: "dev" },
  { name: "Docker Hub", envVarName: "DOCKER_TOKEN", serviceUrl: "https://hub.docker.com/settings/security", category: "dev" },
  { name: "Algolia", envVarName: "ALGOLIA_API_KEY", serviceUrl: "https://dashboard.algolia.com/account/api-keys", category: "dev" },

  // === 결제/비즈니스 ===
  { name: "Stripe", envVarName: "STRIPE_SECRET_KEY", serviceUrl: "https://dashboard.stripe.com/apikeys", keyPrefix: "sk_", category: "payment" },
  { name: "PayPal", envVarName: "PAYPAL_CLIENT_SECRET", serviceUrl: "https://developer.paypal.com/dashboard/applications", category: "payment" },
  { name: "Toss Payments", envVarName: "TOSS_SECRET_KEY", serviceUrl: "https://developers.tosspayments.com/my/api-keys", category: "payment" },

  // === 커뮤니케이션 ===
  { name: "Slack", envVarName: "SLACK_BOT_TOKEN", serviceUrl: "https://api.slack.com/apps", keyPrefix: "xoxb-", category: "comm" },
  { name: "Discord", envVarName: "DISCORD_BOT_TOKEN", serviceUrl: "https://discord.com/developers/applications", category: "comm" },
  { name: "Telegram", envVarName: "TELEGRAM_BOT_TOKEN", serviceUrl: "https://t.me/BotFather", category: "comm" },
  { name: "Twilio", envVarName: "TWILIO_AUTH_TOKEN", serviceUrl: "https://console.twilio.com", category: "comm" },
  { name: "SendGrid", envVarName: "SENDGRID_API_KEY", serviceUrl: "https://app.sendgrid.com/settings/api_keys", keyPrefix: "SG.", category: "comm" },
  { name: "Resend", envVarName: "RESEND_API_KEY", serviceUrl: "https://resend.com/api-keys", keyPrefix: "re_", category: "comm" },
  { name: "Mailgun", envVarName: "MAILGUN_API_KEY", serviceUrl: "https://app.mailgun.com/settings/api_security", category: "comm" },
];

const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI 플랫폼",
  cloud: "클라우드/인프라",
  dev: "개발 도구",
  payment: "결제",
  comm: "커뮤니케이션",
};

export function getProvidersByCategory() {
  const grouped = new Map<string, ProviderPreset[]>();
  for (const p of PROVIDER_PRESETS) {
    const list = grouped.get(p.category) || [];
    list.push(p);
    grouped.set(p.category, list);
  }
  return { grouped, labels: CATEGORY_LABELS };
}

/** Detect provider from key value prefix */
export function detectProvider(value: string): ProviderPreset | null {
  if (!value || value.length < 3) return null;
  const sorted = [...PROVIDER_PRESETS]
    .filter((p) => p.keyPrefix)
    .sort((a, b) => (b.keyPrefix!.length) - (a.keyPrefix!.length));
  for (const preset of sorted) {
    if (value.startsWith(preset.keyPrefix!)) return preset;
  }
  return null;
}
