export interface ProviderPreset {
  name: string;
  nameKo: string; // Korean name for search
  envVarName: string;
  serviceUrl: string;
  keyPrefix?: string;
  category: "ai" | "cloud" | "dev" | "payment" | "comm";
  isCustom?: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // === AI 플랫폼 ===
  { name: "OpenAI", nameKo: "오픈에이아이", envVarName: "OPENAI_API_KEY", serviceUrl: "https://platform.openai.com/api-keys", keyPrefix: "sk-", category: "ai" },
  { name: "Anthropic", nameKo: "앤스로픽 클로드", envVarName: "ANTHROPIC_API_KEY", serviceUrl: "https://console.anthropic.com/settings/keys", keyPrefix: "sk-ant-", category: "ai" },
  { name: "Google AI (Gemini)", nameKo: "구글 제미나이", envVarName: "GOOGLE_API_KEY", serviceUrl: "https://aistudio.google.com/apikey", keyPrefix: "AIza", category: "ai" },
  { name: "Google Vertex AI", nameKo: "구글 버텍스", envVarName: "GOOGLE_VERTEX_API_KEY", serviceUrl: "https://console.cloud.google.com/apis/credentials", category: "ai" },
  { name: "Groq", nameKo: "그록 추론", envVarName: "GROQ_API_KEY", serviceUrl: "https://console.groq.com/keys", keyPrefix: "gsk_", category: "ai" },
  { name: "Mistral AI", nameKo: "미스트랄", envVarName: "MISTRAL_API_KEY", serviceUrl: "https://console.mistral.ai/api-keys", category: "ai" },
  { name: "Cohere", nameKo: "코히어", envVarName: "COHERE_API_KEY", serviceUrl: "https://dashboard.cohere.com/api-keys", category: "ai" },
  { name: "Perplexity", nameKo: "퍼플렉시티", envVarName: "PERPLEXITY_API_KEY", serviceUrl: "https://www.perplexity.ai/settings/api", keyPrefix: "pplx-", category: "ai" },
  { name: "Together AI", nameKo: "투게더", envVarName: "TOGETHER_API_KEY", serviceUrl: "https://api.together.xyz/settings/api-keys", category: "ai" },
  { name: "Fireworks AI", nameKo: "파이어웍스", envVarName: "FIREWORKS_API_KEY", serviceUrl: "https://fireworks.ai/account/api-keys", category: "ai" },
  { name: "DeepSeek", nameKo: "딥시크", envVarName: "DEEPSEEK_API_KEY", serviceUrl: "https://platform.deepseek.com/api_keys", category: "ai" },
  { name: "xAI (Grok)", nameKo: "엑스에이아이 그록", envVarName: "XAI_API_KEY", serviceUrl: "https://console.x.ai/team/api-keys", keyPrefix: "xai-", category: "ai" },
  { name: "Replicate", nameKo: "레플리케이트", envVarName: "REPLICATE_API_TOKEN", serviceUrl: "https://replicate.com/account/api-tokens", keyPrefix: "r8_", category: "ai" },
  { name: "HuggingFace", nameKo: "허깅페이스", envVarName: "HUGGINGFACE_API_KEY", serviceUrl: "https://huggingface.co/settings/tokens", keyPrefix: "hf_", category: "ai" },
  { name: "Stability AI", nameKo: "스태빌리티", envVarName: "STABILITY_API_KEY", serviceUrl: "https://platform.stability.ai/account/keys", category: "ai" },
  { name: "ElevenLabs", nameKo: "일레븐랩스 음성", envVarName: "ELEVENLABS_API_KEY", serviceUrl: "https://elevenlabs.io/app/settings/api-keys", category: "ai" },
  { name: "AssemblyAI", nameKo: "어셈블리 음성인식", envVarName: "ASSEMBLYAI_API_KEY", serviceUrl: "https://www.assemblyai.com/app/account", category: "ai" },
  { name: "Pinecone", nameKo: "파인콘 벡터", envVarName: "PINECONE_API_KEY", serviceUrl: "https://app.pinecone.io/organizations/-/projects/-/keys", category: "ai" },
  { name: "Weaviate", nameKo: "위비에이트 벡터", envVarName: "WEAVIATE_API_KEY", serviceUrl: "https://console.weaviate.cloud/dashboard", category: "ai" },
  { name: "Voyage AI", nameKo: "보야지 임베딩", envVarName: "VOYAGE_API_KEY", serviceUrl: "https://dash.voyageai.com/api-keys", category: "ai" },
  { name: "AI21 Labs", nameKo: "에이아이21", envVarName: "AI21_API_KEY", serviceUrl: "https://studio.ai21.com/account/api-key", category: "ai" },
  { name: "Cerebras", nameKo: "세레브라스", envVarName: "CEREBRAS_API_KEY", serviceUrl: "https://cloud.cerebras.ai/platform", category: "ai" },
  { name: "SambaNova", nameKo: "삼바노바", envVarName: "SAMBANOVA_API_KEY", serviceUrl: "https://cloud.sambanova.ai/apis", category: "ai" },
  { name: "Upstage", nameKo: "업스테이지 솔라", envVarName: "UPSTAGE_API_KEY", serviceUrl: "https://console.upstage.ai/api-keys", category: "ai" },
  { name: "Naver Clova", nameKo: "네이버 클로바", envVarName: "CLOVA_API_KEY", serviceUrl: "https://www.ncloud.com/product/aiService/clovaStudio", category: "ai" },
  { name: "Kakao (Karlo)", nameKo: "카카오 칼로", envVarName: "KAKAO_API_KEY", serviceUrl: "https://developers.kakao.com/console/app", category: "ai" },
  { name: "OpenRouter", nameKo: "오픈라우터", envVarName: "OPENROUTER_API_KEY", serviceUrl: "https://openrouter.ai/keys", category: "ai" },
  { name: "Ollama", nameKo: "올라마 로컬", envVarName: "OLLAMA_API_KEY", serviceUrl: "https://ollama.com", category: "ai" },
  { name: "LM Studio", nameKo: "엘엠스튜디오 로컬", envVarName: "LMSTUDIO_API_KEY", serviceUrl: "https://lmstudio.ai", category: "ai" },
  { name: "Midjourney", nameKo: "미드저니 이미지", envVarName: "MIDJOURNEY_API_KEY", serviceUrl: "https://www.midjourney.com/account", category: "ai" },
  { name: "RunwayML", nameKo: "런웨이 영상", envVarName: "RUNWAY_API_KEY", serviceUrl: "https://app.runwayml.com/settings", category: "ai" },
  { name: "Fal.ai", nameKo: "팔에이아이 이미지", envVarName: "FAL_KEY", serviceUrl: "https://fal.ai/dashboard/keys", category: "ai" },
  { name: "DALL-E (OpenAI)", nameKo: "달리 이미지 생성", envVarName: "OPENAI_API_KEY", serviceUrl: "https://platform.openai.com/api-keys", category: "ai" },
  { name: "Whisper (OpenAI)", nameKo: "위스퍼 음성인식", envVarName: "OPENAI_API_KEY", serviceUrl: "https://platform.openai.com/api-keys", category: "ai" },
  { name: "Claude (Anthropic)", nameKo: "클로드", envVarName: "ANTHROPIC_API_KEY", serviceUrl: "https://console.anthropic.com/settings/keys", category: "ai" },
  { name: "GPT (OpenAI)", nameKo: "지피티 챗봇", envVarName: "OPENAI_API_KEY", serviceUrl: "https://platform.openai.com/api-keys", category: "ai" },
  { name: "Llama (Meta)", nameKo: "라마 메타", envVarName: "META_API_KEY", serviceUrl: "https://ai.meta.com", category: "ai" },
  { name: "Suno AI", nameKo: "수노 음악 생성", envVarName: "SUNO_API_KEY", serviceUrl: "https://suno.com", category: "ai" },
  { name: "Udio", nameKo: "유디오 음악", envVarName: "UDIO_API_KEY", serviceUrl: "https://www.udio.com", category: "ai" },
  { name: "Ideogram", nameKo: "아이디오그램 이미지", envVarName: "IDEOGRAM_API_KEY", serviceUrl: "https://ideogram.ai/manage-api", category: "ai" },
  { name: "Leonardo AI", nameKo: "레오나르도 이미지", envVarName: "LEONARDO_API_KEY", serviceUrl: "https://app.leonardo.ai/api", category: "ai" },
  { name: "Cursor", nameKo: "커서 코딩", envVarName: "CURSOR_API_KEY", serviceUrl: "https://cursor.sh", category: "ai" },
  { name: "Copilot (GitHub)", nameKo: "코파일럿 코딩", envVarName: "GITHUB_TOKEN", serviceUrl: "https://github.com/settings/copilot", category: "ai" },
  { name: "Tavily", nameKo: "타빌리 검색", envVarName: "TAVILY_API_KEY", serviceUrl: "https://tavily.com", category: "ai" },
  { name: "Exa", nameKo: "엑사 검색", envVarName: "EXA_API_KEY", serviceUrl: "https://exa.ai", category: "ai" },
  { name: "Serper", nameKo: "서퍼 구글검색", envVarName: "SERPER_API_KEY", serviceUrl: "https://serper.dev", category: "ai" },
  { name: "Recraft AI", nameKo: "리크래프트 디자인", envVarName: "RECRAFT_API_KEY", serviceUrl: "https://www.recraft.ai", category: "ai" },
  { name: "Flux (Black Forest)", nameKo: "플럭스 이미지", envVarName: "BFL_API_KEY", serviceUrl: "https://api.bfl.ml", category: "ai" },
  { name: "Luma AI", nameKo: "루마 3D 영상", envVarName: "LUMA_API_KEY", serviceUrl: "https://lumalabs.ai", category: "ai" },
  { name: "Pika", nameKo: "피카 영상생성", envVarName: "PIKA_API_KEY", serviceUrl: "https://pika.art", category: "ai" },
  { name: "Heygen", nameKo: "헤이젠 아바타 영상", envVarName: "HEYGEN_API_KEY", serviceUrl: "https://app.heygen.com/settings", category: "ai" },
  { name: "D-ID", nameKo: "디아이디 아바타", envVarName: "DID_API_KEY", serviceUrl: "https://studio.d-id.com", category: "ai" },
  { name: "Synthesia", nameKo: "신세시아 영상", envVarName: "SYNTHESIA_API_KEY", serviceUrl: "https://www.synthesia.io", category: "ai" },
  { name: "Typecast", nameKo: "타입캐스트 음성", envVarName: "TYPECAST_API_KEY", serviceUrl: "https://typecast.ai", category: "ai" },
  { name: "Clova Speech", nameKo: "클로바 스피치 STT", envVarName: "CLOVA_SPEECH_KEY", serviceUrl: "https://www.ncloud.com/product/aiService/clovaSpeech", category: "ai" },
  { name: "VLLO", nameKo: "블로 영상편집", envVarName: "VLLO_API_KEY", serviceUrl: "https://www.vllo.io", category: "ai" },
  { name: "Kling AI", nameKo: "클링 영상생성", envVarName: "KLING_API_KEY", serviceUrl: "https://klingai.com", category: "ai" },
  { name: "Minimax", nameKo: "미니맥스 하이라오", envVarName: "MINIMAX_API_KEY", serviceUrl: "https://www.minimaxi.com", category: "ai" },
  { name: "Zhipu AI (GLM)", nameKo: "지푸 GLM 중국", envVarName: "ZHIPU_API_KEY", serviceUrl: "https://open.bigmodel.cn", category: "ai" },
  { name: "Baidu (Ernie)", nameKo: "바이두 어니 중국", envVarName: "BAIDU_API_KEY", serviceUrl: "https://cloud.baidu.com", category: "ai" },
  { name: "Alibaba (Qwen)", nameKo: "알리바바 큐웬 중국", envVarName: "DASHSCOPE_API_KEY", serviceUrl: "https://dashscope.aliyun.com", category: "ai" },
  { name: "Coze", nameKo: "코즈 챗봇빌더", envVarName: "COZE_API_KEY", serviceUrl: "https://www.coze.com", category: "ai" },
  { name: "Dify", nameKo: "디파이 AI앱빌더", envVarName: "DIFY_API_KEY", serviceUrl: "https://cloud.dify.ai", category: "ai" },
  { name: "LangSmith", nameKo: "랭스미스 모니터링", envVarName: "LANGSMITH_API_KEY", serviceUrl: "https://smith.langchain.com", category: "ai" },
  { name: "Weights & Biases", nameKo: "원드비 실험추적", envVarName: "WANDB_API_KEY", serviceUrl: "https://wandb.ai/settings", category: "ai" },

  // === 클라우드/인프라 ===
  { name: "AWS", nameKo: "아마존 웹서비스", envVarName: "AWS_ACCESS_KEY_ID", serviceUrl: "https://console.aws.amazon.com/iam/home#/security_credentials", keyPrefix: "AKIA", category: "cloud" },
  { name: "Google Cloud", nameKo: "구글 클라우드", envVarName: "GOOGLE_CLOUD_API_KEY", serviceUrl: "https://console.cloud.google.com/apis/credentials", category: "cloud" },
  { name: "Azure", nameKo: "애저 마이크로소프트", envVarName: "AZURE_API_KEY", serviceUrl: "https://portal.azure.com", category: "cloud" },
  { name: "Vercel", nameKo: "버셀 배포", envVarName: "VERCEL_TOKEN", serviceUrl: "https://vercel.com/account/tokens", category: "cloud" },
  { name: "Supabase", nameKo: "수파베이스 데이터베이스", envVarName: "SUPABASE_ANON_KEY", serviceUrl: "https://supabase.com/dashboard/project/_/settings/api", keyPrefix: "eyJ", category: "cloud" },
  { name: "Firebase", nameKo: "파이어베이스 구글", envVarName: "FIREBASE_API_KEY", serviceUrl: "https://console.firebase.google.com", category: "cloud" },
  { name: "Cloudflare", nameKo: "클라우드플레어", envVarName: "CLOUDFLARE_API_TOKEN", serviceUrl: "https://dash.cloudflare.com/profile/api-tokens", category: "cloud" },
  { name: "Netlify", nameKo: "넷틀리파이 배포", envVarName: "NETLIFY_AUTH_TOKEN", serviceUrl: "https://app.netlify.com/user/applications", category: "cloud" },
  { name: "Railway", nameKo: "레일웨이 배포", envVarName: "RAILWAY_TOKEN", serviceUrl: "https://railway.app/account/tokens", category: "cloud" },
  { name: "Render", nameKo: "렌더 배포", envVarName: "RENDER_API_KEY", serviceUrl: "https://dashboard.render.com/u/settings", category: "cloud" },
  { name: "DigitalOcean", nameKo: "디지털오션", envVarName: "DIGITALOCEAN_TOKEN", serviceUrl: "https://cloud.digitalocean.com/account/api/tokens", category: "cloud" },
  { name: "Neon", nameKo: "네온 포스트그레스", envVarName: "DATABASE_URL", serviceUrl: "https://console.neon.tech", category: "cloud" },
  { name: "PlanetScale", nameKo: "플래닛스케일 MySQL", envVarName: "DATABASE_URL", serviceUrl: "https://app.planetscale.com", category: "cloud" },
  { name: "Upstash", nameKo: "업스태시 레디스", envVarName: "UPSTASH_REDIS_REST_TOKEN", serviceUrl: "https://console.upstash.com", category: "cloud" },
  { name: "MongoDB Atlas", nameKo: "몽고디비", envVarName: "MONGODB_URI", serviceUrl: "https://cloud.mongodb.com", category: "cloud" },
  { name: "Heroku", nameKo: "헤로쿠 배포", envVarName: "HEROKU_API_KEY", serviceUrl: "https://dashboard.heroku.com/account", category: "cloud" },
  { name: "Fly.io", nameKo: "플라이 배포", envVarName: "FLY_API_TOKEN", serviceUrl: "https://fly.io/user/personal_access_tokens", category: "cloud" },

  // === 개발 도구 ===
  { name: "GitHub", nameKo: "깃허브", envVarName: "GITHUB_TOKEN", serviceUrl: "https://github.com/settings/tokens", keyPrefix: "ghp_", category: "dev" },
  { name: "GitLab", nameKo: "깃랩", envVarName: "GITLAB_TOKEN", serviceUrl: "https://gitlab.com/-/user_settings/personal_access_tokens", keyPrefix: "glpat-", category: "dev" },
  { name: "Notion", nameKo: "노션", envVarName: "NOTION_API_KEY", serviceUrl: "https://www.notion.so/my-integrations", keyPrefix: "ntn_", category: "dev" },
  { name: "Sentry", nameKo: "센트리 에러추적", envVarName: "SENTRY_DSN", serviceUrl: "https://sentry.io/settings/account/api/auth-tokens/", category: "dev" },
  { name: "Postman", nameKo: "포스트맨 API테스트", envVarName: "POSTMAN_API_KEY", serviceUrl: "https://web.postman.co/settings/me/api-keys", category: "dev" },
  { name: "npm", nameKo: "엔피엠 패키지", envVarName: "NPM_TOKEN", serviceUrl: "https://www.npmjs.com/settings/~/tokens", category: "dev" },
  { name: "Docker Hub", nameKo: "도커 허브", envVarName: "DOCKER_TOKEN", serviceUrl: "https://hub.docker.com/settings/security", category: "dev" },
  { name: "Algolia", nameKo: "알골리아 검색", envVarName: "ALGOLIA_API_KEY", serviceUrl: "https://dashboard.algolia.com/account/api-keys", category: "dev" },
  { name: "Airtable", nameKo: "에어테이블", envVarName: "AIRTABLE_API_KEY", serviceUrl: "https://airtable.com/create/tokens", category: "dev" },
  { name: "Linear", nameKo: "리니어 이슈", envVarName: "LINEAR_API_KEY", serviceUrl: "https://linear.app/settings/api", category: "dev" },

  // === 결제/비즈니스 ===
  { name: "Stripe", nameKo: "스트라이프 결제", envVarName: "STRIPE_SECRET_KEY", serviceUrl: "https://dashboard.stripe.com/apikeys", keyPrefix: "sk_", category: "payment" },
  { name: "PayPal", nameKo: "페이팔 결제", envVarName: "PAYPAL_CLIENT_SECRET", serviceUrl: "https://developer.paypal.com/dashboard/applications", category: "payment" },
  { name: "Toss Payments", nameKo: "토스 페이먼츠 결제", envVarName: "TOSS_SECRET_KEY", serviceUrl: "https://developers.tosspayments.com/my/api-keys", category: "payment" },
  { name: "Iamport (PortOne)", nameKo: "아임포트 포트원 결제", envVarName: "IAMPORT_API_KEY", serviceUrl: "https://admin.portone.io", category: "payment" },

  // === 커뮤니케이션 ===
  { name: "Slack", nameKo: "슬랙 메신저", envVarName: "SLACK_BOT_TOKEN", serviceUrl: "https://api.slack.com/apps", keyPrefix: "xoxb-", category: "comm" },
  { name: "Discord", nameKo: "디스코드 봇", envVarName: "DISCORD_BOT_TOKEN", serviceUrl: "https://discord.com/developers/applications", category: "comm" },
  { name: "Telegram", nameKo: "텔레그램 봇", envVarName: "TELEGRAM_BOT_TOKEN", serviceUrl: "https://t.me/BotFather", category: "comm" },
  { name: "Twilio", nameKo: "트윌리오 문자 전화", envVarName: "TWILIO_AUTH_TOKEN", serviceUrl: "https://console.twilio.com", category: "comm" },
  { name: "SendGrid", nameKo: "센드그리드 이메일", envVarName: "SENDGRID_API_KEY", serviceUrl: "https://app.sendgrid.com/settings/api_keys", keyPrefix: "SG.", category: "comm" },
  { name: "Resend", nameKo: "리센드 이메일", envVarName: "RESEND_API_KEY", serviceUrl: "https://resend.com/api-keys", keyPrefix: "re_", category: "comm" },
  { name: "Mailgun", nameKo: "메일건 이메일", envVarName: "MAILGUN_API_KEY", serviceUrl: "https://app.mailgun.com/settings/api_security", category: "comm" },
  { name: "KakaoTalk", nameKo: "카카오톡 알림톡", envVarName: "KAKAO_API_KEY", serviceUrl: "https://developers.kakao.com/console/app", category: "comm" },
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

/** Smart search: English name, Korean name, 초성, partial match */
export function matchProvider(preset: ProviderPreset, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();

  // English name match
  if (preset.name.toLowerCase().includes(q)) return true;
  // Korean name match
  if (preset.nameKo.includes(q)) return true;
  // Env var name match
  if (preset.envVarName.toLowerCase().includes(q)) return true;

  // 초성 search
  if (isAllChosung(q)) {
    const nameChosung = getChosungString(preset.nameKo);
    if (nameChosung.includes(q)) return true;
  }

  // Partial Korean syllable match (incomplete typing)
  // e.g., "오픈" matches "오픈에이아이"
  if (preset.nameKo.startsWith(q)) return true;

  return false;
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
