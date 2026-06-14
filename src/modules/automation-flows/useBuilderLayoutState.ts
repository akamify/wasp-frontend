import { useCallback, useEffect, useState } from "react";

const LEFT_SIDEBAR_KEY = "automationBuilder.leftSidebarCollapsed";
const RIGHT_SIDEBAR_KEY = "automationBuilder.rightSidebarOpen";

function readBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return fallback;
}

function desktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

export function useBuilderLayoutState() {
  const [isDesktop, setIsDesktop] = useState(desktopViewport);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() =>
    readBoolean(LEFT_SIDEBAR_KEY, false)
  );
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() =>
    readBoolean(RIGHT_SIDEBAR_KEY, desktopViewport())
  );
  const [mobileBlocksOpen, setMobileBlocksOpen] = useState(false);

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
    window.localStorage.setItem(
      LEFT_SIDEBAR_KEY,
      String(leftSidebarCollapsed)
    );
  }, [leftSidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem(RIGHT_SIDEBAR_KEY, String(rightSidebarOpen));
  }, [rightSidebarOpen]);

  const toggleBlocks = useCallback(() => {
    if (desktopViewport()) {
      setLeftSidebarCollapsed((current) => !current);
      return;
    }
    setMobileBlocksOpen((current) => !current);
  }, []);

  const toggleSettings = useCallback(() => {
    setRightSidebarOpen((current) => !current);
  }, []);

  return {
    isDesktop,
    leftSidebarCollapsed,
    rightSidebarOpen,
    mobileBlocksOpen,
    setLeftSidebarCollapsed,
    setRightSidebarOpen,
    setMobileBlocksOpen,
    toggleBlocks,
    toggleSettings,
  };
}
