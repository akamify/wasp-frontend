import { useState } from "react";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";

type OtpPurpose = "" | "change_email" | "change_name";

export function useProfilePage() {
  const { user, workspace, refreshMe } = useAuth();
  const { toast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [profileOtp, setProfileOtp] = useState("");
  const [profileOtpBusy, setProfileOtpBusy] = useState(false);
  const [profileOtpPurpose, setProfileOtpPurpose] = useState<OtpPurpose>("");
  const [otpSent, setOtpSent] = useState(false);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

  const formatDate = (date?: string) => {
    if (!date) return "â€”";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openEditModal = () => {
    setEditForm({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" });
    setProfileOtp("");
    setOtpSent(false);
    setProfileOtpPurpose("");
    setEditModalOpen(true);
  };

  const closeEditModal = () => setEditModalOpen(false);

  async function handleSaveProfile() {
    if (!editForm.name.trim()) {
      toast("Name is required", "warning");
      return;
    }

    const currentEmail = String(user?.email || "").trim().toLowerCase();
    const nextEmail = String(editForm.email || "").trim().toLowerCase();
    const currentName = String(user?.name || "").trim();
    const nextName = String(editForm.name || "").trim();

    if (nextEmail && nextEmail !== currentEmail) {
      toast("Please verify OTP to change email.", "warning");
      return;
    }
    if (nextName && currentName && nextName !== currentName) {
      toast("Please verify OTP to change name.", "warning");
      return;
    }

    setEditBusy(true);
    try {
      await API.auth.updateProfile({
        name: nextName,
        phone: editForm.phone,
      });
      await refreshMe();
      toast("Profile updated successfully", "success");
      setEditModalOpen(false);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setEditBusy(false);
    }
  }

  async function requestOtp(purpose: Exclude<OtpPurpose, "">) {
    setProfileOtpBusy(true);
    try {
      if (purpose === "change_email") {
        const nextEmail = String(editForm.email || "").trim().toLowerCase();
        if (!nextEmail) {
          toast("New email is required", "warning");
          return;
        }
        await API.auth.requestProfileOtp({ purpose, email: nextEmail });
      } else {
        const nextName = String(editForm.name || "").trim();
        if (!nextName) {
          toast("New name is required", "warning");
          return;
        }
        await API.auth.requestProfileOtp({ purpose, name: nextName });
      }
      setProfileOtpPurpose(purpose);
      setOtpSent(true);
      toast("OTP sent to your registered email", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setProfileOtpBusy(false);
    }
  }

  async function verifyOtp() {
    const otp = String(profileOtp || "").trim();
    if (!otp) {
      toast("Enter OTP", "warning");
      return;
    }
    setProfileOtpBusy(true);
    try {
      await API.auth.verifyProfileOtp({ otp });
      await refreshMe({ silent: true } as any);
      setProfileOtp("");
      setOtpSent(false);
      setProfileOtpPurpose("");
      toast("OTP verified successfully", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "OTP verification failed", "error");
    } finally {
      setProfileOtpBusy(false);
    }
  }

  async function copyWorkspaceId() {
    const id = String(workspace?.id || "").trim();
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopiedWorkspaceId(true);
    toast("Workspace ID copied", "success");
    window.setTimeout(() => setCopiedWorkspaceId(false), 1200);
  }

  return {
    user,
    workspace,
    editModalOpen,
    editBusy,
    editForm,
    setEditForm,
    profileOtp,
    setProfileOtp,
    profileOtpBusy,
    profileOtpPurpose,
    otpSent,
    copiedWorkspaceId,
    formatDate,
    openEditModal,
    closeEditModal,
    handleSaveProfile,
    requestOtp,
    verifyOtp,
    copyWorkspaceId,
  };
}
