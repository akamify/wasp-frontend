export function buildApiGroupSecondary(api, unwrap, API_BASE_URL) {
  return {
    public: {
      page: (slug) => api.get(`/public/pages/${encodeURIComponent(slug)}`).then(unwrap),
      platformBrandGet: () => api.get("/public/platform-brand").then(unwrap),
      createSupportTicket: (payload) => api.post("/public/support-tickets", payload).then(unwrap),
      applyCareer: (payload, file, onProgress) => {
        const data = new FormData();
        Object.entries(payload || {}).forEach(([k, v]) => data.append(k, String(v ?? "")));
        data.append("resume", file);
        return api.post("/public/careers/apply", data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!onProgress) return;
            const total = e.total || 0;
            const loaded = e.loaded || 0;
            onProgress(total ? Math.round((loaded / total) * 100) : 0);
          },
        }).then(unwrap);
      },
    },
    workspaces: {
      list: () => api.get("/workspaces").then(unwrap),
      create: (payload) => api.post("/workspaces", payload).then(unwrap),
      overview: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/overview`).then(unwrap),
      update: (workspaceId, payload) => api.patch(`/workspaces/${encodeURIComponent(workspaceId)}`, payload).then(unwrap),
      members: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/members`).then(unwrap),
      inviteMember: (workspaceId, payload) => api.post(`/workspaces/${encodeURIComponent(workspaceId)}/members`, payload).then(unwrap),
      updateMember: (workspaceId, memberId, payload) => api.patch(`/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`, payload).then(unwrap),
      usage: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/usage`).then(unwrap),
      activity: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/activity`).then(unwrap),
      billingCurrent: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/billing/current`).then(unwrap),
      wallet: (workspaceId) => api.get(`/workspaces/${encodeURIComponent(workspaceId)}/wallet`).then(unwrap),
    },
    credentials: {
      getWhatsApp: () => api.get("/credentials/whatsapp").then(unwrap),
      upsertWhatsApp: (payload) => api.put("/credentials/whatsapp", payload).then(unwrap),
      deleteWhatsApp: () => api.delete("/credentials/whatsapp").then(unwrap),
    },
    templates: {
      list: (params) => api.get("/templates", { params }).then(unwrap),
      create: (payload) => api.post("/templates", payload, { timeout: 180000 }).then(unwrap),
      get: (id) => api.get(`/templates/${id}`).then(unwrap),
      update: (id, payload) => api.put(`/templates/${id}`, payload).then(unwrap),
      remove: (id) => api.delete(`/templates/${id}`).then(unwrap),
      submit: (id) => api.post(`/templates/${id}/submit`, null, { timeout: 180000 }).then(unwrap),
      status: (id) => api.get(`/templates/${id}/status`).then(unwrap),
      syncMeta: (payload) => api.post("/templates/sync-meta", payload || {}).then(unwrap),
      refreshWhatsApp: () => api.post("/integrations/whatsapp/templates/refresh", {}).then(unwrap),
      uploadMedia: (file, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        return api.post("/templates/media", data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!onProgress) return;
            const total = e.total || 0;
            const loaded = e.loaded || 0;
            onProgress(total ? Math.round((loaded / total) * 100) : 0);
          },
        }).then(unwrap);
      },
      downloadMediaByHandle: (handle) => api.get(`/templates/media/handle/${encodeURIComponent(handle)}`, { responseType: "blob" }).then((r) => r.data),
    },
    messages: {
      send: (payload) => api.post("/messages/send", payload).then(unwrap),
      sendText: (payload) => api.post("/messages/send-text", payload).then(unwrap),
      sendMedia: (payload) => api.post("/messages/send-media", payload).then(unwrap),
      bulk: (payload) => api.post("/messages/bulk", payload).then(unwrap),
      logs: (params) => api.get("/messages/logs", { params }).then(unwrap),
      status: (waId) => api.get(`/messages/status/${encodeURIComponent(waId)}`).then(unwrap),
      byPhone: (phone, params) => api.get(`/messages/${phone}`, { params }).then(unwrap),
      downloadMedia: (id) => api.get(`/messages/media/${encodeURIComponent(id)}`, { responseType: "blob" }).then((r) => r.data),
      uploadMedia: (file, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        return api.post("/messages/media", data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!onProgress) return;
            const total = e.total || 0;
            const loaded = e.loaded || 0;
            onProgress(total ? Math.round((loaded / total) * 100) : 0);
          },
        }).then(unwrap);
      },
    },
    analytics: {
      overview: (params) => api.get("/analytics/overview", { params }).then(unwrap),
      template: (id) => api.get(`/analytics/template/${id}`).then(unwrap),
    },
    meta: {
      status: () => api.get("/meta/status").then(unwrap),
      subscriptionHealth: () => api.get("/meta/subscription-health").then(unwrap),
      embeddedSignupExchange: (payload) => api.post("/integrations/whatsapp/embedded-signup/exchange", payload).then(unwrap),
      connection: () => api.get("/integrations/whatsapp/connection").then(unwrap),
      refreshConnectionMetadata: () => api.post("/integrations/whatsapp/connection/refresh-metadata").then(unwrap),
      disconnect: () => api.post("/integrations/whatsapp/disconnect").then(unwrap),
      updateProfile: (payload) => api.put("/meta/profile", payload).then(unwrap),
      uploadProfilePicture: (file) => {
        const data = new FormData();
        data.append("file", file);
        return api.post("/meta/profile-picture", data, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
      },
      listFlows: (params) => api.get("/meta/flows", { params }).then(unwrap),
      createFlow: (payload) => api.post("/meta/flows", payload).then(unwrap),
      uploadFlowJson: (flowId, flowJson) => api.post(`/meta/flows/${encodeURIComponent(flowId)}/assets`, { flowJson }).then(unwrap),
      publishFlow: (flowId) => api.post(`/meta/flows/${encodeURIComponent(flowId)}/publish`).then(unwrap),
    },
    links: {
      create: (payload) => api.post("/links", payload).then(unwrap),
      tracked: {
        list: () => api.get("/links/tracked").then(unwrap),
        create: (payload) => api.post("/links/tracked", payload).then(unwrap),
        update: (id, payload) => api.put(`/links/tracked/${id}`, payload).then(unwrap),
        remove: (id) => api.delete(`/links/tracked/${id}`).then(unwrap),
        analytics: (id, params) => api.get(`/links/tracked/${id}/analytics`, { params }).then(unwrap),
        qrSvgUrl: (id) => `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.svg`,
        qrPngUrl: (id) => `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.png`,
      },
    },
    billing: {
      plans: () => api.get("/billing/plans").then(unwrap),
      current: () => api.get("/billing/current").then(unwrap),
      history: (params) => api.get("/billing/history", { params }).then(unwrap),
    },
    wallet: {
      get: () => api.get("/wallet").then(unwrap),
      createRechargeOrder: (payload) => api.post("/wallet/recharge/order", payload).then(unwrap),
      history: (params) => api.get("/wallet/history", { params }).then(unwrap),
    },
    campaigns: {
      list: (params) => api.get("/campaigns", { params }).then(unwrap),
      get: (id) => api.get(`/campaigns/${id}`).then(unwrap),
      estimate: (payload) => api.post("/campaigns/estimate", payload).then(unwrap),
      metrics: (id) => api.get(`/campaigns/${id}/metrics`).then(unwrap),
      messages: (id, params) => api.get(`/campaigns/${id}/messages`, { params }).then(unwrap),
      replies: (id, params) => api.get(`/campaigns/${id}/replies`, { params }).then(unwrap),
      creditUsage: (id) => api.get(`/campaigns/${id}/credit-usage`).then(unwrap),
      failedRecipients: (id) => api.get(`/campaigns/${id}/failed-recipients`).then(unwrap),
      retryFailed: (id) => api.post(`/campaigns/${id}/retry-failed`).then(unwrap),
      remove: (id, params) => api.delete(`/campaigns/${id}`, { params }).then(unwrap),
      action: (id, action) => api.post(`/campaigns/${id}/action`, { action }).then(unwrap),
      create: (payload) => api.post("/campaigns", payload).then(unwrap),
    },
    reports: {
      apiCampaigns: (params) => api.get("/reports/api-campaigns", { params }).then(unwrap),
      apiCampaign: (id) => api.get(`/reports/api-campaigns/${encodeURIComponent(id)}`).then(unwrap),
      apiMessages: (params) => api.get("/reports/api-messages", { params }).then(unwrap),
      apiMessage: (id) => api.get(`/reports/api-messages/${encodeURIComponent(id)}`).then(unwrap),
    },
    conversations: {
      list: (params) => api.get("/conversations", { params }).then(unwrap),
      get: (phone) => api.get(`/conversations/${phone}`).then(unwrap),
      read: (phone) => api.post(`/conversations/${phone}/read`).then(unwrap),
      clear: (phone) => api.delete(`/conversations/${phone}`).then(unwrap),
    },
    contacts: {
      list: (params) => api.get("/contacts", { params }).then(unwrap),
      get: (id) => api.get(`/contacts/${id}`).then(unwrap),
      lookupByPhone: (phone) => api.get(`/contacts/lookup/${phone}`).then(unwrap),
      create: (payload) => api.post("/contacts", payload).then(unwrap),
      update: (id, payload) => api.put(`/contacts/${id}`, payload).then(unwrap),
      remove: (id) => api.delete(`/contacts/${id}`).then(unwrap),
      exportCsv: (contactIds) => api.post("/contacts/export-csv", { contactIds: Array.isArray(contactIds) ? contactIds : [] }, { responseType: "blob" }),
    },
    automation: {
      triggerEvent: (payload) => api.post("/trigger-event", payload).then(unwrap),
    },
  };
}
