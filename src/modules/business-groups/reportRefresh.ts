type RefreshOptions<T> = {
  load: (signal: AbortSignal) => Promise<T>;
  onSuccess: (value: T) => void;
  onError: (error: unknown) => void;
  onLoading: (loading: boolean) => void;
  canRefresh: () => boolean;
  repeat: boolean;
};

// Schedule after completion so a slow request never overlaps the next poll.
export function startReportRefresh<T>(options: RefreshOptions<T>) {
  let stopped = false;
  let active: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (!stopped && options.repeat) timer = setTimeout(() => { void refresh(); }, 30000);
  };
  async function refresh() {
    if (stopped || active) return;
    clearTimeout(timer);
    if (!options.canRefresh()) { schedule(); return; }
    const controller = new AbortController();
    active = controller;
    options.onLoading(true);
    try {
      const value = await options.load(controller.signal);
      if (!stopped) options.onSuccess(value);
    } catch (error) {
      if (!stopped) options.onError(error);
    } finally {
      active = null;
      if (!stopped) { options.onLoading(false); schedule(); }
    }
  }
  void refresh();
  return {
    refresh,
    stop() { stopped = true; clearTimeout(timer); active?.abort(); },
  };
}
