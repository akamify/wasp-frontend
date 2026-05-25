export type FlowTemplateType = "with_endpoint" | "without_endpoint";

export type FlowFieldType =
  | "text"
  | "email"
  | "password"
  | "radio"
  | "checkbox"
  | "select"
  | "textarea";

export type FlowFieldOption = {
  label: string;
  value: string;
};

export type FlowField = {
  id: string;
  type: FlowFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: FlowFieldOption[];
};

export type FlowScreen = {
  id: string;
  title: string;
  subtitle?: string;
  fields: FlowField[];
  footerButton: {
    text: string;
    action: "next" | "submit";
  };
};

export type FlowTemplate = {
  id: string;
  name: string;
  category: string;
  type: FlowTemplateType;
  description?: string;
  endpointHint?: string;
  screens: FlowScreen[];
};

export const FLOW_CATEGORIES = [
  "Sign up",
  "Log in",
  "Appointment booking",
  "Lead generation",
  "Shopping",
  "Customer support",
  "Survey",
  "Other",
];


import { FLOW_TEMPLATES } from "./templateEngine.templates";
export { FLOW_TEMPLATES };

export function templateToFlowJson(template: FlowTemplate) {
  return {
    version: "3.1",
    type: template.type,
    screens: template.screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      layout: {
        type: "SingleColumnLayout",
        children: screen.fields.map((f) => ({
          type: f.type,
          name: f.id,
          label: f.label,
          required: !!f.required,
          options: f.options || undefined,
          placeholder: f.placeholder || undefined,
        })),
      },
      footer: screen.footerButton,
    })),
  };
}

