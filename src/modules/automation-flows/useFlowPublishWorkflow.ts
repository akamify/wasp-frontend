import { useEffect, useMemo, useRef, useState } from "react";
import { flowDraftFingerprint } from "@modules/automation-flows/flowDraftFingerprint";
import { flowsApi } from "@modules/automation-flows/flowsApi";
import type {
  AutomationFlow,
  FlowDraftPayload,
  FlowValidationResult,
} from "@modules/automation-flows/types";

export type ValidationStatus = "idle" | "passed" | "failed";

interface WorkflowOptions {
  flowId?: string;
  flow: AutomationFlow | null;
  name: string;
  isDirty: boolean;
  payload: FlowDraftPayload;
  setFlow: (flow: AutomationFlow) => void;
  setName: (name: string) => void;
  markSaved: () => void;
  showValidation: (result: FlowValidationResult) => void;
  toast: (message: string, tone?: "success" | "error" | "warning" | "info") => void;
}

function requestMessage(error: unknown, fallback: string) {
  const errorLike = error as {
    userMessage?: string;
    message?: string;
    response?: { data?: { message?: string } };
  };
  return errorLike.userMessage || errorLike.response?.data?.message || errorLike.message || fallback;
}

function validationFromError(error: unknown): FlowValidationResult | null {
  const errorLike = error as {
    response?: {
      data?: {
        valid?: boolean;
        errors?: FlowValidationResult["errors"];
        warnings?: FlowValidationResult["warnings"];
        details?: FlowValidationResult;
      };
    };
  };
  const data = errorLike.response?.data;
  if (data?.details?.errors) return data.details;
  if (Array.isArray(data?.errors)) {
    return { valid: Boolean(data.valid), errors: data.errors, warnings: data.warnings || [] };
  }
  return null;
}

export function useFlowPublishWorkflow({
  flowId,
  flow,
  name,
  isDirty,
  payload,
  setFlow,
  setName,
  markSaved,
  showValidation,
  toast,
}: WorkflowOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastValidatedAt, setLastValidatedAt] = useState<Date | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationErrors, setValidationErrors] = useState<FlowValidationResult["errors"]>([]);
  const [validationWarnings, setValidationWarnings] = useState<FlowValidationResult["warnings"]>([]);
  const [savedDraftHash, setSavedDraftHash] = useState("");
  const [validatedDraftHash, setValidatedDraftHash] = useState<string | null>(null);
  const saveLock = useRef(false);
  const validateLock = useRef(false);
  const publishLock = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const currentDraftHash = useMemo(
    () =>
      flowDraftFingerprint({
        name: name.trim(),
        description: flow?.description || "",
        payload,
      }),
    [flow?.description, name, payload]
  );

  useEffect(() => {
    if (isDirty || lastSavedAt || savedDraftHash === currentDraftHash) return;
    setSavedDraftHash(currentDraftHash);
    const backendValidationIsCurrent =
      flow?.lastValidationStatus === "passed" &&
      Boolean(flow.draftHash) &&
      flow.draftHash === flow.lastValidatedDraftHash;
    setValidationStatus(
      backendValidationIsCurrent
        ? "passed"
        : flow?.lastValidationStatus === "failed"
          ? "failed"
          : "idle"
    );
    setValidatedDraftHash(backendValidationIsCurrent ? currentDraftHash : null);
    setValidationErrors(flow?.lastValidationErrors || []);
    setValidationWarnings(flow?.lastValidationWarnings || []);
    setLastValidatedAt(
      backendValidationIsCurrent && flow?.lastValidatedAt
        ? new Date(flow.lastValidatedAt)
        : null
    );
  }, [currentDraftHash, flow, isDirty, lastSavedAt, savedDraftHash]);

  useEffect(() => {
    if (!isDirty) return;
    setValidationStatus("idle");
    setValidatedDraftHash(null);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, [currentDraftHash, isDirty]);

  const operationInProgress = isSaving || isValidating || isPublishing;
  const canSave = isDirty && !operationInProgress;
  const canValidate = !isDirty && Boolean(savedDraftHash) && !operationInProgress;
  const canPublish =
    !isDirty &&
    validationStatus === "passed" &&
    Boolean(savedDraftHash) &&
    validatedDraftHash === savedDraftHash &&
    !operationInProgress;

  async function save() {
    if (saveLock.current || operationInProgress) return null;
    if (!flowId || !flow || !name.trim()) {
      toast("Flow name is required.", "warning");
      return null;
    }
    if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
      toast("Flow nodes and edges must be valid before saving.", "warning");
      return null;
    }

    saveLock.current = true;
    setIsSaving(true);
    try {
      let currentFlow = flow;
      if (name.trim() !== flow.name) {
        currentFlow = (await flowsApi.updateMetadata(flowId, { name: name.trim() })).flow;
      }
      const response = await flowsApi.saveDraft(flowId, payload);
      if (!mounted.current) return null;
      const saved = { ...response.flow, name: currentFlow.name };
      const savedHash = flowDraftFingerprint({
        name: saved.name.trim(),
        description: saved.description || "",
        payload,
      });
      setFlow(saved);
      setName(saved.name);
      markSaved();
      setSavedDraftHash(savedHash);
      setLastSavedAt(new Date());
      setValidationStatus("idle");
      setValidatedDraftHash(null);
      setValidationErrors([]);
      setValidationWarnings([]);
      toast("Changes saved", "success");
      return saved;
    } catch (error) {
      toast(requestMessage(error, "Unable to save flow draft."), "error");
      return null;
    } finally {
      saveLock.current = false;
      if (mounted.current) setIsSaving(false);
    }
  }

  async function validate() {
    if (isDirty) {
      toast("Please save changes before validating.", "warning");
      return;
    }
    if (!flowId || !flow || !savedDraftHash || validateLock.current || operationInProgress) return;
    validateLock.current = true;
    setIsValidating(true);
    try {
      const result = await flowsApi.validate(flowId);
      if (!mounted.current) return;
      setValidationErrors(result.errors || []);
      setValidationWarnings(result.warnings || []);
      setLastValidatedAt(new Date());
      setValidationStatus(result.valid ? "passed" : "failed");
      setValidatedDraftHash(result.valid ? savedDraftHash : null);
      showValidation(result);
      toast(result.valid ? "Flow validation passed" : "Flow validation failed", result.valid ? "success" : "warning");
    } catch (error) {
      setValidationStatus("failed");
      setValidatedDraftHash(null);
      toast(requestMessage(error, "Unable to validate flow."), "error");
    } finally {
      validateLock.current = false;
      if (mounted.current) setIsValidating(false);
    }
  }

  async function publish() {
    if (isDirty) {
      toast("You have unsaved changes. Save and validate before publishing.", "warning");
      return;
    }
    if (validationStatus !== "passed") {
      toast("Please validate the flow before publishing.", "warning");
      return;
    }
    if (!savedDraftHash || validatedDraftHash !== savedDraftHash) {
      toast("Flow changed after validation. Please validate again.", "warning");
      return;
    }
    if (!flowId || !flow || publishLock.current || operationInProgress) return;

    publishLock.current = true;
    setIsPublishing(true);
    try {
      const result = await flowsApi.publish(flowId);
      if (!mounted.current) return;
      setFlow({ ...flow, status: "active", activeVersionId: result.version._id });
      toast("Flow published successfully", "success");
    } catch (error) {
      const result = validationFromError(error);
      if (result) {
        setValidationStatus("failed");
        setValidatedDraftHash(null);
        setValidationErrors(result.errors || []);
        setValidationWarnings(result.warnings || []);
        showValidation(result);
      }
      toast(requestMessage(error, "Unable to publish flow."), "error");
    } finally {
      publishLock.current = false;
      if (mounted.current) setIsPublishing(false);
    }
  }

  return {
    isSaving,
    isValidating,
    isPublishing,
    operationInProgress,
    lastSavedAt,
    lastValidatedAt,
    validationStatus,
    validationErrors,
    validationWarnings,
    savedDraftHash,
    currentDraftHash,
    validatedDraftHash,
    canSave,
    canValidate,
    canPublish,
    save,
    validate,
    publish,
  };
}
