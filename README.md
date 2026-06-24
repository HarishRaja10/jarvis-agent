# Jarvis Briefing Agent

A free-cost V1 personal intelligence agent that collects public web and social signals, ranks them by trust, summarizes them in a casual assistant tone, and sends a Telegram briefing twice daily.

This project is designed for GitHub Actions scheduling:

- Morning briefing: `08:30 AM IST` using cron `0 3 * * *`
- Evening briefing: `08:30 PM IST` using cron `0 15 * * *`
- Manual briefing: GitHub Actions `workflow_dispatch`

The voice option is intentionally original: a calm, premium, futuristic assistant style. It does not clone or impersonate the copyrighted Iron Man Jarvis voice.

## Free-Cost Architecture

- Python CLI pipeline in `src/main.py`
- Telegram Bot API for delivery
- GitHub Actions cron for scheduling
- Public RSS feeds, GDELT, Hacker News, and optional free-tier APIs
- SQLite by default for local persistence
- Optional Supabase REST storage when configured
- Optional Gemini summarization when `GEMINI_API_KEY` is available
- Extractive fallback summary when no AI key is configured
- Optional local/open TTS using Piper or configured `edge_tts`

The agent avoids paid APIs, private pages, logged-in content, blocked sources, piracy/leak sources, and hardcoded secrets.

## Setup

1. Create a Telegram bot with BotFather and save the bot token.
2. Get your Telegram chat ID. A simple way is to send a message to your bot, then open:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Add this repo to GitHub.
4. In GitHub, open `Settings -> Secrets and variables -> Actions`.
5. Add the required Telegram secrets listed below.
6. Add optional API keys for Gemini, YouTube, Reddit, TMDb, or Supabase only if you want those features.
7. Enable GitHub Actions.
8. Run `Manual Briefing` once from the Actions tab.

## Local Run

```bash
cd Jarvis/jarvis-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest
python src/main.py --run-type manual
```

If Telegram credentials are missing, the briefing is printed locally instead of sent.

## Frontend PWA

The web app lives in `frontend/`. It is a React + TypeScript + Vite PWA with a Three.js home dashboard, dark-mode-first neon intelligence UI, mock briefing data, source health panels, and installable PWA support.

It also includes iPhone-friendly PWA metadata: Apple touch icons, standalone-mode meta tags, safe-area CSS for notches/Dynamic Island, and selected iPhone splash images. Final iPhone validation still requires opening the deployed HTTPS URL in Safari and using Share -> Add to Home Screen.

```bash
cd Jarvis/jarvis-agent/frontend
npm install
npm run dev
npm run build
```

The current V1 frontend uses mock data from `frontend/src/data/mock.ts`. Later, connect it to the Python agent through a FastAPI endpoint, static JSON export, or Supabase-backed API.

## Required GitHub Secrets

Required for Telegram delivery:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Optional AI:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` default: `gemini-3.1-flash-lite`

Optional sources:

- `YOUTUBE_API_KEY`
- `TMDB_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`

Optional storage:

- `STORAGE_PROVIDER` set to `supabase` to use Supabase
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional voice:

- `VOICE_PROVIDER` values: `none`, `piper`, `edge_tts`
- `PIPER_BIN`
- `PIPER_MODEL`
- `EDGE_TTS_VOICE`
- `FFMPEG_BIN`

## Configuration

Main config files:

- `config/agent.yaml`: agent name, tone, timezone, max items, storage, voice, minimum confidence
- `config/topics.yaml`: topic IDs, priorities, keywords, exclusions, max items
- `config/sources.yaml`: RSS, GDELT, Hacker News, Reddit, YouTube, TMDb, official sources
- `config/trust_rules.yaml`: trust tier scores, political confirmation rules, ranking weights

To add a source, add a new entry in `config/sources.yaml`:

```yaml
- id: example_source
  name: Example News
  type: rss
  url: https://example.com/feed.xml
  topic_ids: [tech_ai]
  trust_tier: reputed_news
  enabled: true
  language: en
  source_groups: [tech_ai]
```

Supported source types:

- `rss`
- `gdelt`
- `hackernews`
- `reddit`
- `youtube`
- `tmdb`
- `official`

## Trust and Political Rules

Trust tiers:

- Official government/company/API source: `100`
- Reputed news source: `80`
- Known public database/API: `75`
- Community/social discussion: `40`
- Unverified viral/rumour source: `10`

Political handling:

- One official source means the item can be treated as confirmed.
- Two reputed sources mean the item can be treated as confirmed.
- Single reputed or public database political items are labelled as reported signals.
- Community/social political items are labelled as unverified signals.
- Action suggestions are only shown for Medium or High confidence items.
- Every item includes source links.

## Optional Supabase Storage

SQLite is the default. To use Supabase, set:

```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create these tables in Supabase if you want REST storage:

```sql
create table if not exists public.seen_items (
  id bigint generated by default as identity primary key,
  url_hash text unique,
  title_hash text,
  topic_id text,
  first_seen_at timestamptz not null default now(),
  source_id text
);

create table if not exists public.briefing_history (
  id bigint generated by default as identity primary key,
  run_type text not null,
  generated_at timestamptz not null default now(),
  text_summary text not null,
  item_count integer not null
);

create table if not exists public.source_events (
  id bigint generated by default as identity primary key,
  title text not null,
  url text not null,
  source text not null,
  published_at timestamptz,
  topic text,
  raw_summary text,
  trust_score integer,
  confidence text,
  raw_metadata text
);

grant select, insert on public.seen_items to service_role;
grant insert on public.briefing_history to service_role;
grant insert on public.source_events to service_role;

alter table public.seen_items enable row level security;
alter table public.briefing_history enable row level security;
alter table public.source_events enable row level security;
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it in frontend code.

## Optional Runtime Config

The PWA Config Center can export the full runtime config JSON. The Python agent can then consume that config from an inline secret, a local JSON file, or Supabase.

Local file:

```bash
RUNTIME_CONFIG_PATH=jarvis-runtime-config.json
```

GitHub secret:

```bash
RUNTIME_CONFIG_JSON='{"version":1,...}'
```

Supabase-backed config:

```bash
RUNTIME_CONFIG_PROVIDER=supabase
RUNTIME_CONFIG_ID=active
```

Run `supabase/runtime_configs.sql` in Supabase SQL Editor, then save exported PWA JSON:

```sql
insert into public.runtime_configs (config_id, config, is_active)
values ('active', '<PASTE_EXPORTED_JSON_HERE>'::jsonb, true)
on conflict (config_id)
do update set config = excluded.config, is_active = true;
```

Runtime config can override:

- `agent`
- `topics`
- `sources`
- `trust_rules`

Secrets still belong in `.env` and GitHub Secrets, not inside PWA-exported runtime JSON.

## Optional Voice

Voice is disabled by default:

```yaml
enable_voice: false
voice_provider: none
```

For Piper:

```bash
VOICE_PROVIDER=piper
PIPER_BIN=/path/to/piper
PIPER_MODEL=/path/to/model.onnx
FFMPEG_BIN=ffmpeg
```

For `edge_tts`, install it separately and set:

```bash
VOICE_PROVIDER=edge_tts
EDGE_TTS_VOICE=en-GB-RyanNeural
FFMPEG_BIN=ffmpeg
```

If voice generation fails, text delivery still proceeds.

## Known Limitations

- Public feeds can change URLs or formats.
- GitHub Actions cron is not exact to the second.
- Reddit, YouTube, TMDb, Gemini, Supabase, and voice are optional.
- Fallback summaries are extractive and less nuanced than Gemini summaries.
- GDELT is useful for discovery, but political claims still need source confirmation.
- Supabase tables are not auto-created by the agent.

## Example Output

```text
Manual check. Jarvis briefing is ready.
Run: Manual | Time: 23 Jun 2026, 08:30 AM IST

Top 3 important updates
1. OpenAI announces a new model update for developers.
2. Reported signal: Tamil Nadu policy update reported by a reputed outlet.
3. A trusted entertainment source confirms a new trailer release.

Technologies and AI
- OpenAI announces a new model update for developers.
  Why it matters: It may affect tools, workflows, startups, or the AI market you track.
  Action: Skim the source, then bookmark it if it affects your tools, workflows, or product ideas.
  Confidence: High | Trust score: 100
  Sources: OpenAI News: https://openai.com/news/

India Politics
- Reported signal: Election-related update reported by one reputed source.
  Why it matters: It is worth watching, but the political claim still needs stronger confirmation.
  Action: Keep it on watch, but do not treat it as final until an official or second reputed source confirms it.
  Confidence: Medium | Trust score: 80
  Sources: The Hindu National: https://www.thehindu.com/
```
