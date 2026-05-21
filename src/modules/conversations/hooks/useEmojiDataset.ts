import { useEffect, useMemo, useState } from "react";

export type EmojiItem = { char: string; name?: string; category?: string };

const EMOJI_DATA_URL = "https://unpkg.com/emoji.json@13.1.0/emoji.json";
const EMOJI_CACHE_KEY = "emoji_dataset_v1";

export function useEmojiDataset(enabled: boolean) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<EmojiItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (items.length) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const cached = localStorage.getItem(EMOJI_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            if (alive) setItems(parsed);
            if (alive) setLoading(false);
            return;
          }
        }
      } catch {
        // ignore cache errors
      }

      try {
        const res = await fetch(EMOJI_DATA_URL, { cache: "force-cache" });
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
              .map((e: any) => ({
                char: String(e?.char || e?.emoji || "").trim(),
                name: e?.name ? String(e.name) : undefined,
                category: e?.category ? String(e.category) : undefined,
              }))
              .filter((e: any) => e.char)
          : [];
        if (!alive) return;
        setItems(list);
        try {
          localStorage.setItem(EMOJI_CACHE_KEY, JSON.stringify(list));
        } catch {
          // ignore cache write errors
        }
      } catch {
        if (alive) setItems([{ char: "🙂" }, { char: "😂" }, { char: "❤️" }, { char: "🔥" }, { char: "✅" }]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled, items.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.length ? items : [];
    if (!q) return list.slice(0, 480);
    return list
      .filter((e) => (e.name ? e.name.toLowerCase().includes(q) : false) || (e.category ? e.category.toLowerCase().includes(q) : false))
      .slice(0, 480);
  }, [search, items]);

  return { search, setSearch, items, loading, filtered };
}

