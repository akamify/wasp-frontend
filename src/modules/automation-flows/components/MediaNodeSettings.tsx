import { useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import {
  listContactAttributeOptions,
  listMediaAssets,
  uploadMediaAsset,
  type ContactAttributeOption,
  type MediaAssetOption,
} from "@modules/automation-flows/automationDataApi";
import {
  MediaAssetPreview,
} from "@modules/automation-flows/components/MediaAssetPreview";
import { MediaLibraryPicker } from "@modules/automation-flows/components/MediaLibraryPicker";
import { configBoolean, configString } from "@modules/automation-flows/configUtils";
import { flowsApi } from "@modules/automation-flows/flowsApi";
import {
  formatMediaBytes,
  MEDIA_UPLOAD_LIMITS,
  mediaFileExtension,
  type MediaSourceType,
  type MediaType,
} from "@modules/automation-flows/mediaNodeConfig";
import type { FlowNodeConfig } from "@modules/automation-flows/types";

interface Props {
  config: FlowNodeConfig;
  availableContextKeys: string[];
  flowId?: string;
  nodeId?: string;
  onChange: (config: FlowNodeConfig) => void;
}

export function MediaNodeSettings({
  config,
  availableContextKeys,
  flowId,
  nodeId,
  onChange,
}: Readonly<Props>) {
  const mediaType = configString(config, "mediaType", "image") as MediaType;
  const sourceType = configString(config, "sourceType", "url") as MediaSourceType;
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<MediaAssetOption[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<ContactAttributeOption[]>([]);
  const [search, setSearch] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");
  const limit = MEDIA_UPLOAD_LIMITS[mediaType];

  useEffect(() => {
    if (sourceType !== "library") return;
    let active = true;
    setLibraryLoading(true);
    setLibraryError("");
    void listMediaAssets(mediaType)
      .then((items) => {
        if (active) setAssets(items);
      })
      .catch(() => {
        if (active) setLibraryError("Could not load media library.");
      })
      .finally(() => {
        if (active) setLibraryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mediaType, sourceType]);

  useEffect(() => {
    if (sourceType !== "contact_attribute") return;
    let active = true;
    void listContactAttributeOptions()
      .then((items) => {
        if (active) setAttributeOptions(items);
      })
      .catch(() => {
        if (active) setAttributeOptions([]);
      });
    return () => {
      active = false;
    };
  }, [sourceType]);

  function update(patch: FlowNodeConfig) {
    onChange({ ...config, ...patch });
    setTestResult("");
  }

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    const extension = mediaFileExtension(file.name);
    if (!file.size) {
      setError("MEDIA_FILE_EMPTY: Select a non-empty file.");
      return;
    }
    if (file.size > limit.maxBytes) {
      setError(`MEDIA_FILE_TOO_LARGE: ${limit.helper}`);
      return;
    }
    if (!limit.extensions.includes(extension)) {
      setError(`MEDIA_EXTENSION_NOT_SUPPORTED: ${limit.helper}`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const asset = await uploadMediaAsset(file, mediaType, setProgress);
      update({
        sourceType: "upload",
        mediaAssetId: asset.id,
        mediaAssetName: asset.displayName || asset.originalName,
        mediaAssetUrl: asset.publicUrl,
        filename:
          mediaType === "document"
            ? configString(config, "filename") || asset.originalName
            : configString(config, "filename"),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "MEDIA_UPLOAD_FAILED: Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  function selectAsset(asset: MediaAssetOption) {
    update({
      sourceType: "library",
      mediaAssetId: asset.id,
      mediaAssetName: asset.displayName || asset.originalName,
      mediaAssetUrl: asset.publicUrl,
      filename:
        mediaType === "document"
          ? configString(config, "filename") || asset.originalName
          : configString(config, "filename"),
    });
  }

  async function testMedia() {
    setTestResult("Testing media source...");
    try {
      const result = await flowsApi.testMediaNode({
        flowId,
        nodeId,
        config,
      });
      setTestResult(
        result.ok
          ? `Media source is valid${result.fileInfo?.sizeBytes ? ` (${formatMediaBytes(result.fileInfo.sizeBytes)})` : ""}.`
          : `${result.code || "MEDIA_VALIDATION_FAILED"}: ${result.message || "Media validation failed."}`
      );
    } catch (testError) {
      setTestResult(
        testError instanceof Error ? testError.message : "Media validation failed."
      );
    }
  }

  const selectedName = configString(config, "mediaAssetName");
  const selectedUrl = configString(config, "mediaAssetUrl");
  const filteredAssets = assets.filter((asset) =>
    `${asset.displayName} ${asset.originalName}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
        Media captions are static. API media uses a structured dynamic URL source, not variable syntax.
      </p>
      <Select
        label="Media type"
        value={mediaType}
        onChange={(event) =>
          update({
            mediaType: event.target.value,
            mediaAssetId: "",
            mediaAssetName: "",
            mediaAssetUrl: "",
          })
        }
      >
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="document">Document</option>
        <option value="audio">Audio</option>
      </Select>
      <p className="text-[11px] font-semibold text-slate-500">{limit.helper}</p>
      <Select
        label="Source"
        value={sourceType}
        onChange={(event) => update({ sourceType: event.target.value })}
      >
        <option value="upload">Upload file</option>
        <option value="library">Media library</option>
        <option value="url">Public URL</option>
        <option value="api_context">API / Dynamic URL</option>
        <option value="contact_attribute">Contact attribute URL</option>
      </Select>

      {sourceType === "upload" ? (
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-slate-200 px-4 py-7 text-center transition hover:border-brand-300 hover:bg-brand-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void upload(event.dataTransfer.files?.[0]);
            }}
          >
            <UploadCloud size={24} className="text-brand-600" />
            <span className="mt-2 text-xs font-black text-slate-700">
              {uploading ? `Uploading ${progress}%` : "Drop file here or click to upload"}
            </span>
            <span className="mt-1 text-[10px] text-slate-400">{limit.helper}</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={limit.accept}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          {selectedName ? (
            <MediaAssetPreview name={selectedName} url={selectedUrl} mediaType={mediaType} />
          ) : null}
        </div>
      ) : null}

      {sourceType === "library" ? (
        <MediaLibraryPicker
          assets={filteredAssets}
          error={libraryError}
          loading={libraryLoading}
          mediaType={mediaType}
          search={search}
          selectedId={configString(config, "mediaAssetId")}
          onSearchChange={setSearch}
          onSelect={selectAsset}
        />
      ) : null}

      {sourceType === "url" ? (
        <Input
          label="Public media URL"
          value={configString(config, "url") || configString(config, "mediaUrl")}
          onChange={(event) => update({ url: event.target.value, mediaUrl: "" })}
          placeholder="https://..."
          hint="The URL must be publicly reachable by Meta. Variables are not supported."
        />
      ) : null}

      {sourceType === "api_context" ? (
        availableContextKeys.length ? (
          <Select
            label="API response URL field"
            value={configString(config, "sourceKey")}
            onChange={(event) => update({ sourceKey: event.target.value })}
          >
            <option value="">Select dynamic URL field...</option>
            {availableContextKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </Select>
        ) : (
          <Input
            label="API response context key"
            value={configString(config, "sourceKey")}
            onChange={(event) => update({ sourceKey: event.target.value })}
            placeholder="productImageUrl"
            hint="No API URL fields mapped yet. Add an API Request node and map a URL field."
          />
        )
      ) : null}

      {sourceType === "contact_attribute" ? (
        attributeOptions.length ? (
          <Select
            label="Contact attribute URL field"
            value={configString(config, "sourceKey")}
            onChange={(event) => update({ sourceKey: event.target.value })}
          >
            <option value="">Select contact attribute...</option>
            {attributeOptions.map((attribute) => (
              <option key={attribute.key} value={attribute.key}>{attribute.label || attribute.key}</option>
            ))}
          </Select>
        ) : (
          <Input
            label="Contact attribute URL key"
            value={configString(config, "sourceKey")}
            onChange={(event) => update({ sourceKey: event.target.value })}
            placeholder="invoiceUrl"
            hint="The selected contact attribute must contain a public media URL."
          />
        )
      ) : null}

      {mediaType !== "audio" ? (
        <Textarea
          label="Static caption"
          value={configString(config, "caption")}
          onChange={(event) => update({ caption: event.target.value })}
        />
      ) : null}
      {mediaType === "document" ? (
        <Input
          label="Filename"
          value={configString(config, "filename")}
          onChange={(event) => update({ filename: event.target.value })}
        />
      ) : null}
      <label className="flex items-center justify-between rounded-[5px] border border-slate-200 p-3">
        <span className="text-xs font-bold text-slate-700">Auto continue</span>
        <input
          type="checkbox"
          checked={configBoolean(config, "autoContinue")}
          onChange={(event) => update({ autoContinue: event.target.checked })}
          className="h-4 w-4 accent-emerald-600"
        />
      </label>
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
      {testResult ? <p className="text-xs font-semibold text-slate-600">{testResult}</p> : null}
      <Button type="button" variant="outline" onClick={() => void testMedia()}>
        Test Media
      </Button>
    </div>
  );
}
