export type FlowComponentType = "TextInput" | "Dropdown" | "Checkbox" | "Radio" | "Footer" | "Text";

export type FlowComponent = {
  id: string;
  type: FlowComponentType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  nextScreenId?: string;
};

export type ScreenNodeData = {
  title: string;
  components: FlowComponent[];
};

export type ValidationIssue = {
  id: string;
  level: "error" | "warning";
  message: string;
};
