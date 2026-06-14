import { Input } from "@components/ui/Input";
import { MediaAssetIcon } from "@modules/automation-flows/components/MediaAssetPreview";
import type { MediaAssetOption } from "@modules/automation-flows/automationDataApi";
import {
  formatMediaBytes,
  type MediaType,
} from "@modules/automation-flows/mediaNodeConfig";

interface Props {
  assets: MediaAssetOption[];
  error: string;
  loading: boolean;
  mediaType: MediaType;
  search: string;
  selectedId: string;
  onSearchChange: (value: string) => void;
  onSelect: (asset: MediaAssetOption) => void;
}

export function MediaLibraryPicker({
  assets,
  error,
  loading,
  mediaType,
  search,
  selectedId,
  onSearchChange,
  onSelect,
}: Readonly<Props>) {
  return (
    <div className="space-y-3">
      <Input
        label="Search media"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search uploaded files..."
      />
      {loading ? (
        <p className="text-xs text-slate-400">Loading media library...</p>
      ) : null}
      {error ? (
        <p className="text-xs font-semibold text-rose-600">
          {error} Retry by changing the media type.
        </p>
      ) : null}
      {!loading && !error && assets.length === 0 ? (
        <p className="rounded-[6px] bg-slate-50 p-3 text-xs text-slate-500">
          No media uploaded yet.
        </p>
      ) : null}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset)}
            className={`flex w-full items-center gap-3 rounded-[7px] border p-3 text-left transition ${
              selectedId === asset.id
                ? "border-brand-400 bg-brand-50"
                : "border-slate-200 hover:border-brand-200"
            }`}
          >
            <MediaAssetIcon mediaType={mediaType} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-slate-700">
                {asset.displayName || asset.originalName}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatMediaBytes(asset.sizeBytes)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
