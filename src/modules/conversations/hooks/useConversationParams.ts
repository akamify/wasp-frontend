import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function useConversationParams() {
  const { phone: urlPhone = "" } = useParams();
  const navigate = useNavigate();

  const waLink = useMemo(() => {
    const phone = String(urlPhone || "").replace(/[^\d]/g, "");
    return phone ? `https://wa.me/${phone}` : "";
  }, [urlPhone]);

  return { navigate, urlPhone, waLink };
}

