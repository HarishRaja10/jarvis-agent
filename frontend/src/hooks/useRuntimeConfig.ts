import { useMemo, useState } from "react";
import { defaultRuntimeConfig } from "../config/defaultRuntimeConfig";
import type { RuntimeConfig } from "../types/runtimeConfig";

const STORAGE_KEY = "jarvis.runtime.config.v1";

function cloneConfig(config: RuntimeConfig): RuntimeConfig {
  return JSON.parse(JSON.stringify(config)) as RuntimeConfig;
}

function loadStoredConfig(): RuntimeConfig {
  if (typeof window === "undefined") {
    return cloneConfig(defaultRuntimeConfig);
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneConfig(defaultRuntimeConfig);
  }
  try {
    const parsed = JSON.parse(stored) as RuntimeConfig;
    return { ...cloneConfig(defaultRuntimeConfig), ...parsed };
  } catch {
    return cloneConfig(defaultRuntimeConfig);
  }
}

export function useRuntimeConfig() {
  const [config, setConfigState] = useState<RuntimeConfig>(() => loadStoredConfig());

  const stats = useMemo(() => {
    const topics = Object.keys(config.topics).length;
    const enabledSources = config.sources.filter((source) => source.enabled).length;
    const requiredSecrets = config.secrets.filter((secret) => secret.required);
    const configuredRequiredSecrets = requiredSecrets.filter((secret) => secret.configured).length;
    return {
      topics,
      sources: config.sources.length,
      enabledSources,
      requiredSecrets: requiredSecrets.length,
      configuredRequiredSecrets
    };
  }, [config]);

  function setConfig(next: RuntimeConfig) {
    setConfigState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateConfig(mutator: (draft: RuntimeConfig) => void) {
    const next = cloneConfig(config);
    mutator(next);
    setConfig(next);
  }

  function resetConfig() {
    const next = cloneConfig(defaultRuntimeConfig);
    setConfig(next);
  }

  function importConfig(raw: string) {
    const parsed = JSON.parse(raw) as RuntimeConfig;
    setConfig({ ...cloneConfig(defaultRuntimeConfig), ...parsed });
  }

  return {
    config,
    stats,
    setConfig,
    updateConfig,
    resetConfig,
    importConfig,
    exportConfig: () => JSON.stringify(config, null, 2)
  };
}
