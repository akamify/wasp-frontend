import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_AUTOMATION_BUILDER_PREFERENCES,
  getAutomationBuilderPreferences,
  updateAutomationBuilderPreferences,
  type AutomationBuilderPreferences,
} from "@modules/automation-flows/preferencesApi";
import { useAuth } from "@shared/providers/AuthContext";

const PATCH_DELAY_MS = 400;
const LEGACY_LEFT_KEY = "automationBuilder.leftSidebarCollapsed";
const LEGACY_RIGHT_KEY = "automationBuilder.rightSidebarOpen";

function desktopViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

function cacheKey(workspaceId?: string, userId?: string) {
  return `automationBuilder.preferences.${workspaceId || "unknown"}.${userId || "unknown"}`;
}

function readCache(key: string): AutomationBuilderPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_AUTOMATION_BUILDER_PREFERENCES;
  }
  try {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const cached: unknown = JSON.parse(stored);
      if (cached && typeof cached === "object") {
        return {
          ...DEFAULT_AUTOMATION_BUILDER_PREFERENCES,
          ...(cached as Partial<AutomationBuilderPreferences>),
        };
      }
    }
    const legacyLeft = window.localStorage.getItem(LEGACY_LEFT_KEY);
    const legacyRight = window.localStorage.getItem(LEGACY_RIGHT_KEY);
    return {
      ...DEFAULT_AUTOMATION_BUILDER_PREFERENCES,
      leftSidebarCollapsed:
        legacyLeft === null
          ? DEFAULT_AUTOMATION_BUILDER_PREFERENCES.leftSidebarCollapsed
          : legacyLeft === "true",
      rightSettingsOpen:
        legacyRight === null
          ? DEFAULT_AUTOMATION_BUILDER_PREFERENCES.rightSettingsOpen
          : legacyRight === "true",
    };
  } catch {
    return DEFAULT_AUTOMATION_BUILDER_PREFERENCES;
  }
}

export function useAutomationBuilderPreferences() {
  const { user, workspace } = useAuth();
  const key = useMemo(
    () => cacheKey(workspace?.id, user?.id),
    [user?.id, workspace?.id]
  );
  const [preferences, setPreferences] = useState(() => readCache(key));
  const [isDesktop, setIsDesktop] = useState(desktopViewport);
  const [mobileBlocksOpen, setMobileBlocksOpen] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const pendingRef = useRef<Partial<AutomationBuilderPreferences>>({});
  const patchTimerRef = useRef<number | null>(null);

  const persistCache = useCallback(
    (next: AutomationBuilderPreferences) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (error: unknown) {
        console.warn("[AUTOMATION_BUILDER_PREFERENCES_CACHE_FAILED]", error);
      }
    },
    [key]
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => {
      setIsDesktop(query.matches);
      if (query.matches) setMobileBlocksOpen(false);
    };
    updateViewport();
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    let active = true;
    const cached = readCache(key);
    setPreferences(cached);
    setLoadingPreferences(true);

    if (!user?.id || !workspace?.id) {
      setLoadingPreferences(false);
      return () => {
        active = false;
      };
    }

    void getAutomationBuilderPreferences()
      .then((remote) => {
        if (!active) return;
        setPreferences(remote);
        persistCache(remote);
      })
      .catch((error: unknown) => {
        console.warn("[AUTOMATION_BUILDER_PREFERENCES_LOAD_FAILED]", error);
      })
      .finally(() => {
        if (active) setLoadingPreferences(false);
      });

    return () => {
      active = false;
    };
  }, [key, persistCache, user?.id, workspace?.id]);

  useEffect(
    () => () => {
      if (patchTimerRef.current !== null) {
        window.clearTimeout(patchTimerRef.current);
      }
    },
    []
  );

  const updatePreference = useCallback(
    (partial: Partial<AutomationBuilderPreferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...partial };
        persistCache(next);
        return next;
      });
      pendingRef.current = { ...pendingRef.current, ...partial };
      if (patchTimerRef.current !== null) {
        window.clearTimeout(patchTimerRef.current);
      }
      patchTimerRef.current = window.setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = {};
        patchTimerRef.current = null;
        if (!user?.id || !workspace?.id || Object.keys(pending).length === 0) {
          return;
        }
        void updateAutomationBuilderPreferences(pending).catch(
          (error: unknown) => {
            console.warn("[AUTOMATION_BUILDER_PREFERENCES_SAVE_FAILED]", error);
          }
        );
      }, PATCH_DELAY_MS);
    },
    [persistCache, user?.id, workspace?.id]
  );

  const setLeftSidebarCollapsed = useCallback(
    (value: boolean) => updatePreference({ leftSidebarCollapsed: value }),
    [updatePreference]
  );
  const setRightSidebarOpen = useCallback(
    (value: boolean) => updatePreference({ rightSettingsOpen: value }),
    [updatePreference]
  );
  const toggleBlocks = useCallback(() => {
    if (desktopViewport()) {
      setLeftSidebarCollapsed(!preferences.leftSidebarCollapsed);
      return;
    }
    setMobileBlocksOpen((current) => !current);
  }, [preferences.leftSidebarCollapsed, setLeftSidebarCollapsed]);
  const toggleSettings = useCallback(
    () => setRightSidebarOpen(!preferences.rightSettingsOpen),
    [preferences.rightSettingsOpen, setRightSidebarOpen]
  );

  return {
    ...preferences,
    rightSidebarOpen: preferences.rightSettingsOpen,
    loadingPreferences,
    isDesktop,
    mobileBlocksOpen,
    setMobileBlocksOpen,
    setLeftSidebarCollapsed,
    setRightSidebarOpen,
    toggleBlocks,
    toggleSettings,
    updatePreference,
  };
}
