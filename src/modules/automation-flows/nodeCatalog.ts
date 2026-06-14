import {
  CircleStop,
  FileText,
  GitBranch,
  Hand,
  Image,
  List,
  MessageCircle,
  MessageSquareText,
  Play,
  Send,
  Tags,
  TextCursorInput,
  UserRoundCog,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FlowNodeConfig, FlowNodeType } from "@modules/automation-flows/types";

export interface NodeCatalogItem {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "content" | "action";
}

export const NODE_CATALOG: NodeCatalogItem[] = [
  { type: "text", label: "Text", description: "Send a text message", icon: MessageSquareText, group: "content" },
  { type: "text_buttons", label: "Text + Buttons", description: "Offer up to 3 replies", icon: MessageCircle, group: "content" },
  { type: "ask_question", label: "Ask Question", description: "Collect user input", icon: TextCursorInput, group: "content" },
  { type: "list", label: "List", description: "Send selectable rows", icon: List, group: "content" },
  { type: "media", label: "Media", description: "Image, video or file", icon: Image, group: "content" },
  { type: "template", label: "Template", description: "Approved template", icon: FileText, group: "content" },
  { type: "set_tag", label: "Set Tag", description: "Add or remove tags", icon: Tags, group: "action" },
  { type: "set_attribute", label: "Set Attribute", description: "Update contact data", icon: UserRoundCog, group: "action" },
  { type: "api_request", label: "API Request", description: "Call an external API", icon: Webhook, group: "action" },
  { type: "request_intervention", label: "Human Handover", description: "Pause bot and assign", icon: Hand, group: "action" },
  { type: "end", label: "End", description: "Complete the session", icon: CircleStop, group: "action" },
];

export const NODE_META: Record<FlowNodeType, { label: string; icon: LucideIcon }> = {
  start: { label: "Flow Start", icon: Play },
  text: { label: "Text Message", icon: MessageSquareText },
  text_buttons: { label: "Text + Buttons", icon: MessageCircle },
  ask_question: { label: "Ask Question", icon: TextCursorInput },
  list: { label: "List Message", icon: List },
  media: { label: "Media Message", icon: Image },
  template: { label: "Template Message", icon: Send },
  set_tag: { label: "Set Tag", icon: Tags },
  set_attribute: { label: "Set Attribute", icon: UserRoundCog },
  api_request: { label: "API Request", icon: Webhook },
  request_intervention: { label: "Human Handover", icon: Hand },
  end: { label: "End Flow", icon: CircleStop },
};

function textValue(config: FlowNodeConfig, key: string) {
  return typeof config[key] === "string" ? String(config[key]) : "";
}

export function nodePreview(type: FlowNodeType, config: FlowNodeConfig) {
  if (type === "start") return "Entry point";
  if (type === "text" || type === "text_buttons") return textValue(config, "text") || "Message not configured";
  if (type === "ask_question") return textValue(config, "question") || "Question not configured";
  if (type === "list") return textValue(config, "text") || "List not configured";
  if (type === "media") {
    const sourceType = textValue(config, "sourceType") || (textValue(config, "mediaAssetId") ? "upload" : "url");
    if (sourceType === "upload" || sourceType === "library") {
      return textValue(config, "mediaAssetName") || "Selected media";
    }
    if (sourceType === "api_context") return textValue(config, "sourceKey") ? `API media: ${textValue(config, "sourceKey")}` : "API media key missing";
    if (sourceType === "contact_attribute") return textValue(config, "sourceKey") ? `Attribute media: ${textValue(config, "sourceKey")}` : "Attribute key missing";
    return textValue(config, "url") || textValue(config, "mediaUrl") || `${textValue(config, "mediaType") || "Media"} URL missing`;
  }
  if (type === "template") return textValue(config, "templateName") || "Template not selected";
  if (type === "set_tag") return `${textValue(config, "action") || "Add"} contact tags`;
  if (type === "set_attribute") return "Merge contact attributes";
  if (type === "api_request") return `${textValue(config, "method") || "GET"} ${textValue(config, "url") || "URL missing"}`;
  if (type === "request_intervention") return textValue(config, "message") || "Transfer to a person";
  return textValue(config, "message") || "Complete flow";
}

export function nodeHasWarning(type: FlowNodeType, config: FlowNodeConfig) {
  if (type === "text") return !textValue(config, "text").trim();
  if (type === "text_buttons") return !textValue(config, "text").trim() || !Array.isArray(config.buttons);
  if (type === "ask_question") return !textValue(config, "question").trim();
  if (type === "list") return !textValue(config, "text").trim() || !textValue(config, "buttonText").trim();
  if (type === "media") {
    const sourceType = textValue(config, "sourceType") || (textValue(config, "mediaAssetId") ? "upload" : "url");
    if (!textValue(config, "mediaType").trim()) return true;
    if (sourceType === "upload" || sourceType === "library") {
      return !textValue(config, "mediaAssetId").trim();
    }
    if (sourceType === "api_context" || sourceType === "contact_attribute") return !textValue(config, "sourceKey").trim();
    return !(textValue(config, "url") || textValue(config, "mediaUrl")).trim();
  }
  if (type === "template") return !textValue(config, "templateName").trim() || !textValue(config, "languageCode").trim();
  if (type === "set_tag") return !Array.isArray(config.tags) || config.tags.length === 0;
  if (type === "set_attribute") return !config.attributes || typeof config.attributes !== "object";
  if (type === "api_request") return !textValue(config, "url").trim();
  return false;
}

export function outputHandles(type: FlowNodeType, config: FlowNodeConfig) {
  if (type === "request_intervention" || type === "end") return [];
  if (type === "text_buttons") {
    const buttons = Array.isArray(config.buttons) ? config.buttons : [];
    return buttons.map((button, index) => {
      const value = button as { id?: string; title?: string };
      return { id: value.id || `button_${index + 1}`, label: value.title || `Button ${index + 1}` };
    });
  }
  if (type === "list") {
    const sections = Array.isArray(config.sections) ? config.sections : [];
    return sections.flatMap((section) => {
      const rows = Array.isArray((section as { rows?: unknown[] }).rows)
        ? (section as { rows: unknown[] }).rows
        : [];
      return rows.map((row, index) => {
        const value = row as { id?: string; title?: string };
        return { id: value.id || `row_${index + 1}`, label: value.title || `Row ${index + 1}` };
      });
    });
  }
  if (type === "api_request" || type === "media" || type === "template") return [{ id: "success", label: "Success" }, { id: "failure", label: "Failure" }];
  return [{ id: "default", label: "Next" }];
}
