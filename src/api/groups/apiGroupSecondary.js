export function buildApiGroupSecondary(api, unwrap, API_BASE_URL) {
  return {
    public: {
      page: (slug) =>
        api.get(`/public/pages/${encodeURIComponent(slug)}`).then(unwrap),
      platformBrandGet: () => api.get("/public/platform-brand").then(unwrap),
      academyHome: () => api.get("/public/academy").then(unwrap),
      academyArticle: (categorySlug, articleSlug) =>
        api
          .get(`/public/academy/${encodeURIComponent(categorySlug)}/${encodeURIComponent(articleSlug)}`)
          .then(unwrap),
      academyRelated: (categorySlug, articleSlug) =>
        api
          .get(`/public/academy/${encodeURIComponent(categorySlug)}/${encodeURIComponent(articleSlug)}/related`)
          .then(unwrap),
      academySearch: (params) => api.get("/public/academy/search", { params }).then(unwrap),
      submitDocsFeedback: (payload) => api.post("/public/docs/feedback", payload).then(unwrap),
      createSupportTicket: (payload) =>
        api.post("/public/support-tickets", payload).then(unwrap),
      applyCareer: (payload, file, onProgress) => {
        const data = new FormData();
        Object.entries(payload || {}).forEach(([k, v]) =>
          data.append(k, String(v ?? "")),
        );
        data.append("resume", file);
        return api
          .post("/public/careers/apply", data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              if (!onProgress) return;
              const total = e.total || 0;
              const loaded = e.loaded || 0;
              onProgress(total ? Math.round((loaded / total) * 100) : 0);
            },
          })
          .then(unwrap);
      },
    },
    workspaces: {
      list: () => api.get("/workspaces").then(unwrap),
      create: (payload) => api.post("/workspaces", payload).then(unwrap),
      overview: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/overview`)
          .then(unwrap),
      update: (workspaceId, payload) =>
        api
          .patch(`/workspaces/${encodeURIComponent(workspaceId)}`, payload)
          .then(unwrap),
      members: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/members`)
          .then(unwrap),
      inviteMember: (workspaceId, payload) =>
        api
          .post(
            `/workspaces/${encodeURIComponent(workspaceId)}/members`,
            payload,
          )
          .then(unwrap),
      updateMember: (workspaceId, memberId, payload) =>
        api
          .patch(
            `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
            payload,
          )
          .then(unwrap),
      usage: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/usage`)
          .then(unwrap),
      activity: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/activity`)
          .then(unwrap),
      billingCurrent: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/billing/current`)
          .then(unwrap),
      wallet: (workspaceId) =>
        api
          .get(`/workspaces/${encodeURIComponent(workspaceId)}/wallet`)
          .then(unwrap),
    },
    credentials: {
      getWhatsApp: () => api.get("/credentials/whatsapp").then(unwrap),
      upsertWhatsApp: (payload) =>
        api.put("/credentials/whatsapp", payload).then(unwrap),
      deleteWhatsApp: () => api.delete("/credentials/whatsapp").then(unwrap),
    },
    templates: {
      list: (params) => api.get("/templates", { params }).then(unwrap),
      approved: () => api.get("/templates/approved").then(unwrap),
      create: (payload) =>
        api.post("/templates", payload, { timeout: 180000 }).then(unwrap),
      get: (id) => api.get(`/templates/${id}`).then(unwrap),
      update: (id, payload) =>
        api.put(`/templates/${id}`, payload).then(unwrap),
      remove: (id) => api.delete(`/templates/${id}`).then(unwrap),
      submit: (id) =>
        api
          .post(`/templates/${id}/submit`, null, { timeout: 180000 })
          .then(unwrap),
      status: (id) => api.get(`/templates/${id}/status`).then(unwrap),
      syncMeta: (payload) =>
        api.post("/templates/sync-meta", payload || {}).then(unwrap),
      refreshWhatsApp: () =>
        api.post("/integrations/whatsapp/templates/refresh", {}).then(unwrap),
      uploadMedia: (file, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        return api
          .post("/templates/media", data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              if (!onProgress) return;
              const total = e.total || 0;
              const loaded = e.loaded || 0;
              onProgress(total ? Math.round((loaded / total) * 100) : 0);
            },
          })
          .then(unwrap);
      },
      downloadMediaByHandle: (handle) =>
        api
          .get(`/templates/media/handle/${encodeURIComponent(handle)}`, {
            responseType: "blob",
          })
          .then((r) => r.data),
    },
    messages: {
      send: (payload) => api.post("/messages/send", payload).then(unwrap),
      sendText: (payload) =>
        api.post("/messages/send-text", payload).then(unwrap),
      sendMedia: (payload) =>
        api.post("/messages/send-media", payload).then(unwrap),
      bulk: (payload) => api.post("/messages/bulk", payload).then(unwrap),
      logs: (params) => api.get("/messages/logs", { params }).then(unwrap),
      status: (waId) =>
        api.get(`/messages/status/${encodeURIComponent(waId)}`).then(unwrap),
      byPhone: (phone, params) =>
        api.get(`/messages/${phone}`, { params }).then(unwrap),
      downloadMedia: (id) =>
        api
          .get(`/messages/media/${encodeURIComponent(id)}`, {
            responseType: "blob",
          })
          .then((r) => r.data),
      uploadMedia: (file, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        return api
          .post("/messages/media", data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              if (!onProgress) return;
              const total = e.total || 0;
              const loaded = e.loaded || 0;
              onProgress(total ? Math.round((loaded / total) * 100) : 0);
            },
          })
          .then(unwrap);
      },
    },
    media: {
      upload: (file, mediaType, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        data.append("mediaType", mediaType);
        return api
          .post("/media/upload", data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              if (!onProgress) return;
              const total = e.total || 0;
              const loaded = e.loaded || 0;
              onProgress(total ? Math.round((loaded / total) * 100) : 0);
            },
          })
          .then(unwrap);
      },
      list: (params) => api.get("/media", { params }).then(unwrap),
      get: (id) => api.get(`/media/${encodeURIComponent(id)}`).then(unwrap),
      update: (id, payload) =>
        api.patch(`/media/${encodeURIComponent(id)}`, payload).then(unwrap),
      remove: (id) =>
        api.delete(`/media/${encodeURIComponent(id)}`).then(unwrap),
    },
    analytics: {
      overview: (params) =>
        api.get("/analytics/overview", { params }).then(unwrap),
      template: (id) => api.get(`/analytics/template/${id}`).then(unwrap),
      campaign: (id) => api.get(`/analytics/campaign/${encodeURIComponent(id)}`).then(unwrap),
      customer: (id) => api.get(`/analytics/customer/${encodeURIComponent(id)}`).then(unwrap),
      agents: () => api.get("/analytics/agents").then(unwrap),
    },
    meta: {
      status: () => api.get("/meta/status").then(unwrap),
      subscriptionHealth: () =>
        api.get("/meta/subscription-health").then(unwrap),
      embeddedSignupExchange: (payload) =>
        api
          .post("/integrations/whatsapp/embedded-signup/exchange", payload)
          .then(unwrap),
      connection: () =>
        api.get("/integrations/whatsapp/connection").then(unwrap),
      refreshConnectionMetadata: () =>
        api
          .post("/integrations/whatsapp/connection/refresh-metadata")
          .then(unwrap),
      disconnect: () =>
        api.post("/integrations/whatsapp/disconnect").then(unwrap),
      updateProfile: (payload) =>
        api.put("/meta/profile", payload).then(unwrap),
      uploadProfilePicture: (file) => {
        const data = new FormData();
        data.append("file", file);
        return api
          .post("/meta/profile-picture", data, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(unwrap);
      },
      listFlows: (params) => api.get("/meta/flows", { params }).then(unwrap),
      createFlow: (payload) => api.post("/meta/flows", payload).then(unwrap),
      uploadFlowJson: (flowId, flowJson) =>
        api
          .post(`/meta/flows/${encodeURIComponent(flowId)}/assets`, {
            flowJson,
          })
          .then(unwrap),
      publishFlow: (flowId) =>
        api
          .post(`/meta/flows/${encodeURIComponent(flowId)}/publish`)
          .then(unwrap),
    },
    links: {
      create: (payload) => api.post("/links", payload).then(unwrap),
      tracked: {
        list: () => api.get("/links/tracked").then(unwrap),
        create: (payload) => api.post("/links/tracked", payload).then(unwrap),
        update: (id, payload) =>
          api.put(`/links/tracked/${id}`, payload).then(unwrap),
        remove: (id) => api.delete(`/links/tracked/${id}`).then(unwrap),
        analytics: (id, params) =>
          api.get(`/links/tracked/${id}/analytics`, { params }).then(unwrap),
        qrSvgUrl: (id) =>
          `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.svg`,
        qrPngUrl: (id) =>
          `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.png`,
      },
    },
    billing: {
      plans: () => api.get("/billing/plans").then(unwrap),
      current: () => api.get("/billing/current").then(unwrap),
      history: (params) => api.get("/billing/history", { params }).then(unwrap),
      invoices: (params) => api.get("/billing/invoices", { params }).then(unwrap),
      timeline: (params) => api.get("/billing/timeline", { params }).then(unwrap),
      renewalStatus: () => api.get("/billing/renewal-status").then(unwrap),
      paymentDue: () => api.get("/billing/payment-due").then(unwrap),
      renewalSettings: () => api.get("/billing/renewal-settings").then(unwrap),
      paymentMethod: () => api.get("/billing/payment-method").then(unwrap),
      checkout: (payload) => api.post("/billing/checkout", payload).then(unwrap),
      verifyPayment: (payload) => api.post("/billing/verify-payment", payload).then(unwrap),
      renew: (payload) => api.post("/billing/renew", payload || {}).then(unwrap),
      retryRenewal: (payload) => api.post("/billing/retry-renewal", payload || {}).then(unwrap),
      enableAutoRenew: () => api.post("/billing/auto-renew/enable", {}).then(unwrap),
      confirmAutoRenew: (payload) => api.post("/billing/auto-renew/confirm", payload).then(unwrap),
      disableAutoRenew: () => api.post("/billing/auto-renew/disable", {}).then(unwrap),
      toggleAutoRenew: (payload) => api.post("/billing/auto-renew/toggle", payload).then(unwrap),
      changePaymentMethod: () => api.post("/billing/change-payment-method", {}).then(unwrap),
      scheduleDowngrade: (payload) => api.post("/billing/schedule-downgrade", payload).then(unwrap),
      cancelScheduledChange: () => api.delete("/billing/scheduled-change").then(unwrap),
    },
    wallet: {
      get: () => api.get("/wallet").then(unwrap),
      createRechargeOrder: (payload) =>
        api.post("/wallet/recharge/order", payload).then(unwrap),
      history: (params) => api.get("/wallet/history", { params }).then(unwrap),
    },
    campaigns: {
      list: (params) => api.get("/campaigns", { params }).then(unwrap),
      get: (id) => api.get(`/campaigns/${id}`).then(unwrap),
      estimate: (payload) =>
        api.post("/campaigns/estimate", payload).then(unwrap),
      metrics: (id) => api.get(`/campaigns/${id}/metrics`).then(unwrap),
      messages: (id, params) =>
        api.get(`/campaigns/${id}/messages`, { params }).then(unwrap),
      replies: (id, params) =>
        api.get(`/campaigns/${id}/replies`, { params }).then(unwrap),
      creditUsage: (id) =>
        api.get(`/campaigns/${id}/credit-usage`).then(unwrap),
      failedRecipients: (id) =>
        api.get(`/campaigns/${id}/failed-recipients`).then(unwrap),
      retryFailed: (id) =>
        api.post(`/campaigns/${id}/retry-failed`).then(unwrap),
      remove: (id, params) =>
        api.delete(`/campaigns/${id}`, { params }).then(unwrap),
      action: (id, action) =>
        api.post(`/campaigns/${id}/action`, { action }).then(unwrap),
      create: (payload) => api.post("/campaigns", payload).then(unwrap),
    },
    audiences: {
      list: () => api.get("/audiences").then(unwrap),
      get: (id) => api.get(`/audiences/${encodeURIComponent(id)}`).then(unwrap),
      create: (payload) => api.post("/audiences", payload).then(unwrap),
      update: (id, payload) => api.put(`/audiences/${encodeURIComponent(id)}`, payload).then(unwrap),
      remove: (id) => api.delete(`/audiences/${encodeURIComponent(id)}`).then(unwrap),
      preview: (id, params) => api.get(`/audiences/${encodeURIComponent(id)}/preview`, { params }).then(unwrap),
    },
    savedFilters: {
      list: () => api.get("/saved-filters").then(unwrap),
      create: (payload) => api.post("/saved-filters", payload).then(unwrap),
      update: (id, payload) => api.put(`/saved-filters/${encodeURIComponent(id)}`, payload).then(unwrap),
      remove: (id) => api.delete(`/saved-filters/${encodeURIComponent(id)}`).then(unwrap),
    },
    reports: {
      apiCampaigns: (params) =>
        api.get("/reports/api-campaigns", { params }).then(unwrap),
      apiCampaign: (id) =>
        api
          .get(`/reports/api-campaigns/${encodeURIComponent(id)}`)
          .then(unwrap),
      apiMessages: (params) =>
        api.get("/reports/api-messages", { params }).then(unwrap),
      apiMessage: (id) =>
        api.get(`/reports/api-messages/${encodeURIComponent(id)}`).then(unwrap),
    },
    externalChatWebhooks: {
      list: () => api.get("/api-keys/external-chat/webhooks").then(unwrap),
      create: (payload) =>
        api.post("/api-keys/external-chat/webhooks", payload).then(unwrap),
      update: (id, payload) =>
        api
          .patch(`/api-keys/external-chat/webhooks/${encodeURIComponent(id)}`, payload)
          .then(unwrap),
      remove: (id) =>
        api.delete(`/api-keys/external-chat/webhooks/${encodeURIComponent(id)}`).then(unwrap),
      rotateSecret: (id) =>
        api
          .post(`/api-keys/external-chat/webhooks/${encodeURIComponent(id)}/rotate-secret`)
          .then(unwrap),
    },
    conversations: {
      list: (params) => api.get("/conversations", { params }).then(unwrap),
      get: (phone) => api.get(`/conversations/${phone}`).then(unwrap),
      read: (phone) => api.post(`/conversations/${phone}/read`).then(unwrap),
      clear: (phone) => api.delete(`/conversations/${phone}`).then(unwrap),
    },
    contacts: {
      list: (params) => api.get("/contacts", { params }).then(unwrap),
      tags: () => api.get("/contacts/tags").then(unwrap),
      lists: () => api.get("/contacts/lists").then(unwrap),
      createList: (payload) => api.post("/contacts/lists", payload).then(unwrap),
      updateList: (id, payload) =>
        api.patch(`/contacts/lists/${encodeURIComponent(id)}`, payload).then(unwrap),
      removeList: (id) =>
        api.delete(`/contacts/lists/${encodeURIComponent(id)}`).then(unwrap),
      attributes: (params) =>
        api.get("/contacts/attributes", { params }).then(unwrap),
      attribute: (key) =>
        api.get(`/contacts/attributes/${encodeURIComponent(key)}`).then(unwrap),
      createAttribute: (payload) =>
        api.post("/contacts/attributes", payload).then(unwrap),
      updateAttribute: (key, payload) =>
        api
          .patch(`/contacts/attributes/${encodeURIComponent(key)}`, payload)
          .then(unwrap),
      archiveAttribute: (key) =>
        api
          .delete(`/contacts/attributes/${encodeURIComponent(key)}`)
          .then(unwrap),
      get: (id) => api.get(`/contacts/${id}`).then(unwrap),
      lookupByPhone: (phone) =>
        api.get(`/contacts/lookup/${phone}`).then(unwrap),
      create: (payload) => api.post("/contacts", payload).then(unwrap),
      importCsv: (payload) => api.post("/contacts/import-csv", payload).then(unwrap),
      update: (id, payload) => api.put(`/contacts/${id}`, payload).then(unwrap),
      patchAttributes: (id, attributes) =>
        api.patch(`/contacts/${id}/attributes`, { attributes }).then(unwrap),
      replaceAttributes: (id, attributes, preserveLegacy = true) =>
        api
          .put(
            `/contacts/${id}/attributes`,
            { attributes },
            { params: { preserveLegacy } },
          )
          .then(unwrap),
      removeAttributeValue: (id, key) =>
        api
          .delete(`/contacts/${id}/attributes/${encodeURIComponent(key)}`)
          .then(unwrap),
      remove: (id) => api.delete(`/contacts/${id}`).then(unwrap),
      filterPreview: (payload) => api.post("/contacts/filter-preview", payload).then(unwrap),
      exportByFilter: (payload) =>
        api.post("/contacts/export", payload, { responseType: "blob" }),
      exportCsv: (contactIds) =>
        api.post(
          "/contacts/export-csv",
          { contactIds: Array.isArray(contactIds) ? contactIds : [] },
          { responseType: "blob" },
        ),
    },
    automation: {
      triggerEvent: (payload) =>
        api.post("/trigger-event", payload).then(unwrap),
    },
    automationFlows: {
      list: (params) => api.get("/flows", { params }).then(unwrap),
      get: (flowId) =>
        api.get(`/flows/${encodeURIComponent(flowId)}`).then(unwrap),
      create: (payload) => api.post("/flows", payload).then(unwrap),
      updateMetadata: (flowId, payload) =>
        api.patch(`/flows/${encodeURIComponent(flowId)}`, payload).then(unwrap),
      saveDraft: (flowId, payload) =>
        api
          .put(`/flows/${encodeURIComponent(flowId)}/draft`, payload)
          .then(unwrap),
      validate: (flowId) =>
        api.post(`/flows/${encodeURIComponent(flowId)}/validate`).then(unwrap),
      testApiRequest: (payload) =>
        api.post("/flows/test-api-request", payload).then(unwrap),
      testMediaNode: (payload) =>
        api.post("/flows/test-media-node", payload).then(unwrap),
      publish: (flowId) =>
        api.post(`/flows/${encodeURIComponent(flowId)}/publish`).then(unwrap),
      pause: (flowId) =>
        api.post(`/flows/${encodeURIComponent(flowId)}/pause`).then(unwrap),
      resume: (flowId) =>
        api.post(`/flows/${encodeURIComponent(flowId)}/resume`).then(unwrap),
      archive: (flowId) =>
        api.post(`/flows/${encodeURIComponent(flowId)}/archive`).then(unwrap),
      remove: (flowId) =>
        api.delete(`/flows/${encodeURIComponent(flowId)}`).then(unwrap),
      versions: (flowId) =>
        api.get(`/flows/${encodeURIComponent(flowId)}/versions`).then(unwrap),
    },
    aiAgents: {
      list: (params) => api.get("/ai-agents", { params }).then(unwrap),
      create: (payload) => api.post("/ai-agents", payload).then(unwrap),
      update: (agentId, payload) =>
        api.patch(`/ai-agents/${encodeURIComponent(agentId)}`, payload).then(unwrap),
      remove: (agentId) =>
        api.delete(`/ai-agents/${encodeURIComponent(agentId)}`).then(unwrap),
      testMessage: (agentId, payload) =>
        api.post(`/ai-agents/${encodeURIComponent(agentId)}/test-message`, payload).then(unwrap),
      conversations: (agentId) =>
        api.get(`/ai-agents/${encodeURIComponent(agentId)}/conversations`).then(unwrap),
      clearTestMemory: (agentId, payload) =>
        api.delete(`/ai-agents/${encodeURIComponent(agentId)}/test-memory`, { data: payload }).then(unwrap),
      knowledgeList: (agentId) =>
        api.get(`/ai-agents/${encodeURIComponent(agentId)}/knowledge`).then(unwrap),
      knowledgeCreate: (agentId, payload) =>
        api.post(`/ai-agents/${encodeURIComponent(agentId)}/knowledge`, payload).then(unwrap),
      knowledgeUpload: (agentId, file, onProgress) => {
        const data = new FormData();
        data.append("file", file);
        return api
          .post(`/ai-agents/${encodeURIComponent(agentId)}/knowledge/upload`, data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              if (!onProgress) return;
              const total = e.total || 0;
              const loaded = e.loaded || 0;
              onProgress(total ? Math.round((loaded / total) * 100) : 0);
            },
          })
          .then(unwrap);
      },
      knowledgeUpdate: (agentId, sourceId, payload) =>
        api.put(`/ai-agents/${encodeURIComponent(agentId)}/knowledge/${encodeURIComponent(sourceId)}`, payload).then(unwrap),
      knowledgeRemove: (agentId, sourceId) =>
        api.delete(`/ai-agents/${encodeURIComponent(agentId)}/knowledge/${encodeURIComponent(sourceId)}`).then(unwrap),
      knowledgeReindex: (agentId, sourceId) =>
        api.post(`/ai-agents/${encodeURIComponent(agentId)}/knowledge/${encodeURIComponent(sourceId)}/reindex`).then(unwrap),
    },
    preferences: {
      automationBuilder: () =>
        api.get("/preferences/automation-builder").then(unwrap),
      updateAutomationBuilder: (payload) =>
        api.patch("/preferences/automation-builder", payload).then(unwrap),
    },
  };
}
