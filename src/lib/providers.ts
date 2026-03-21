export interface ProviderPreset {
  name: string;
  envVarName: string;
  serviceUrl: string;
  keyPrefix?: string; // for auto-detection
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: "OpenAI",
    envVarName: "OPENAI_API_KEY",
    serviceUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
  },
  {
    name: "Anthropic",
    envVarName: "ANTHROPIC_API_KEY",
    serviceUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-",
  },
  {
    name: "Google AI",
    envVarName: "GOOGLE_API_KEY",
    serviceUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AIza",
  },
  {
    name: "Gemini",
    envVarName: "GEMINI_API_KEY",
    serviceUrl: "https://aistudio.google.com/apikey",
  },
  {
    name: "Groq",
    envVarName: "GROQ_API_KEY",
    serviceUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
  },
  {
    name: "Mistral",
    envVarName: "MISTRAL_API_KEY",
    serviceUrl: "https://console.mistral.ai/api-keys",
  },
  {
    name: "Cohere",
    envVarName: "COHERE_API_KEY",
    serviceUrl: "https://dashboard.cohere.com/api-keys",
  },
  {
    name: "Perplexity",
    envVarName: "PERPLEXITY_API_KEY",
    serviceUrl: "https://www.perplexity.ai/settings/api",
    keyPrefix: "pplx-",
  },
  {
    name: "Replicate",
    envVarName: "REPLICATE_API_TOKEN",
    serviceUrl: "https://replicate.com/account/api-tokens",
    keyPrefix: "r8_",
  },
  {
    name: "HuggingFace",
    envVarName: "HUGGINGFACE_API_KEY",
    serviceUrl: "https://huggingface.co/settings/tokens",
    keyPrefix: "hf_",
  },
  {
    name: "Supabase",
    envVarName: "SUPABASE_ANON_KEY",
    serviceUrl: "https://supabase.com/dashboard/project/_/settings/api",
    keyPrefix: "eyJ",
  },
  {
    name: "Firebase",
    envVarName: "FIREBASE_API_KEY",
    serviceUrl: "https://console.firebase.google.com/project/_/settings/general",
  },
  {
    name: "Stripe",
    envVarName: "STRIPE_SECRET_KEY",
    serviceUrl: "https://dashboard.stripe.com/apikeys",
    keyPrefix: "sk_",
  },
  {
    name: "AWS",
    envVarName: "AWS_ACCESS_KEY_ID",
    serviceUrl: "https://console.aws.amazon.com/iam/home#/security_credentials",
    keyPrefix: "AKIA",
  },
  {
    name: "Vercel",
    envVarName: "VERCEL_TOKEN",
    serviceUrl: "https://vercel.com/account/tokens",
  },
  {
    name: "GitHub",
    envVarName: "GITHUB_TOKEN",
    serviceUrl: "https://github.com/settings/tokens",
    keyPrefix: "ghp_",
  },
  {
    name: "Notion",
    envVarName: "NOTION_API_KEY",
    serviceUrl: "https://www.notion.so/my-integrations",
    keyPrefix: "ntn_",
  },
  {
    name: "Slack",
    envVarName: "SLACK_BOT_TOKEN",
    serviceUrl: "https://api.slack.com/apps",
    keyPrefix: "xoxb-",
  },
  {
    name: "SendGrid",
    envVarName: "SENDGRID_API_KEY",
    serviceUrl: "https://app.sendgrid.com/settings/api_keys",
    keyPrefix: "SG.",
  },
  {
    name: "Resend",
    envVarName: "RESEND_API_KEY",
    serviceUrl: "https://resend.com/api-keys",
    keyPrefix: "re_",
  },
];

/** Detect provider from key value prefix */
export function detectProvider(value: string): ProviderPreset | null {
  if (!value || value.length < 3) return null;

  // Check most specific prefixes first (longer prefixes take priority)
  const sorted = [...PROVIDER_PRESETS]
    .filter((p) => p.keyPrefix)
    .sort((a, b) => (b.keyPrefix!.length) - (a.keyPrefix!.length));

  for (const preset of sorted) {
    if (value.startsWith(preset.keyPrefix!)) {
      return preset;
    }
  }
  return null;
}
