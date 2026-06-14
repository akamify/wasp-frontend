import type {
  BuilderNode,
  FlowNodeConfig,
  FlowNodeType,
  FlowTrigger,
} from "@modules/automation-flows/types";

export const DEFAULT_TRIGGER: FlowTrigger = {
  type: null,
  keywords: [],
  matchMode: "exact",
  templateButtonPayloads: [],
  ctwaPayloads: [],
};

const DEFAULT_CONFIGS: Record<FlowNodeType, FlowNodeConfig> = {
  start: { label: "Start" },
  text: { text: "", autoContinue: false },
  text_buttons: {
    text: "",
    buttons: [{ id: "button_1", title: "Option 1" }],
  },
  ask_question: { question: "", inputType: "text", saveToAttribute: "" },
  list: {
    text: "",
    buttonText: "View options",
    sections: [
      {
        title: "Options",
        rows: [{ id: "option_1", title: "Option 1", description: "" }],
      },
    ],
  },
  media: {
    mediaType: "image",
    sourceType: "url",
    mediaAssetId: "",
    url: "",
    mediaUrl: "",
    sourceKey: "",
    caption: "",
    filename: "",
    autoContinue: true,
  },
  template: {
    templateName: "",
    languageCode: "en",
    variables: [],
    templateConfig: {
      templateName: "",
      languageCode: "en",
      components: [],
    },
    autoContinue: false,
  },
  set_tag: { action: "add", tags: [] },
  set_attribute: { attributes: {} },
  api_request: {
    method: "GET",
    url: "",
    queryParams: {},
    headers: {},
    body: "",
    timeoutMs: 10000,
    responseMapping: {},
  },
  request_intervention: {
    message: "Please wait, our team will connect with you.",
    assignToTeamId: "",
  },
  end: { message: "" },
};

export function defaultNodeConfig(type: FlowNodeType): FlowNodeConfig {
  return structuredClone(DEFAULT_CONFIGS[type]);
}

export function createBuilderNode(
  type: FlowNodeType,
  position: { x: number; y: number },
  id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
): BuilderNode {
  return {
    id,
    type: "automationNode",
    position,
    data: { nodeType: type, config: defaultNodeConfig(type) },
  };
}

export function createStartNode(): BuilderNode {
  return createBuilderNode("start", { x: 120, y: 220 }, "start");
}
