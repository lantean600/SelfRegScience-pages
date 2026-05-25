"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadCtdpUiSettings,
  saveCtdpUiSettings,
  type CtdpUiSettings,
} from "@/lib/ctdp-ui-settings";

const CtdpSettingsContext = createContext<{
  settings: CtdpUiSettings;
  setSettings: (next: CtdpUiSettings) => void;
  patchSettings: (patch: Partial<CtdpUiSettings>) => void;
} | null>(null);

export function CtdpSettingsProvider({
  children,
  serverDefaults,
}: {
  children: ReactNode;
  serverDefaults?: {
    appointmentMinutes: number;
    defaultFocusMinutes: number;
  };
}) {
  const [settings, setSettingsState] = useState<CtdpUiSettings>(() =>
    loadCtdpUiSettings(serverDefaults),
  );

  const setSettings = useCallback((next: CtdpUiSettings) => {
    setSettingsState(next);
    saveCtdpUiSettings(next);
  }, []);

  const patchSettings = useCallback((patch: Partial<CtdpUiSettings>) => {
    setSettingsState((prev) => {
      const next: CtdpUiSettings = {
        ...prev,
        ...patch,
        nodeColors: patch.nodeColors
          ? { ...prev.nodeColors, ...patch.nodeColors }
          : prev.nodeColors,
      };
      saveCtdpUiSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, patchSettings }),
    [settings, setSettings, patchSettings],
  );

  return (
    <CtdpSettingsContext.Provider value={value}>
      {children}
    </CtdpSettingsContext.Provider>
  );
}

export function useCtdpSettings() {
  const ctx = useContext(CtdpSettingsContext);
  if (!ctx) throw new Error("useCtdpSettings must be used within CtdpSettingsProvider");
  return ctx;
}
