import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  Cloud,
  Download,
  FileJson,
  KeyRound,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  Trash2,
  Upload
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { useRuntimeConfig } from "../hooks/useRuntimeConfig";
import { fetchRuntimeConfig, getAdminToken, saveAdminToken, saveRuntimeConfig as putRuntimeConfig } from "../lib/api";
import type { ConfidenceFloor, RuntimeConfig, SourceRuntimeConfig, TopicRuntimeConfig } from "../types/runtimeConfig";

type TabId = "agent" | "topics" | "sources" | "trust" | "schedules" | "secrets" | "runtime";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "agent", label: "Agent" },
  { id: "topics", label: "Topics" },
  { id: "sources", label: "Sources" },
  { id: "trust", label: "Trust" },
  { id: "schedules", label: "Schedules" },
  { id: "secrets", label: "Secrets" },
  { id: "runtime", label: "Runtime" }
];

const sourceTypes = ["rss", "official", "hackernews", "reddit", "gdelt", "tmdb", "youtube"];
const confidenceFloors: ConfidenceFloor[] = ["low", "medium", "high"];

export function ConfigCenter() {
  const { config, stats, setConfig, updateConfig, resetConfig, importConfig, exportConfig } = useRuntimeConfig();
  const [activeTab, setActiveTab] = useState<TabId>("agent");
  const [selectedTopicId, setSelectedTopicId] = useState(Object.keys(config.topics)[0] ?? "");
  const [selectedSourceId, setSelectedSourceId] = useState(config.sources[0]?.id ?? "");
  const [importDraft, setImportDraft] = useState("");
  const [runtimeStatus, setRuntimeStatus] = useState("Local draft");
  const [adminToken, setAdminToken] = useState(() => getAdminToken());

  const selectedTopic = config.topics[selectedTopicId];
  const selectedSource = config.sources.find((source) => source.id === selectedSourceId);

  useEffect(() => {
    const topicIds = Object.keys(config.topics);
    if (!selectedTopicId || !config.topics[selectedTopicId]) {
      setSelectedTopicId(topicIds[0] ?? "");
    }
  }, [config.topics, selectedTopicId]);

  useEffect(() => {
    if (!selectedSourceId || !config.sources.some((source) => source.id === selectedSourceId)) {
      setSelectedSourceId(config.sources[0]?.id ?? "");
    }
  }, [config.sources, selectedSourceId]);

  useEffect(() => {
    let cancelled = false;
    setRuntimeStatus("Connecting");
    fetchRuntimeConfig()
      .then((response) => {
        if (cancelled) return;
        if (response.config) {
          setConfig(response.config);
          setRuntimeStatus(response.updatedAt ? `Remote ${new Date(response.updatedAt).toLocaleString()}` : "Remote loaded");
        } else {
          setRuntimeStatus("Remote empty");
        }
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatus("Local draft");
      });
    return () => {
      cancelled = true;
    };
  }, [setConfig]);

  const runtimeJson = useMemo(() => exportConfig(), [exportConfig]);

  function copyRuntimeJson() {
    void navigator.clipboard?.writeText(runtimeJson);
    setRuntimeStatus("Copied");
  }

  function downloadRuntimeJson() {
    const url = URL.createObjectURL(new Blob([runtimeJson], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jarvis-runtime-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setRuntimeStatus("Downloaded");
  }

  function applyImport() {
    try {
      importConfig(importDraft);
      setRuntimeStatus("Imported");
      setImportDraft("");
    } catch {
      setRuntimeStatus("Invalid JSON");
    }
  }

  async function loadRemoteRuntime() {
    setRuntimeStatus("Loading remote");
    try {
      const response = await fetchRuntimeConfig();
      if (response.config) {
        setConfig(response.config);
        setRuntimeStatus(response.updatedAt ? `Remote ${new Date(response.updatedAt).toLocaleString()}` : "Remote loaded");
      } else {
        setRuntimeStatus("Remote empty");
      }
    } catch (error) {
      setRuntimeStatus(error instanceof Error ? error.message : "Remote load failed");
    }
  }

  async function saveRemoteRuntime() {
    saveAdminToken(adminToken);
    setRuntimeStatus("Saving remote");
    try {
      const response = await putRuntimeConfig(config, adminToken);
      setRuntimeStatus(response.updatedAt ? `Saved ${new Date(response.updatedAt).toLocaleString()}` : "Remote saved");
    } catch (error) {
      setRuntimeStatus(error instanceof Error ? error.message : "Remote save failed");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4">
          <Panel className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-core/35 bg-cyan-core/10">
                <Settings2 className="h-5 w-5 text-cyan-core" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Config Center</h2>
                <p className="text-xs text-muted-foreground">Runtime profile</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Topics" value={String(stats.topics)} />
              <Metric label="Sources" value={`${stats.enabledSources}/${stats.sources}`} />
              <Metric label="Required" value={`${stats.configuredRequiredSecrets}/${stats.requiredSecrets}`} />
              <Metric label="Version" value={String(config.version)} />
            </div>
          </Panel>

          <Panel className="p-2">
            <nav className="grid gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex h-10 items-center justify-between rounded-md px-3 text-left text-sm transition ${
                    activeTab === tab.id ? "bg-cyan-core/14 text-cyan-core" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id ? <Check className="h-4 w-4" /> : null}
                </button>
              ))}
            </nav>
          </Panel>
        </aside>

        <section className="min-w-0">
          {activeTab === "agent" ? <AgentPanel config={config} updateConfig={updateConfig} /> : null}
          {activeTab === "topics" ? <TopicsPanel config={config} selectedTopic={selectedTopic} selectedTopicId={selectedTopicId} setSelectedTopicId={setSelectedTopicId} updateConfig={updateConfig} /> : null}
          {activeTab === "sources" ? <SourcesPanel config={config} selectedSource={selectedSource} selectedSourceId={selectedSourceId} setSelectedSourceId={setSelectedSourceId} updateConfig={updateConfig} /> : null}
          {activeTab === "trust" ? <TrustPanel config={config} updateConfig={updateConfig} /> : null}
          {activeTab === "schedules" ? <SchedulesPanel config={config} updateConfig={updateConfig} /> : null}
          {activeTab === "secrets" ? <SecretsPanel config={config} updateConfig={updateConfig} /> : null}
          {activeTab === "runtime" ? (
            <RuntimePanel
              importDraft={importDraft}
              runtimeJson={runtimeJson}
              runtimeStatus={runtimeStatus}
              setImportDraft={setImportDraft}
              adminToken={adminToken}
              setAdminToken={setAdminToken}
              applyImport={applyImport}
              copyRuntimeJson={copyRuntimeJson}
              downloadRuntimeJson={downloadRuntimeJson}
              loadRemoteRuntime={loadRemoteRuntime}
              saveRemoteRuntime={saveRemoteRuntime}
              resetConfig={() => {
                resetConfig();
                setRuntimeStatus("Reset");
              }}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function AgentPanel({ config, updateConfig }: ConfigPanelProps) {
  return (
    <Panel className="p-4">
      <PanelTitle icon={SlidersHorizontal} title="Agent" detail="Identity, filtering, storage, voice" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextField label="Agent name" value={config.agent.agent_name} onChange={(value) => updateConfig((draft) => { draft.agent.agent_name = value; })} />
        <TextField label="Tone" value={config.agent.tone} onChange={(value) => updateConfig((draft) => { draft.agent.tone = value; })} />
        <TextField label="Timezone" value={config.agent.timezone} onChange={(value) => updateConfig((draft) => { draft.agent.timezone = value; })} />
        <TextField label="Output language" value={config.agent.output_language} onChange={(value) => updateConfig((draft) => { draft.agent.output_language = value; })} />
        <NumberField label="Max items per topic" value={config.agent.max_items_per_topic} min={1} max={20} onChange={(value) => updateConfig((draft) => { draft.agent.max_items_per_topic = value; })} />
        <SelectField label="Minimum confidence" value={config.agent.min_confidence_to_send} options={confidenceFloors} onChange={(value) => updateConfig((draft) => { draft.agent.min_confidence_to_send = value as ConfidenceFloor; })} />
        <SelectField label="Storage provider" value={config.agent.storage_provider} options={["supabase", "sqlite"]} onChange={(value) => updateConfig((draft) => { draft.agent.storage_provider = value; })} />
        <SelectField label="Voice provider" value={config.agent.voice_provider} options={["none", "edge_tts", "piper"]} onChange={(value) => updateConfig((draft) => { draft.agent.voice_provider = value; })} />
      </div>
      <div className="mt-4">
        <ToggleRow label="Voice enabled" enabled={config.agent.enable_voice} onChange={(enabled) => updateConfig((draft) => { draft.agent.enable_voice = enabled; })} />
      </div>
    </Panel>
  );
}

function TopicsPanel({ config, selectedTopic, selectedTopicId, setSelectedTopicId, updateConfig }: TopicsPanelProps) {
  function addTopic() {
    const nextId = uniqueId("topic", Object.keys(config.topics));
    updateConfig((draft) => {
      draft.topics[nextId] = {
        name: "New Topic",
        priority: 50,
        keywords: [],
        excluded_keywords: [],
        source_groups: [],
        max_items: draft.agent.max_items_per_topic,
        alert_threshold: 70
      };
    });
    setSelectedTopicId(nextId);
  }

  function deleteTopic() {
    if (!selectedTopicId) return;
    updateConfig((draft) => {
      delete draft.topics[selectedTopicId];
      draft.sources.forEach((source) => {
        source.topic_ids = source.topic_ids.filter((id) => id !== selectedTopicId);
      });
    });
  }

  return (
    <Panel className="p-4">
      <PanelTitle icon={ToggleLeft} title="Topics" detail="Priorities, keywords, thresholds" />
      <div className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ItemList ids={Object.keys(config.topics)} selectedId={selectedTopicId} onSelect={setSelectedTopicId} labels={config.topics} addLabel="Topic" onAdd={addTopic} />
        {selectedTopic ? (
          <div className="grid gap-4">
            <TextField label="Topic name" value={selectedTopic.name} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { name: value })} />
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField label="Priority" value={selectedTopic.priority} min={0} max={100} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { priority: value })} />
              <NumberField label="Max items" value={selectedTopic.max_items} min={1} max={20} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { max_items: value })} />
              <NumberField label="Alert threshold" value={selectedTopic.alert_threshold} min={0} max={100} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { alert_threshold: value })} />
            </div>
            <TextAreaField label="Keywords" value={selectedTopic.keywords.join("\n")} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { keywords: lines(value) })} />
            <TextAreaField label="Excluded keywords" value={selectedTopic.excluded_keywords.join("\n")} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { excluded_keywords: lines(value) })} />
            <TextAreaField label="Source groups" value={selectedTopic.source_groups.join("\n")} onChange={(value) => updateTopic(selectedTopicId, updateConfig, { source_groups: lines(value) })} />
            <Button variant="danger" onClick={deleteTopic}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function SourcesPanel({ config, selectedSource, selectedSourceId, setSelectedSourceId, updateConfig }: SourcesPanelProps) {
  const [apiDraft, setApiDraft] = useState("{}");
  const [apiStatus, setApiStatus] = useState("Ready");

  useEffect(() => {
    setApiDraft(JSON.stringify(selectedSource?.api_config ?? {}, null, 2));
    setApiStatus("Ready");
  }, [selectedSourceId, selectedSource]);

  function addSource() {
    const nextId = uniqueId("source", config.sources.map((source) => source.id));
    updateConfig((draft) => {
      draft.sources.push({
        id: nextId,
        name: "New Source",
        type: "rss",
        url: "",
        topic_ids: Object.keys(draft.topics).slice(0, 1),
        trust_tier: "unverified",
        enabled: true,
        language: "en",
        source_groups: [],
        api_config: {}
      });
    });
    setSelectedSourceId(nextId);
  }

  function deleteSource() {
    updateConfig((draft) => {
      draft.sources = draft.sources.filter((source) => source.id !== selectedSourceId);
    });
  }

  function saveApiConfig() {
    try {
      const parsed = JSON.parse(apiDraft) as Record<string, unknown>;
      updateConfig((draft) => {
        const source = draft.sources.find((item) => item.id === selectedSourceId);
        if (source) source.api_config = parsed;
      });
      setApiStatus("Saved");
    } catch {
      setApiStatus("Invalid JSON");
    }
  }

  return (
    <Panel className="p-4">
      <PanelTitle icon={FileJson} title="Sources" detail="Feeds, APIs, groups, source trust" />
      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ItemList ids={config.sources.map((source) => source.id)} selectedId={selectedSourceId} onSelect={setSelectedSourceId} labels={Object.fromEntries(config.sources.map((source) => [source.id, { name: source.name }]))} addLabel="Source" onAdd={addSource} />
        {selectedSource ? (
          <div className="grid gap-4">
            <ToggleRow label="Enabled" enabled={selectedSource.enabled} onChange={(enabled) => updateSource(selectedSourceId, updateConfig, { enabled })} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Source id" value={selectedSource.id} onChange={(value) => renameSource(selectedSourceId, value, updateConfig, setSelectedSourceId)} />
              <TextField label="Name" value={selectedSource.name} onChange={(value) => updateSource(selectedSourceId, updateConfig, { name: value })} />
              <SelectField label="Type" value={selectedSource.type} options={sourceTypes} onChange={(value) => updateSource(selectedSourceId, updateConfig, { type: value })} />
              <SelectField label="Trust tier" value={selectedSource.trust_tier} options={Object.keys(config.trust_rules.trust_tiers)} onChange={(value) => updateSource(selectedSourceId, updateConfig, { trust_tier: value })} />
              <TextField label="URL" value={selectedSource.url ?? ""} onChange={(value) => updateSource(selectedSourceId, updateConfig, { url: value })} />
              <TextField label="Language" value={selectedSource.language ?? ""} onChange={(value) => updateSource(selectedSourceId, updateConfig, { language: value })} />
            </div>
            <TextAreaField label="Topic ids" value={selectedSource.topic_ids.join("\n")} onChange={(value) => updateSource(selectedSourceId, updateConfig, { topic_ids: lines(value) })} />
            <TextAreaField label="Source groups" value={selectedSource.source_groups.join("\n")} onChange={(value) => updateSource(selectedSourceId, updateConfig, { source_groups: lines(value) })} />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">API config JSON</span>
                <Badge tone={apiStatus === "Invalid JSON" ? "rose" : "cyan"}>{apiStatus}</Badge>
              </div>
              <textarea className="min-h-44 w-full resize-y rounded-md border border-border bg-muted/45 p-3 font-mono text-xs outline-none focus:border-cyan-core" value={apiDraft} onChange={(event) => setApiDraft(event.target.value)} />
              <div className="mt-2 flex gap-2">
                <Button onClick={saveApiConfig}>
                  <Save className="h-4 w-4" />
                  Apply
                </Button>
                <Button variant="danger" onClick={deleteSource}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function TrustPanel({ config, updateConfig }: ConfigPanelProps) {
  return (
    <Panel className="p-4">
      <PanelTitle icon={ShieldCheck} title="Trust" detail="Tiers, confidence, political guardrails, ranking" />
      <div className="mt-4 grid gap-6">
        <div className="grid gap-3 lg:grid-cols-2">
          {Object.entries(config.trust_rules.trust_tiers).map(([tierId, tier]) => (
            <div key={tierId} className="rounded-md border border-border/70 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge tone="cyan">{tierId}</Badge>
                <NumberField label="Score" value={tier.score} min={0} max={100} onChange={(value) => updateConfig((draft) => { draft.trust_rules.trust_tiers[tierId].score = value; })} />
              </div>
              <TextField label="Label" value={tier.label} onChange={(value) => updateConfig((draft) => { draft.trust_rules.trust_tiers[tierId].label = value; })} />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField label="High confidence minimum" value={config.trust_rules.confidence.high_min_score} min={0} max={100} onChange={(value) => updateConfig((draft) => { draft.trust_rules.confidence.high_min_score = value; })} />
          <NumberField label="Medium confidence minimum" value={config.trust_rules.confidence.medium_min_score} min={0} max={100} onChange={(value) => updateConfig((draft) => { draft.trust_rules.confidence.medium_min_score = value; })} />
          <NumberField label="Low confidence minimum" value={config.trust_rules.confidence.low_min_score} min={0} max={100} onChange={(value) => updateConfig((draft) => { draft.trust_rules.confidence.low_min_score = value; })} />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(config.trust_rules.ranking_weights).map(([key, value]) => (
            <NumberField key={key} label={`${key} weight`} value={value} min={0} max={1} step={0.01} onChange={(next) => updateConfig((draft) => { draft.trust_rules.ranking_weights[key as keyof typeof draft.trust_rules.ranking_weights] = next; })} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="Political topics" value={config.trust_rules.political_rules.topics.join("\n")} onChange={(value) => updateConfig((draft) => { draft.trust_rules.political_rules.topics = lines(value); })} />
          <div className="grid gap-4">
            <NumberField label="Official confirmations" value={config.trust_rules.political_rules.confirmed_when.official_sources} min={0} max={5} onChange={(value) => updateConfig((draft) => { draft.trust_rules.political_rules.confirmed_when.official_sources = value; })} />
            <NumberField label="Reputed confirmations" value={config.trust_rules.political_rules.confirmed_when.reputed_sources} min={0} max={5} onChange={(value) => updateConfig((draft) => { draft.trust_rules.political_rules.confirmed_when.reputed_sources = value; })} />
            <TextField label="Social label" value={config.trust_rules.political_rules.social_label} onChange={(value) => updateConfig((draft) => { draft.trust_rules.political_rules.social_label = value; })} />
            <SelectField label="Action minimum confidence" value={config.trust_rules.political_rules.action_min_confidence} options={confidenceFloors} onChange={(value) => updateConfig((draft) => { draft.trust_rules.political_rules.action_min_confidence = value as ConfidenceFloor; })} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SchedulesPanel({ config, updateConfig }: ConfigPanelProps) {
  return (
    <Panel className="p-4">
      <PanelTitle icon={SlidersHorizontal} title="Schedules" detail="Run profiles and execution windows" />
      <div className="mt-4 grid gap-3">
        {config.schedules.map((schedule, index) => (
          <div key={`${schedule.run_type}-${index}`} className="grid gap-3 rounded-md border border-border/70 p-3 md:grid-cols-[160px_1fr_1fr_160px]">
            <ToggleRow label={schedule.run_type} enabled={schedule.enabled} onChange={(enabled) => updateConfig((draft) => { draft.schedules[index].enabled = enabled; })} />
            <TextField label="UTC time" value={schedule.time_utc} onChange={(value) => updateConfig((draft) => { draft.schedules[index].time_utc = value; })} />
            <TextField label="Timezone" value={schedule.timezone} onChange={(value) => updateConfig((draft) => { draft.schedules[index].timezone = value; })} />
            <SelectField label="Run type" value={schedule.run_type} options={["morning", "evening", "manual"]} onChange={(value) => updateConfig((draft) => { draft.schedules[index].run_type = value as typeof schedule.run_type; })} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SecretsPanel({ config, updateConfig }: ConfigPanelProps) {
  return (
    <Panel className="p-4">
      <PanelTitle icon={AlertTriangle} title="Secrets" detail="Presence map, not secret values" />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {config.secrets.map((secret, index) => (
          <div key={secret.key} className="grid gap-3 rounded-md border border-border/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{secret.label}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{secret.key}</p>
              </div>
              <Badge tone={secret.configured ? "emerald" : secret.required ? "rose" : "amber"}>{secret.configured ? "Configured" : "Missing"}</Badge>
            </div>
            <div className="flex gap-2">
              <ToggleRow label="Configured" enabled={secret.configured} onChange={(enabled) => updateConfig((draft) => { draft.secrets[index].configured = enabled; })} />
              <ToggleRow label="Required" enabled={secret.required} onChange={(enabled) => updateConfig((draft) => { draft.secrets[index].required = enabled; })} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RuntimePanel({ importDraft, runtimeJson, runtimeStatus, setImportDraft, adminToken, setAdminToken, applyImport, copyRuntimeJson, downloadRuntimeJson, loadRemoteRuntime, saveRemoteRuntime, resetConfig }: RuntimePanelProps) {
  return (
    <Panel className="p-4">
      <PanelTitle icon={FileJson} title="Runtime" detail={runtimeStatus} />
      <div className="mt-4 grid gap-3 rounded-md border border-border/70 bg-muted/25 p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-medium">
            <KeyRound className="h-4 w-4 text-cyan-core" />
            Admin API token
          </span>
          <input className="h-10 rounded-md border border-border bg-background/60 px-3 outline-none focus:border-cyan-core" type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={loadRemoteRuntime}>
            <Cloud className="h-4 w-4" />
            Load Remote
          </Button>
          <Button variant="primary" onClick={saveRemoteRuntime}>
            <Save className="h-4 w-4" />
            Save Remote
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyRuntimeJson}>
              <Clipboard className="h-4 w-4" />
              Copy
            </Button>
            <Button onClick={downloadRuntimeJson}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="danger" onClick={resetConfig}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <textarea className="min-h-[560px] w-full resize-y rounded-md border border-border bg-muted/45 p-3 font-mono text-xs outline-none focus:border-cyan-core" readOnly value={runtimeJson} />
        </div>
        <div className="grid content-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyImport}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          <textarea className="min-h-[560px] w-full resize-y rounded-md border border-border bg-muted/45 p-3 font-mono text-xs outline-none focus:border-cyan-core" value={importDraft} onChange={(event) => setImportDraft(event.target.value)} />
        </div>
      </div>
    </Panel>
  );
}

type ConfigPanelProps = {
  config: RuntimeConfig;
  updateConfig: (mutator: (draft: RuntimeConfig) => void) => void;
};

type TopicsPanelProps = ConfigPanelProps & {
  selectedTopic?: TopicRuntimeConfig;
  selectedTopicId: string;
  setSelectedTopicId: (id: string) => void;
};

type SourcesPanelProps = ConfigPanelProps & {
  selectedSource?: SourceRuntimeConfig;
  selectedSourceId: string;
  setSelectedSourceId: (id: string) => void;
};

type RuntimePanelProps = {
  importDraft: string;
  runtimeJson: string;
  runtimeStatus: string;
  setImportDraft: (value: string) => void;
  adminToken: string;
  setAdminToken: (value: string) => void;
  applyImport: () => void;
  copyRuntimeJson: () => void;
  downloadRuntimeJson: () => void;
  loadRemoteRuntime: () => void;
  saveRemoteRuntime: () => void;
  resetConfig: () => void;
};

function PanelTitle({ icon: Icon, title, detail }: { icon: typeof Settings2; title: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-cyan-core/35 bg-cyan-core/10">
          <Icon className="h-5 w-5 text-cyan-core" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/35 p-2">
      <p className="text-[11px] uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function ItemList({ ids, selectedId, onSelect, labels, addLabel, onAdd }: ItemListProps) {
  return (
    <div className="grid content-start gap-2">
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
      <div className="grid max-h-[620px] gap-1 overflow-auto pr-1">
        {ids.map((id) => (
          <button
            key={id}
            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
              selectedId === id ? "border-cyan-core/60 bg-cyan-core/12 text-cyan-core" : "border-border/70 bg-muted/30 hover:border-cyan-core/35"
            }`}
            onClick={() => onSelect(id)}
          >
            <span className="block truncate font-medium">{labels[id]?.name ?? id}</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">{id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ItemListProps = {
  ids: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  labels: Record<string, { name: string }>;
  addLabel: string;
  onAdd: () => void;
};

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-10 rounded-md border border-border bg-muted/45 px-3 outline-none focus:border-cyan-core" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-10 rounded-md border border-border bg-muted/45 px-3 outline-none focus:border-cyan-core" type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select className="h-10 rounded-md border border-border bg-muted/45 px-3 outline-none focus:border-cyan-core" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <textarea className="min-h-32 resize-y rounded-md border border-border bg-muted/45 p-3 outline-none focus:border-cyan-core" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/30 px-3 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-5 w-5 accent-cyan-core" type="checkbox" checked={enabled} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)} />
    </label>
  );
}

function updateTopic(id: string, updateConfig: ConfigPanelProps["updateConfig"], patch: Partial<TopicRuntimeConfig>) {
  updateConfig((draft) => {
    draft.topics[id] = { ...draft.topics[id], ...patch };
  });
}

function updateSource(id: string, updateConfig: ConfigPanelProps["updateConfig"], patch: Partial<SourceRuntimeConfig>) {
  updateConfig((draft) => {
    const source = draft.sources.find((item) => item.id === id);
    if (source) Object.assign(source, patch);
  });
}

function renameSource(id: string, nextId: string, updateConfig: ConfigPanelProps["updateConfig"], setSelectedSourceId: (id: string) => void) {
  const cleanId = nextId.trim();
  if (!cleanId) return;
  updateConfig((draft) => {
    const source = draft.sources.find((item) => item.id === id);
    if (source) source.id = cleanId;
  });
  setSelectedSourceId(cleanId);
}

function lines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueId(prefix: string, existing: string[]) {
  let index = existing.length + 1;
  let id = `${prefix}_${index}`;
  while (existing.includes(id)) {
    index += 1;
    id = `${prefix}_${index}`;
  }
  return id;
}
