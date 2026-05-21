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

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "default_basic",
    name: "Default",
    category: "Other",
    type: "without_endpoint",
    screens: [
      {
        id: "default_1",
        title: "Hello World",
        subtitle: "Let's start building things!",
        fields: [],
        footerButton: { text: "Complete", action: "submit" },
      },
    ],
  },
  {
    id: "signup_basic",
    name: "Sign up form",
    category: "Sign up",
    type: "without_endpoint",
    // description: "Collect new user details with consent.",
    screens: [
      {
        id: "signup_1",
        title: "Join Now",
        subtitle: "Get early access by registering.",
        fields: [
          { id: "name", type: "text", label: "Name", required: true, placeholder: "Name" },
          { id: "email", type: "email", label: "Email", required: true, placeholder: "Email" },
          { id: "terms", type: "checkbox", label: "I agree to the terms", required: true },
        ],
        footerButton: { text: "Continue", action: "submit" },
      },
    ],
  },
  {
    id: "login_basic",
    name: "Account Sign in / Sign up",
    category: "Log in",
    type: "with_endpoint",
    endpointHint: "Endpoint template available.",
    screens: [
      {
        id: "login_1",
        title: "Sign in",
        fields: [
          { id: "email", type: "email", label: "Email address", required: true, placeholder: "Email address" },
          { id: "password", type: "password", label: "Password", required: true, placeholder: "Password" },
        ],
        footerButton: { text: "Sign in", action: "submit" },
      },
    ],
  },
  {
    id: "appointment_booking",
    name: "Appointment booking",
    category: "Appointment booking",
    type: "with_endpoint",
    endpointHint: "Endpoint template available.",
    screens: [
      {
        id: "appt_1",
        title: "Appointment",
        fields: [
          {
            id: "department",
            type: "select",
            label: "Department",
            required: true,
            options: [
              { label: "Cardiology", value: "cardiology" },
              { label: "Orthopedic", value: "ortho" },
              { label: "General", value: "general" },
            ],
          },
          {
            id: "location",
            type: "select",
            label: "Location",
            required: true,
            options: [
              { label: "Downtown", value: "downtown" },
              { label: "Airport Road", value: "airport" },
            ],
          },
          { id: "date", type: "text", label: "Date", required: true, placeholder: "Date" },
          { id: "time", type: "text", label: "Time", required: true, placeholder: "Time" },
        ],
        footerButton: { text: "Continue", action: "submit" },
      },
    ],
  },
  {
    id: "lead_loan",
    name: "Get leads for a pre-approved loan / credit card",
    category: "Lead generation",
    type: "with_endpoint",
    endpointHint: "Endpoint template available.",
    screens: [
      {
        id: "lead_1",
        title: "Your pre-approved loan",
        subtitle: "Here is an offer exclusively made for you.",
        fields: [
          { id: "loan_amount", type: "text", label: "Loan amount", placeholder: "7,20,000" },
          { id: "tenure", type: "select", label: "Tenure", options: [{ label: "24 months", value: "24" }, { label: "48 months", value: "48" }] },
        ],
        footerButton: { text: "Continue", action: "submit" },
      },
    ],
  },
  {
    id: "shopping_interest",
    name: "Capture interest for a personalized offer",
    category: "Shopping",
    type: "with_endpoint",
    endpointHint: "Endpoint template available.",
    screens: [
      {
        id: "shop_1",
        title: "Black Friday Deals",
        subtitle: "What would you like to buy now",
        fields: [
          {
            id: "interest",
            type: "radio",
            label: "Choose one",
            options: [
              { label: "Mobile phones", value: "mobile" },
              { label: "eBook readers", value: "ebook" },
              { label: "Cameras", value: "camera" },
            ],
          },
        ],
        footerButton: { text: "Continue", action: "submit" },
      },
    ],
  },
  {
    id: "support_basic",
    name: "Customer support",
    category: "Customer support",
    type: "without_endpoint",
    screens: [
      {
        id: "support_1",
        title: "Get help",
        fields: [
          { id: "name", type: "text", label: "Name", placeholder: "Name" },
          { id: "order_number", type: "text", label: "Order number", placeholder: "Order number" },
          {
            id: "issue_type",
            type: "radio",
            label: "Choose a topic",
            options: [
              { label: "Orders and payments", value: "orders" },
              { label: "Maintenance", value: "maintenance" },
              { label: "Delivery", value: "delivery" },
              { label: "Returns", value: "returns" },
              { label: "Other", value: "other" },
            ],
          },
        ],
        footerButton: { text: "Done", action: "submit" },
      },
    ],
  },
  {
    id: "feedback_basic",
    name: "Get feedback",
    category: "Survey",
    type: "without_endpoint",
    screens: [
      {
        id: "feedback_1",
        title: "Feedback 1 of 2",
        fields: [
          {
            id: "recommend",
            type: "radio",
            label: "Would you recommend us to a friend?",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          { id: "comment", type: "textarea", label: "How could we do better?", placeholder: "Leave a comment (optional)" },
        ],
        footerButton: { text: "Continue", action: "next" },
      },
      {
        id: "feedback_2",
        title: "Feedback 2 of 2",
        fields: [
          {
            id: "rating",
            type: "radio",
            label: "How was your overall experience?",
            options: [
              { label: "Excellent", value: "5" },
              { label: "Good", value: "4" },
              { label: "Average", value: "3" },
              { label: "Poor", value: "2" },
            ],
          },
        ],
        footerButton: { text: "Submit", action: "submit" },
      },
    ],
  },
  {
    id: "survey_basic",
    name: "Send a survey",
    category: "Survey",
    type: "without_endpoint",
    screens: [
      {
        id: "survey_1",
        title: "Question 1 of 3",
        subtitle: "You've found the perfect deal, what do you do next?",
        fields: [
          {
            id: "q1",
            type: "checkbox",
            label: "Choose all that apply:",
            options: [
              { label: "Buy it right away", value: "buy_now" },
              { label: "Check reviews before buying", value: "reviews" },
              { label: "Share it with friends + family", value: "share" },
              { label: "Buy multiple, while its cheap", value: "multi" },
              { label: "None of the above", value: "none" },
            ],
          },
        ],
        footerButton: { text: "Continue", action: "next" },
      },
      {
        id: "survey_2",
        title: "Question 2 of 3",
        fields: [
          {
            id: "q2",
            type: "radio",
            label: "How often do you buy during sales?",
            options: [
              { label: "Always", value: "always" },
              { label: "Sometimes", value: "sometimes" },
              { label: "Rarely", value: "rarely" },
            ],
          },
        ],
        footerButton: { text: "Continue", action: "next" },
      },
      {
        id: "survey_3",
        title: "Question 3 of 3",
        fields: [{ id: "q3", type: "textarea", label: "Any suggestions?", placeholder: "Type your answer..." }],
        footerButton: { text: "Submit", action: "submit" },
      },
    ],
  },
];

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
