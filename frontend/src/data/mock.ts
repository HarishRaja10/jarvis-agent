import {
  Bot,
  Building2,
  Clapperboard,
  Cpu,
  Landmark,
  RadioTower,
  ShieldCheck,
  Siren,
  Sparkles,
  Zap
} from "lucide-react";

export type Confidence = "High" | "Medium" | "Low";

export type Topic = {
  id: string;
  name: string;
  priority: number;
  confidence: Confidence;
  activeItems: number;
  trend: number;
  tone: "cyan" | "amber" | "emerald" | "rose";
};

export type BriefingItem = {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  why: string;
  action: string;
  source: string;
  url: string;
  confidence: Confidence;
  trustScore: number;
  age: string;
};

export type SourceStatus = {
  id: string;
  name: string;
  type: string;
  tier: string;
  health: "online" | "limited" | "standby";
  topic: string;
  trust: number;
  latency: string;
};

export type WorldSignal = {
  id: string;
  label: string;
  region: string;
  category: string;
  status: string;
  summary: string;
  lat: number;
  lng: number;
  tone: "cyan" | "amber" | "emerald" | "rose";
  confidence: Confidence;
  sourceCount: number;
};

export const statusCards = [
  { label: "Sources", value: "18", detail: "12 online", icon: RadioTower, tone: "cyan" },
  { label: "Trust Avg", value: "82", detail: "stable", icon: ShieldCheck, tone: "emerald" },
  { label: "Alerts", value: "03", detail: "2 medium", icon: Siren, tone: "amber" },
  { label: "AI Mode", value: "Local", detail: "fallback ready", icon: Bot, tone: "rose" }
];

export const topics: Topic[] = [
  { id: "tech_ai", name: "Tech + AI", priority: 100, confidence: "High", activeItems: 5, trend: 18, tone: "cyan" },
  { id: "tn_politics", name: "Tamil Nadu", priority: 95, confidence: "Medium", activeItems: 4, trend: 9, tone: "amber" },
  { id: "india_politics", name: "India", priority: 90, confidence: "Medium", activeItems: 5, trend: 12, tone: "emerald" },
  { id: "movies_series", name: "Movies + Series", priority: 70, confidence: "High", activeItems: 5, trend: 6, tone: "rose" }
];

export const briefingItems: BriefingItem[] = [
  {
    id: "b1",
    topicId: "tech_ai",
    title: "OpenAI enterprise rollout expands developer workflows",
    summary: "A trusted official source reports expanded AI tooling for coding, security, and long-running work.",
    why: "It can influence your AI stack, automation ideas, and product workflow choices.",
    action: "Bookmark and compare against your current agent roadmap.",
    source: "OpenAI News",
    url: "https://openai.com/news/",
    confidence: "High",
    trustScore: 100,
    age: "18m"
  },
  {
    id: "b2",
    topicId: "tn_politics",
    title: "Tamil Nadu Assembly signal needs official follow-up",
    summary: "One reputed source reports a political exchange; no second reputed confirmation is attached yet.",
    why: "It may matter for state policy tone, but should not be treated as final.",
    action: "Track official release before making any decision.",
    source: "The Hindu Tamil Nadu",
    url: "https://www.thehindu.com/news/national/tamil-nadu/",
    confidence: "Medium",
    trustScore: 80,
    age: "42m"
  },
  {
    id: "b3",
    topicId: "india_politics",
    title: "MyGov publishes a public participation update",
    summary: "An official source confirms a government campaign result and public notice.",
    why: "Official notices can carry deadlines, policy signals, or citizen action items.",
    action: "Open the notice if it affects your interests.",
    source: "MyGov Blog",
    url: "https://blog.mygov.in/",
    confidence: "High",
    trustScore: 100,
    age: "1h"
  },
  {
    id: "b4",
    topicId: "movies_series",
    title: "Streaming release radar updates for the week",
    summary: "Reputed entertainment sources show new release dates and trailer activity without leak sources.",
    why: "It keeps the watchlist clean and source-backed.",
    action: "Add only confirmed releases to the shortlist.",
    source: "Variety",
    url: "https://variety.com/",
    confidence: "High",
    trustScore: 80,
    age: "2h"
  }
];

export const sourceStatuses: SourceStatus[] = [
  { id: "s1", name: "OpenAI News", type: "RSS", tier: "Official", health: "online", topic: "Tech + AI", trust: 100, latency: "320ms" },
  { id: "s2", name: "Google AI Blog", type: "RSS", tier: "Official", health: "online", topic: "Tech + AI", trust: 100, latency: "410ms" },
  { id: "s3", name: "GDELT", type: "API", tier: "Public DB", health: "limited", topic: "Discovery", trust: 75, latency: "1.2s" },
  { id: "s4", name: "Hacker News", type: "API", tier: "Community", health: "online", topic: "Tech + AI", trust: 40, latency: "520ms" },
  { id: "s5", name: "TN Government", type: "HTML", tier: "Official", health: "online", topic: "Tamil Nadu", trust: 100, latency: "690ms" },
  { id: "s6", name: "PIB Archive", type: "RSS", tier: "Official", health: "online", topic: "India", trust: 100, latency: "460ms" },
  { id: "s7", name: "TMDb", type: "API", tier: "Public DB", health: "standby", topic: "Movies", trust: 75, latency: "-" },
  { id: "s8", name: "YouTube", type: "API", tier: "Public DB", health: "standby", topic: "Video", trust: 75, latency: "-" }
];

export const worldSignals: WorldSignal[] = [
  {
    id: "europe_heat",
    label: "Europe heatwave",
    region: "Europe",
    category: "Climate",
    status: "Record heat",
    summary: "Heat records and public warnings are clustering across Europe.",
    lat: 48.8,
    lng: 11.4,
    tone: "amber",
    confidence: "High",
    sourceCount: 6
  },
  {
    id: "iran_gulf",
    label: "Iran and Gulf security",
    region: "Middle East",
    category: "Geopolitics",
    status: "Inspection watch",
    summary: "Nuclear inspection and Gulf security signals need close source comparison.",
    lat: 29.5,
    lng: 52.5,
    tone: "rose",
    confidence: "Medium",
    sourceCount: 5
  },
  {
    id: "india_trade_monsoon",
    label: "India trade and monsoon",
    region: "India",
    category: "India",
    status: "Policy + weather",
    summary: "Trade talks, monsoon risk, and national policy updates are active.",
    lat: 22.8,
    lng: 78.9,
    tone: "emerald",
    confidence: "Medium",
    sourceCount: 7
  },
  {
    id: "tamil_nadu",
    label: "Tamil Nadu signal",
    region: "Tamil Nadu",
    category: "Local",
    status: "Civic watch",
    summary: "State politics, civic utilities, and Chennai updates are being ranked.",
    lat: 11.1,
    lng: 78.7,
    tone: "cyan",
    confidence: "Medium",
    sourceCount: 4
  },
  {
    id: "ai_security",
    label: "AI and security",
    region: "Global Tech",
    category: "Tech + AI",
    status: "Compute risk",
    summary: "AI access, privacy, and quantum-security deadlines are active signals.",
    lat: 37.4,
    lng: -122.1,
    tone: "cyan",
    confidence: "High",
    sourceCount: 6
  },
  {
    id: "health_africa",
    label: "Public health",
    region: "Central Africa",
    category: "Health",
    status: "Outbreak watch",
    summary: "Ebola and public-health reports require official-source priority.",
    lat: -2.7,
    lng: 23.6,
    tone: "rose",
    confidence: "High",
    sourceCount: 4
  }
];

export const alerts = [
  { icon: Sparkles, label: "Gemini optional", value: "fallback active" },
  { icon: Zap, label: "Telegram", value: "secret pending" },
  { icon: Building2, label: "Official sources", value: "priority lock" },
  { icon: Landmark, label: "Politics guard", value: "enabled" },
  { icon: Cpu, label: "Voice", value: "disabled" },
  { icon: Clapperboard, label: "Leaks filter", value: "active" }
];

export const activity = [
  { time: "21:40", text: "Manual briefing generated", tone: "emerald" },
  { time: "21:39", text: "Optional APIs skipped safely", tone: "cyan" },
  { time: "21:38", text: "Official page monitor checked", tone: "amber" },
  { time: "21:37", text: "RSS feeds ranked and deduped", tone: "rose" }
];
