import type { RuntimeConfig } from "../types/runtimeConfig";

export const defaultRuntimeConfig: RuntimeConfig = {
  version: 1,
  agent: {
    agent_name: "Jarvis",
    tone: "casual_jarvis",
    timezone: "Asia/Kolkata",
    output_language: "english_with_optional_tamil",
    max_items_per_topic: 5,
    enable_voice: false,
    voice_provider: "none",
    storage_provider: "supabase",
    min_confidence_to_send: "medium"
  },
  topics: {
    tech_ai: {
      name: "Technologies and AI",
      priority: 100,
      keywords: ["ai", "artificial intelligence", "generative ai", "llm", "openai", "google ai", "meta ai", "microsoft ai", "startup", "python", "software", "security", "chip"],
      excluded_keywords: ["sports", "horoscope"],
      source_groups: ["tech_ai", "official_ai", "community_tech"],
      max_items: 5,
      alert_threshold: 80
    },
    tn_politics: {
      name: "Tamil Nadu Politics",
      priority: 95,
      keywords: ["tamil nadu", "chennai", "dmk", "aiadmk", "tn government", "mk stalin", "assembly", "election", "governor", "budget"],
      excluded_keywords: ["cinema", "box office", "cricket"],
      source_groups: ["tn_government", "india_government", "indian_news"],
      max_items: 5,
      alert_threshold: 80
    },
    india_politics: {
      name: "India Politics",
      priority: 90,
      keywords: ["india", "parliament", "lok sabha", "rajya sabha", "prime minister", "cabinet", "ministry", "election commission", "supreme court", "pib", "mygov"],
      excluded_keywords: ["celebrity", "box office", "cricket"],
      source_groups: ["india_government", "indian_news"],
      max_items: 5,
      alert_threshold: 80
    },
    movies_series: {
      name: "Movie and Series Updates",
      priority: 70,
      keywords: ["movie", "film", "series", "streaming", "trailer", "netflix", "prime video", "disney", "ott", "tamil cinema", "kollywood", "release date"],
      excluded_keywords: ["piracy", "leaked", "torrent", "camrip"],
      source_groups: ["entertainment", "official_trailers"],
      max_items: 5,
      alert_threshold: 70
    }
  },
  sources: [
    { id: "openai_blog", name: "OpenAI News", type: "rss", url: "https://openai.com/news/rss.xml", topic_ids: ["tech_ai"], trust_tier: "official", enabled: true, language: "en", source_groups: ["official_ai", "tech_ai"], api_config: {} },
    { id: "google_ai_blog", name: "Google AI Blog", type: "rss", url: "https://blog.google/technology/ai/rss/", topic_ids: ["tech_ai"], trust_tier: "official", enabled: true, language: "en", source_groups: ["official_ai", "tech_ai"], api_config: {} },
    { id: "meta_ai_blog", name: "Meta AI Blog", type: "official", url: "https://ai.meta.com/blog/", topic_ids: ["tech_ai"], trust_tier: "official", enabled: true, language: "en", source_groups: ["official_ai", "tech_ai"], api_config: {} },
    { id: "microsoft_ai_blog", name: "Microsoft AI Blog", type: "rss", url: "https://news.microsoft.com/source/topics/ai/feed/", topic_ids: ["tech_ai"], trust_tier: "official", enabled: true, language: "en", source_groups: ["official_ai", "tech_ai"], api_config: {} },
    { id: "hacker_news", name: "Hacker News", type: "hackernews", url: "https://hn.algolia.com/api/v1/search_by_date", topic_ids: ["tech_ai"], trust_tier: "community_social", enabled: true, language: "en", source_groups: ["community_tech", "tech_ai"], api_config: { hits_per_page: 25, tags: "story" } },
    { id: "reddit_tech", name: "Reddit Tech Signals", type: "reddit", topic_ids: ["tech_ai"], trust_tier: "community_social", enabled: true, language: "en", source_groups: ["community_tech", "tech_ai"], api_config: { subreddits: ["artificial", "programming", "startups"], limit: 10 } },
    { id: "gdelt_tech_ai", name: "GDELT Tech and AI Discovery", type: "gdelt", topic_ids: ["tech_ai"], trust_tier: "public_database", enabled: true, language: "multilingual", source_groups: ["tech_ai"], api_config: { query: "(AI OR \"artificial intelligence\" OR OpenAI OR \"generative AI\" OR LLM)", max_records: 25 } },
    { id: "tn_gov_press", name: "Tamil Nadu Government Press Releases", type: "official", url: "https://www.tn.gov.in/press_release.php", topic_ids: ["tn_politics"], trust_tier: "official", enabled: true, language: "en", source_groups: ["tn_government"], api_config: {} },
    { id: "pib_india", name: "Press Information Bureau India", type: "rss", url: "https://archive.pib.gov.in/newsite/rssenglish.aspx", topic_ids: ["tn_politics", "india_politics"], trust_tier: "official", enabled: true, language: "en", source_groups: ["india_government"], api_config: {} },
    { id: "election_commission", name: "Election Commission of India", type: "official", url: "https://www.eci.gov.in/", topic_ids: ["tn_politics", "india_politics"], trust_tier: "official", enabled: false, language: "en", source_groups: ["india_government"], api_config: {} },
    { id: "mygov_blog", name: "MyGov Blog", type: "rss", url: "https://blog.mygov.in/feed/", topic_ids: ["india_politics"], trust_tier: "official", enabled: true, language: "en", source_groups: ["india_government"], api_config: {} },
    { id: "the_hindu_tn", name: "The Hindu Tamil Nadu", type: "rss", url: "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss", topic_ids: ["tn_politics"], trust_tier: "reputed_news", enabled: true, language: "en", source_groups: ["indian_news"], api_config: {} },
    { id: "the_hindu_national", name: "The Hindu National", type: "rss", url: "https://www.thehindu.com/news/national/feeder/default.rss", topic_ids: ["india_politics"], trust_tier: "reputed_news", enabled: true, language: "en", source_groups: ["indian_news"], api_config: {} },
    { id: "indian_express_india", name: "Indian Express India", type: "rss", url: "https://indianexpress.com/section/india/feed/", topic_ids: ["tn_politics", "india_politics"], trust_tier: "reputed_news", enabled: true, language: "en", source_groups: ["indian_news"], api_config: {} },
    { id: "gdelt_tn_politics", name: "GDELT Tamil Nadu Politics Discovery", type: "gdelt", topic_ids: ["tn_politics"], trust_tier: "public_database", enabled: true, language: "multilingual", source_groups: ["indian_news", "tn_government"], api_config: { query: "(\"Tamil Nadu\" OR Chennai OR DMK OR AIADMK) (government OR election OR assembly OR policy OR budget)", max_records: 25 } },
    { id: "gdelt_india_politics", name: "GDELT India Politics Discovery", type: "gdelt", topic_ids: ["india_politics"], trust_tier: "public_database", enabled: true, language: "multilingual", source_groups: ["indian_news", "india_government"], api_config: { query: "(India OR \"New Delhi\") (government OR parliament OR election OR cabinet OR ministry OR policy)", max_records: 25 } },
    { id: "tmdb_trending", name: "TMDb Trending Movies and TV", type: "tmdb", topic_ids: ["movies_series"], trust_tier: "public_database", enabled: true, language: "en", source_groups: ["entertainment"], api_config: {} },
    { id: "youtube_official_trailers", name: "YouTube Official Trailer Signals", type: "youtube", topic_ids: ["movies_series", "tech_ai"], trust_tier: "public_database", enabled: true, language: "en", source_groups: ["official_trailers", "tech_ai"], api_config: { queries: ["official trailer", "OpenAI", "Google AI"], max_results: 8 } },
    { id: "variety_entertainment", name: "Variety Film and TV", type: "rss", url: "https://variety.com/v/film/news/feed/", topic_ids: ["movies_series"], trust_tier: "reputed_news", enabled: true, language: "en", source_groups: ["entertainment"], api_config: {} },
    { id: "hollywood_reporter_tv", name: "Hollywood Reporter TV", type: "rss", url: "https://www.hollywoodreporter.com/t/tv-news/feed/", topic_ids: ["movies_series"], trust_tier: "reputed_news", enabled: true, language: "en", source_groups: ["entertainment"], api_config: {} }
  ],
  trust_rules: {
    trust_tiers: {
      official: { score: 100, label: "Official government/company/API source" },
      reputed_news: { score: 80, label: "Reputed news source" },
      public_database: { score: 75, label: "Known public database/API" },
      community_social: { score: 40, label: "Community/social discussion" },
      unverified: { score: 10, label: "Unverified viral/rumour source" }
    },
    confidence: {
      high_min_score: 80,
      medium_min_score: 50,
      low_min_score: 0
    },
    political_rules: {
      topics: ["tn_politics", "india_politics"],
      confirmed_when: {
        official_sources: 1,
        reputed_sources: 2
      },
      social_label: "unverified signal",
      action_min_confidence: "medium"
    },
    ranking_weights: {
      trust: 0.45,
      recency: 0.25,
      relevance: 0.2,
      support: 0.1
    }
  },
  schedules: [
    { enabled: true, run_type: "morning", time_utc: "03:00", timezone: "Asia/Kolkata" },
    { enabled: true, run_type: "evening", time_utc: "15:00", timezone: "Asia/Kolkata" },
    { enabled: true, run_type: "manual", time_utc: "on_demand", timezone: "Asia/Kolkata" }
  ],
  secrets: [
    { key: "TELEGRAM_BOT_TOKEN", label: "Telegram bot token", required: true, configured: true },
    { key: "TELEGRAM_CHAT_ID", label: "Telegram chat id", required: true, configured: true },
    { key: "GEMINI_API_KEY", label: "Gemini API key", required: false, configured: true },
    { key: "SUPABASE_URL", label: "Supabase project URL", required: false, configured: true },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role key", required: false, configured: true },
    { key: "YOUTUBE_API_KEY", label: "YouTube API key", required: false, configured: false },
    { key: "TMDB_API_KEY", label: "TMDb API key", required: false, configured: false },
    { key: "REDDIT_CLIENT_ID", label: "Reddit client id", required: false, configured: false },
    { key: "REDDIT_CLIENT_SECRET", label: "Reddit client secret", required: false, configured: false }
  ]
};
