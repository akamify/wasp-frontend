import { API } from "@api/api";

export interface ApprovedFlowTemplate {
  id: string;
  name: string;
  languageCode: string;
  category: string;
  status: string;
  components: unknown[];
  variableSchema?: Array<{
    component: "header" | "body" | "button";
    index: number;
    buttonIndex?: number;
  }>;
}

export interface ContactAttributeOption {
  key: string;
  label: string;
  active: boolean;
}

export interface MediaAssetOption {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: string;
  publicUrl: string;
  status: string;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function listFromResponse(response: unknown, keys: string[]) {
  const root = asObject(response);
  const data = asObject(root.data);
  const candidates = [
    response,
    ...keys.map((key) => root[key]),
    ...keys.map((key) => data[key]),
  ];
  return candidates.find(Array.isArray) as unknown[] | undefined;
}

export async function listApprovedTemplates(): Promise<ApprovedFlowTemplate[]> {
  const response = await API.templates.approved();
  const list = listFromResponse(response, ["templates", "items", "results"]) || [];
  return list
    .map((item) => {
      const record = asObject(item);
      return {
        id: String(record.id || record._id || ""),
        name: String(record.name || ""),
        languageCode: String(record.languageCode || record.language || "en"),
        category: String(record.category || ""),
        status: String(record.status || ""),
        components: Array.isArray(record.components) ? record.components : [],
        variableSchema: Array.isArray(record.variableSchema)
          ? (record.variableSchema as ApprovedFlowTemplate["variableSchema"])
          : [],
      };
    })
    .filter(
      (template) =>
        template.name && template.status.toLowerCase() === "approved"
    );
}

export async function listContactAttributeOptions(): Promise<ContactAttributeOption[]> {
  const response = await API.contacts.attributes({ includeInactive: false });
  const list = listFromResponse(response, ["definitions", "attributes", "items", "results"]) || [];
  return list
    .map((item) => {
      const record = asObject(item);
      return {
        key: String(record.key || record.name || ""),
        label: String(record.label || record.name || record.key || ""),
        active: record.active !== false,
      };
    })
    .filter((attribute) => attribute.key && attribute.active);
}

export async function uploadMediaAsset(
  file: File,
  mediaType: string,
  onProgress?: (pct: number) => void
): Promise<MediaAssetOption> {
  const response = await API.media.upload(file, mediaType, onProgress);
  const record = asObject(response);
  const asset = asObject(record.asset || response);
  return {
    id: String(asset.id || asset._id || ""),
    originalName: String(asset.originalName || asset.name || file.name),
    mimeType: String(asset.mimeType || file.type || ""),
    sizeBytes: Number(asset.sizeBytes || file.size || 0),
    mediaType: String(asset.mediaType || mediaType),
    publicUrl: String(asset.publicUrl || ""),
    status: String(asset.status || "ready"),
  };
}

export async function listMediaAssets(mediaType?: string): Promise<MediaAssetOption[]> {
  const response = await API.media.list(mediaType ? { type: mediaType } : {});
  const list = listFromResponse(response, ["assets", "media", "items", "results"]) || [];
  return list
    .map((item) => {
      const record = asObject(item);
      return {
        id: String(record.id || record._id || ""),
        originalName: String(record.originalName || record.name || ""),
        mimeType: String(record.mimeType || ""),
        sizeBytes: Number(record.sizeBytes || 0),
        mediaType: String(record.mediaType || ""),
        publicUrl: String(record.publicUrl || ""),
        status: String(record.status || ""),
      };
    })
    .filter((asset) => asset.id && asset.status !== "deleted");
}
