import { useState } from "react";
import { API } from "@api/api";

type Args = {
  contactDetail: any | null;
  refreshListSilently: () => Promise<void>;
  setContactDetail: (value: any | null) => void;
  setError: (message: string) => void;
  setOk: (message: string | null) => void;
  urlPhone: string;
};

export function useContactEditor({ contactDetail, refreshListSilently, setContactDetail, setError, setOk, urlPhone }: Args) {
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: "", email: "", language: "", tags: "", notes: "" });

  const openEdit = () => {
    const contact = contactDetail || {};
    setEditForm({
      name: contact?.name || "",
      email: contact?.email || "",
      language: contact?.language || "",
      tags: Array.isArray(contact?.tags) ? contact.tags.join(", ") : "",
      notes: contact?.notes || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!urlPhone) return;
    setEditBusy(true);
    try {
      const payload: any = {
        phone: urlPhone,
        name: String(editForm.name || "").trim(),
        email: String(editForm.email || "").trim(),
        language: String(editForm.language || "").trim(),
        notes: String(editForm.notes || "").trim(),
        tags: String(editForm.tags || "").split(",").map((tag: string) => tag.trim()).filter(Boolean),
      };
      const res = contactDetail?._id ? await API.contacts.update(String(contactDetail._id), payload) : await API.contacts.create(payload);
      setContactDetail(res?.contact || null);
      setEditOpen(false);
      setOk("Contact saved");
      window.setTimeout(() => setOk(null), 2000);
      await refreshListSilently();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save contact");
    } finally {
      setEditBusy(false);
    }
  };

  return { editBusy, editForm, editOpen, openEdit, saveEdit, setEditForm, setEditOpen };
}

