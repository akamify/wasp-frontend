import type { AxiosInstance } from "axios";

export const api: AxiosInstance;
export function getToken(): string;
export function getWorkspaceId(): string;
export function setWorkspaceId(workspaceId: string): void;
export function setToken(token: string): void;

// Keep responses loosely typed; the UI can narrow as needed.
export const API: {
  baseUrl: string;
  auth: {
    register(payload: any): Promise<any>;
    login(payload: any): Promise<any>;
    verifyLoginOtp(payload: any): Promise<any>;
    resendLoginOtp(payload: any): Promise<any>;
    verifyRegisterOtp(payload: any): Promise<any>;
    resendRegisterOtp(payload: any): Promise<any>;
    forgotPassword(payload: any): Promise<any>;
    resetPassword(payload: any): Promise<any>;
    me(): Promise<any>;
    apiKeyStatus(): Promise<any>;
    requestApiKeyOtp(payload: any): Promise<any>;
    verifyApiKeyOtp(payload: any): Promise<any>;
    updateProfile(payload: any): Promise<any>;
    changePassword(payload: any): Promise<any>;
    requestEnable2fa(): Promise<any>;
    verifyEnable2fa(payload: any): Promise<any>;
    disable2fa(): Promise<any>;
  };
  admin: {
    overview(): Promise<any>;
    users(): Promise<any>;
    templates(): Promise<any>;
    credentials(): Promise<any>;
    wallets(): Promise<any>;
  };
  workspaces: {
    list(): Promise<any>;
    create(payload: any): Promise<any>;
  };
  credentials: {
    getWhatsApp(): Promise<any>;
    upsertWhatsApp(payload: any): Promise<any>;
    deleteWhatsApp(): Promise<any>;
  };
  templates: {
    list(params?: any): Promise<any>;
    create(payload: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, payload: any): Promise<any>;
    remove(id: string): Promise<any>;
    submit(id: string): Promise<any>;
    status(id: string): Promise<any>;
    syncMeta(payload?: any): Promise<any>;
    uploadMedia(file: any, onProgress?: (pct: number) => void): Promise<any>;
    downloadMediaByHandle(handle: string): Promise<any>;
  };
  messages: {
    send(payload: any): Promise<any>;
    sendText(payload: any): Promise<any>;
    sendMedia(payload: any): Promise<any>;
    bulk(payload: any): Promise<any>;
    logs(params?: any): Promise<any>;
    status(waId: string): Promise<any>;
    byPhone(phone: string, params?: any): Promise<any>;
    downloadMedia(id: string): Promise<any>;
    uploadMedia(file: any, onProgress?: (pct: number) => void): Promise<any>;
  };
  analytics: {
    overview(): Promise<any>;
    template(id: string): Promise<any>;
  };
  meta: {
    status(): Promise<any>;
    subscriptionHealth(): Promise<any>;
    save(payload: any): Promise<any>;
    updateProfile(payload: any): Promise<any>;
    uploadProfilePicture(file: any): Promise<any>;
    listFlows(params?: any): Promise<any>;
    createFlow(payload: any): Promise<any>;
    uploadFlowJson(flowId: string, flowJson: any): Promise<any>;
    publishFlow(flowId: string): Promise<any>;
  };
  links: {
    create(payload: any): Promise<any>;
    tracked: {
      list(): Promise<any>;
      create(payload: any): Promise<any>;
      update(id: string, payload: any): Promise<any>;
      remove(id: string): Promise<any>;
      analytics(id: string, params?: any): Promise<any>;
      qrSvgUrl(id: string): string;
      qrPngUrl(id: string): string;
    };
  };
  wallet: {
    get(): Promise<any>;
    createRechargeOrder(payload: any): Promise<any>;
    history(params?: any): Promise<any>;
  };
  campaigns: {
    list(params?: any): Promise<any>;
    get(id: string): Promise<any>;
    estimate(payload: any): Promise<any>;
    metrics(id: string): Promise<any>;
    messages(id: string, params?: any): Promise<any>;
    replies(id: string, params?: any): Promise<any>;
    creditUsage(id: string): Promise<any>;
    failedRecipients(id: string): Promise<any>;
    retryFailed(id: string): Promise<any>;
    remove(id: string, params?: { force?: boolean }): Promise<any>;
    action(id: string, action: "pause" | "resume" | "stop" | "complete"): Promise<any>;
    create(payload: any): Promise<any>;
  };
  reports: {
    apiCampaigns(params?: any): Promise<any>;
    apiCampaign(id: string): Promise<any>;
    apiMessages(params?: any): Promise<any>;
    apiMessage(id: string): Promise<any>;
  };
  conversations: {
    clear(phone: string): Promise<any>;
    list(params?: any): Promise<any>;
    get(phone: string): Promise<any>;
    read(phone: string): Promise<any>;
  };
  contacts: {
    list(params?: any): Promise<any>;
    get(id: string): Promise<any>;
    lookupByPhone(phone: string): Promise<any>;
    create(payload: any): Promise<any>;
    update(id: string, payload: any): Promise<any>;
    remove(id: string): Promise<any>;
  };
  automation: {
    triggerEvent(payload: any): Promise<any>;
  };
};
